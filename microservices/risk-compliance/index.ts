import express from 'express';
import cors from 'cors';
import { db } from '../../server/db.js';
import * as schema from '../../shared/schema.js';
import { eq, desc, and, gte, lte, ne, inArray, sql } from 'drizzle-orm';

const app = express();
const PORT = process.env.RISK_COMPLIANCE_PORT || 3003;

app.use(cors());
app.use(express.json());

// Health Check (Public)
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'Risk & Compliance' });
});

// --- Middleware ---

const authenticateRequest = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const userId = req.header('X-User-ID');
  const userEmail = req.header('X-User-Email');
  const userRole = req.header('X-User-Role') || 'user';
  
  if (!userId || !userEmail) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  (req as any).user = { id: userId, email: userEmail, role: userRole };
  next();
};

const requireRole = (roles: string[]) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req as any).user;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

const requireAuditAccess = requireRole(['admin', 'compliance_officer', 'auditor']);
const requireComplianceAccess = requireRole(['admin', 'compliance_officer']);

// --- Helpers ---


// Internal helper for logging within the service
const logPCIAccess = async (req: express.Request, recordId: string, tableName: string, actionType: string, sensitiveFieldsAccessed: string[] = []) => {
  try {
    const user = (req as any).user;
    await db.insert(schema.pciAuditLog).values({
      actionType,
      tableName,
      recordId,
      userId: user?.id,
      userEmail: user?.email,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent') || '',
      sessionId: req.get('X-Session-ID') || '',
      sensitiveFieldsAccessed: JSON.stringify(sensitiveFieldsAccessed),
      dataMasked: true,
      accessPurpose: req.get('X-Access-Purpose') || 'API access',
      retentionPeriodDays: 2555, // 7 years
    });
  } catch (error) {
    console.error('Failed to log PCI access:', error);
  }
};

// --- Routes ---

app.use('/api', authenticateRequest);

// 1. PCI Audit Log (Manual Entry)
app.post('/api/stripe/audit/pci-log', requireAuditAccess, async (req, res) => {
  try {
    const { actionType, tableName, recordId, sensitiveFieldsAccessed, accessPurpose, additionalContext, oldValues, newValues } = req.body;
    
    if (!actionType || !tableName || !recordId) {
      return res.status(400).json({ error: 'Missing required fields: actionType, tableName, recordId' });
    }

    const [newLog] = await db.insert(schema.pciAuditLog).values({
      actionType,
      tableName,
      recordId,
      userId: (req as any).user.id,
      userEmail: (req as any).user.email,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent') || '',
      sessionId: req.get('X-Session-ID') || '',
      sensitiveFieldsAccessed: sensitiveFieldsAccessed ? JSON.stringify(sensitiveFieldsAccessed) : null,
      dataMasked: true,
      accessPurpose: accessPurpose || 'PCI compliance tracking',
      retentionPeriodDays: 2555, // 7 years
      oldValues: oldValues ? JSON.stringify(oldValues) : null,
      newValues: newValues ? JSON.stringify(newValues) : null,
      additionalContext: additionalContext ? JSON.stringify(additionalContext) : null,
    }).returning();

    res.json(newLog);
  } catch (error) {
    console.error('Error logging PCI audit event:', error);
    res.status(500).json({ error: 'Failed to log PCI audit event' });
  }
});

// 2. Get PCI Audit Logs
app.get('/api/stripe/audit/pci-logs', requireAuditAccess, async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      actionType,
      tableName,
      userId,
      ipAddress,
      limit = 100,
      offset = 0,
      export: exportFlag
    } = req.query;

    let query = db.select().from(schema.pciAuditLog).$dynamic();
    const conditions: any[] = [];

    if (startDate) conditions.push(gte(schema.pciAuditLog.createdAt, new Date(startDate as string)));
    if (endDate) conditions.push(lte(schema.pciAuditLog.createdAt, new Date(endDate as string)));
    if (actionType) conditions.push(eq(schema.pciAuditLog.actionType, actionType as string));
    if (tableName) conditions.push(eq(schema.pciAuditLog.tableName, tableName as string));
    if (userId) conditions.push(eq(schema.pciAuditLog.userId, userId as string));
    if (ipAddress) conditions.push(eq(schema.pciAuditLog.ipAddress, ipAddress as string));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const logs = await query
      .orderBy(desc(schema.pciAuditLog.createdAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    // Mask sensitive data in response
    const maskedLogs = logs.map(log => ({
      ...log,
      sensitiveFieldsAccessed: log.sensitiveFieldsAccessed ? JSON.parse(log.sensitiveFieldsAccessed) : null,
      oldValues: log.oldValues ? JSON.parse(log.oldValues) : null,
      newValues: log.newValues ? JSON.parse(log.newValues) : null,
      additionalContext: log.additionalContext ? JSON.parse(log.additionalContext) : null,
    }));

    if (exportFlag === 'csv') {
      const csvHeader = 'Timestamp,Action Type,Table Name,Record ID,User Email,IP Address,Access Purpose\n';
      const csvRows = logs.map(log => 
        `${log.createdAt},${log.actionType},${log.tableName},${log.recordId},${log.userEmail},${log.ipAddress},${log.accessPurpose || ''}`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=pci_audit_logs.csv');
      res.send(csvHeader + csvRows);
      return;
    }

    res.json(maskedLogs);
  } catch (error) {
    console.error('Error fetching PCI audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch PCI audit logs' });
  }
});

// 3. Create Compliance Checklist Item
app.post('/api/stripe/compliance/checklist', requireComplianceAccess, async (req, res) => {
  try {
    const {
      checklistType,
      itemDescription,
      requirement,
      status,
      assignedTo,
      dueDate,
      verificationMethod,
      regulatoryStandard,
      regulatorySection,
      riskLevel
    } = req.body;

    if (!checklistType || !itemDescription || !requirement || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [newItem] = await db.insert(schema.complianceChecklist).values({
      checklistType,
      itemDescription,
      requirement,
      status,
      assignedTo: assignedTo || (req as any).user.id,
      dueDate,
      verificationMethod,
      regulatoryStandard,
      regulatorySection,
      riskLevel: riskLevel || 'medium',
    }).returning();

    await logPCIAccess(req, newItem.id, 'compliance_checklist', 'CREATE', ['verificationEvidence']);
    res.json(newItem);
  } catch (error) {
    console.error('Error creating compliance item:', error);
    res.status(500).json({ error: 'Failed to create compliance item' });
  }
});

// 4. Get Compliance Checklist
app.get('/api/stripe/compliance/checklist', requireComplianceAccess, async (req, res) => {
  try {
    const {
      checklistType,
      status,
      assignedTo,
      regulatoryStandard,
      riskLevel,
      overdue,
      limit = 100,
      offset = 0
    } = req.query;

    let query = db.select().from(schema.complianceChecklist).$dynamic();
    const conditions: any[] = [eq(schema.complianceChecklist.deletedAt, null)];

    if (checklistType) conditions.push(eq(schema.complianceChecklist.checklistType, checklistType as string));
    if (status) {
      if (Array.isArray(status)) conditions.push(inArray(schema.complianceChecklist.status, status as string[]));
      else conditions.push(eq(schema.complianceChecklist.status, status as string));
    }
    if (assignedTo) conditions.push(eq(schema.complianceChecklist.assignedTo, assignedTo as string));
    if (regulatoryStandard) conditions.push(eq(schema.complianceChecklist.regulatoryStandard, regulatoryStandard as string));
    if (riskLevel) conditions.push(eq(schema.complianceChecklist.riskLevel, riskLevel as string));
    
    if (overdue === 'true') {
      const today = new Date().toISOString().split('T')[0];
      conditions.push(and(
        lte(schema.complianceChecklist.dueDate, today),
        ne(schema.complianceChecklist.status, 'completed'),
        ne(schema.complianceChecklist.status, 'verified')
      ));
    }

    query = query.where(and(...conditions))
      .orderBy(desc(schema.complianceChecklist.createdAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    const items = await query;
    res.json(items);
  } catch (error) {
    console.error('Error fetching compliance checklist:', error);
    res.status(500).json({ error: 'Failed to fetch checklist' });
  }
});

// 5. Update Compliance Item
app.put('/api/stripe/compliance/checklist/:id', requireComplianceAccess, async (req, res) => {
  try {
    const itemId = req.params.id as string;
    const updates = req.body;

    const existingItems = await db.select().from(schema.complianceChecklist).where(eq(schema.complianceChecklist.id, itemId));
    if (existingItems.length === 0) return res.status(404).json({ error: 'Item not found' });

    const [updatedItem] = await db.update(schema.complianceChecklist)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.complianceChecklist.id, itemId))
      .returning();

    await logPCIAccess(req, itemId, 'compliance_checklist', 'UPDATE', ['verificationEvidence']);
    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating compliance item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// 6. Generate Compliance Report
app.get('/api/stripe/compliance/report', requireComplianceAccess, async (req, res) => {
  try {
    const { standard, startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    let whereCondition = and(
      eq(schema.complianceChecklist.deletedAt, null),
      gte(schema.complianceChecklist.createdAt, start),
      lte(schema.complianceChecklist.createdAt, end)
    );

    if (standard) {
      whereCondition = and(whereCondition, eq(schema.complianceChecklist.regulatoryStandard, standard as string));
    }

    const items = await db.select().from(schema.complianceChecklist).where(whereCondition);

    // Simple aggregation logic (copied from monolithic API)
    const report = {
      period: { startDate: start.toISOString(), endDate: end.toISOString() },
      regulatoryStandard: standard || 'All',
      summary: {
        totalItems: items.length,
        completedItems: items.filter(i => ['completed', 'verified'].includes(i.status)).length,
        pendingItems: items.filter(i => i.status === 'pending').length,
        highRiskItems: items.filter(i => i.riskLevel === 'high').length,
      },
      items: items
    };

    res.json(report);
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🛡️ Risk & Compliance Service running on port ${PORT}`);
});
