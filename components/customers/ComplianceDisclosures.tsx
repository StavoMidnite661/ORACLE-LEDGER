import React, { useState, useEffect } from 'react';
import { FileText, Shield, Download, Eye, User, Calendar, CheckCircle, AlertTriangle, Lock, Globe, Gavel, CreditCard, Building2, Save, Print, Send } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Modal } from '@/components/shared/Modal';
import { Badge } from '@/components/shared/Badge';
import { Checkbox } from '@/components/shared/Checkbox';
import { Progress } from '@/components/shared/Progress';

interface ComplianceDocument {
  id: string;
  type: 'privacy_policy' | 'terms_of_service' | 'nacha_authorization' | 'pci_compliance' | 'bank_authorization' | 'auto_debit_consent';
  title: string;
  version: string;
  effectiveDate: string;
  lastUpdated: string;
  content: string;
  htmlContent: string;
  isActive: boolean;
  requiresSignature: boolean;
  signatureRequired: {
    digital: boolean;
    handwritten: boolean;
    witness: boolean;
  };
  jurisdiction: string[];
  language: string;
}

interface SignatureRecord {
  id: string;
  documentId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  signatureType: 'digital' | 'handwritten' | 'electronic_consent';
  signatureData?: string;
  witnessName?: string;
  witnessEmail?: string;
  signedAt: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  validity: 'valid' | 'expired' | 'revoked';
  auditTrail: {
    action: string;
    timestamp: string;
    details: string;
  }[];
}

interface ConsentRecord {
  id: string;
  customerId: string;
  documentId: string;
  consentType: 'privacy' | 'terms' | 'nacha' | 'auto_debit' | 'data_processing' | 'marketing';
  status: 'granted' | 'denied' | 'withdrawn' | 'expired';
  grantedAt?: string;
  withdrawnAt?: string;
  expiresAt?: string;
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, any>;
}

interface ComplianceFormData {
  documentType: string;
  customerName: string;
  customerEmail: string;
  customerAddress: string;
  customerPhone: string;
  // NACHA specific
  bankAccountOwner: string;
  bankName: string;
  routingNumber: string;
  accountNumber: string;
  accountType: 'checking' | 'savings';
  // Consent fields
  consentGiven: boolean;
  consentTimestamp: string;
  // Signature fields
  signatureType: 'digital' | 'electronic';
  signature: string;
  witnessName?: string;
  witnessEmail?: string;
}

const ComplianceDisclosures: React.FC = () => {
  const [documents, setDocuments] = useState<ComplianceDocument[]>([]);
  const [signatures, setSignatures] = useState<SignatureRecord[]>([]);
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<ComplianceDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'documents' | 'signatures' | 'consents' | 'audit'>('documents');

  const [formData, setFormData] = useState<ComplianceFormData>({
    documentType: '',
    customerName: '',
    customerEmail: '',
    customerAddress: '',
    customerPhone: '',
    bankAccountOwner: '',
    bankName: '',
    routingNumber: '',
    accountNumber: '',
    accountType: 'checking',
    consentGiven: false,
    consentTimestamp: new Date().toISOString(),
    signatureType: 'digital',
    signature: '',
    witnessName: '',
    witnessEmail: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock data
  useEffect(() => {
    const mockDocuments: ComplianceDocument[] = [
      {
        id: 'doc_1',
        type: 'privacy_policy',
        title: 'Privacy Policy',
        version: '2.1',
        effectiveDate: '2024-01-01',
        lastUpdated: '2024-10-01',
        content: `PRIVACY POLICY

This Privacy Policy describes how ORACLE-LEDGER collects, uses, and protects your personal information.

1. INFORMATION WE COLLECT
We collect information you provide directly to us, such as when you create an account, make a payment, or contact us for support.

2. HOW WE USE YOUR INFORMATION
We use the information we collect to:
- Provide, maintain, and improve our services
- Process transactions and send related information
- Send technical notices, updates, and support messages
- Respond to your comments and questions
- Comply with applicable laws and regulations

3. INFORMATION SHARING
We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.

4. DATA SECURITY
We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.

5. YOUR RIGHTS
You have the right to access, update, or delete your personal information. Contact us to exercise these rights.

6. CONTACT US
If you have questions about this Privacy Policy, please contact us at privacy@oracleledger.com`,

        htmlContent: `<h1>Privacy Policy</h1><p>This Privacy Policy describes how ORACLE-LEDGER collects, uses, and protects your personal information.</p><h2>1. INFORMATION WE COLLECT</h2><p>We collect information you provide directly to us...</p>`,
        isActive: true,
        requiresSignature: false,
        signatureRequired: {
          digital: false,
          handwritten: false,
          witness: false,
        },
        jurisdiction: ['US', 'EU'],
        language: 'en',
      },
      {
        id: 'doc_2',
        type: 'nacha_authorization',
        title: 'NACHA ACH Authorization',
        version: '1.0',
        effectiveDate: '2024-01-01',
        lastUpdated: '2024-01-01',
        content: `NACHA ACH DEBIT AUTHORIZATION

I hereby authorize ORACLE-LEDGER to initiate debit entries to my checking/savings account indicated below and to initiate credit entries to said account for corrections and adjustments. I understand that this authorization will remain in effect until I provide written notice of cancellation.

This authorization is made pursuant to NACHA Operating Rules. I understand that I have certain rights regarding ACH transactions and may dispute unauthorized transactions within 60 days of the transaction date.

ACCOUNT INFORMATION:
Account Owner: [Name]
Bank Name: [Bank Name]
Routing Number: [Routing Number]
Account Number: [Account Number]
Account Type: [Checking/Savings]

By signing below, I acknowledge that I have read and understood this authorization and agree to be bound by its terms.`,

        htmlContent: `<h1>NACHA ACH Authorization</h1><p>I hereby authorize ORACLE-LEDGER to initiate debit entries...</p>`,
        isActive: true,
        requiresSignature: true,
        signatureRequired: {
          digital: true,
          handwritten: true,
          witness: false,
        },
        jurisdiction: ['US'],
        language: 'en',
      },
      {
        id: 'doc_3',
        type: 'pci_compliance',
        title: 'PCI DSS Compliance Disclosure',
        version: '1.2',
        effectiveDate: '2024-01-01',
        lastUpdated: '2024-09-15',
        content: `PCI DSS COMPLIANCE DISCLOSURE

Payment Card Industry Data Security Standard (PCI DSS)

ORACLE-LEDGER maintains compliance with the Payment Card Industry Data Security Standard (PCI DSS) Level 1, the highest level of certification available in the payments industry.

COMPLIANCE FEATURES:
• Secure payment processing infrastructure
• End-to-end encryption for cardholder data
• Regular security assessments and audits
• Network security monitoring
• Access control and authentication
• Regular vulnerability management

CUSTOMER BENEFITS:
• Your card data is never stored on our servers
• All transactions are encrypted using 256-bit SSL
• We undergo quarterly security scans
• Our systems are regularly updated with security patches
• We maintain comprehensive security documentation

For questions about our PCI compliance, please contact our security team at security@oracleledger.com`,

        htmlContent: `<h1>PCI DSS Compliance Disclosure</h1><p>ORACLE-LEDGER maintains compliance with the Payment Card Industry Data Security Standard...</p>`,
        isActive: true,
        requiresSignature: false,
        signatureRequired: {
          digital: false,
          handwritten: false,
          witness: false,
        },
        jurisdiction: ['US', 'EU', 'Global'],
        language: 'en',
      },
    ];

    const mockSignatures: SignatureRecord[] = [
      {
        id: 'sig_1',
        documentId: 'doc_2',
        customerId: '1',
        customerName: 'John Doe',
        customerEmail: 'john.doe@example.com',
        signatureType: 'digital',
        signatureData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        signedAt: '2024-10-15T14:30:00Z',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: '2024-10-15T14:30:00Z',
        validity: 'valid',
        auditTrail: [
          {
            action: 'document_viewed',
            timestamp: '2024-10-15T14:25:00Z',
            details: 'Customer viewed NACHA authorization document',
          },
          {
            action: 'digital_signature',
            timestamp: '2024-10-15T14:30:00Z',
            details: 'Digital signature captured and verified',
          },
        ],
      },
    ];

    const mockConsents: ConsentRecord[] = [
      {
        id: 'consent_1',
        customerId: '1',
        documentId: 'doc_1',
        consentType: 'privacy',
        status: 'granted',
        grantedAt: '2024-10-15T14:20:00Z',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    ];

    setTimeout(() => {
      setDocuments(mockDocuments);
      setSignatures(mockSignatures);
      setConsents(mockConsents);
      setLoading(false);
    }, 1000);
  }, []);

  const handleSubmitSignature = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log('Processing signature:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newSignature: SignatureRecord = {
        id: `sig_${Date.now()}`,
        documentId: selectedDocument!.id,
        customerId: '1',
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        signatureType: formData.signatureType as any,
        signatureData: formData.signature,
        witnessName: formData.witnessName,
        witnessEmail: formData.witnessEmail,
        signedAt: new Date().toISOString(),
        ipAddress: '192.168.1.1', // Would get from request
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        validity: 'valid',
        auditTrail: [
          {
            action: 'signature_initiated',
            timestamp: new Date().toISOString(),
            details: 'Customer initiated signature process',
          },
          {
            action: 'signature_completed',
            timestamp: new Date().toISOString(),
            details: 'Signature completed and verified',
          },
        ],
      };

      setSignatures(prev => [...prev, newSignature]);
      setShowSignatureModal(false);
      resetForm();
    } catch (error) {
      console.error('Error processing signature:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitConsent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log('Recording consent:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newConsent: ConsentRecord = {
        id: `consent_${Date.now()}`,
        customerId: '1',
        documentId: selectedDocument!.id,
        consentType: selectedDocument!.type as any,
        status: formData.consentGiven ? 'granted' : 'denied',
        grantedAt: formData.consentGiven ? new Date().toISOString() : undefined,
        ipAddress: '192.168.1.1',
        userAgent: navigator.userAgent,
      };

      setConsents(prev => [...prev, newConsent]);
      setShowConsentModal(false);
      resetForm();
    } catch (error) {
      console.error('Error recording consent:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      documentType: '',
      customerName: '',
      customerEmail: '',
      customerAddress: '',
      customerPhone: '',
      bankAccountOwner: '',
      bankName: '',
      routingNumber: '',
      accountNumber: '',
      accountType: 'checking',
      consentGiven: false,
      consentTimestamp: new Date().toISOString(),
      signatureType: 'digital',
      signature: '',
      witnessName: '',
      witnessEmail: '',
    });
  };

  const handleDigitalSignature = (signatureData: string) => {
    setFormData(prev => ({ ...prev, signature: signatureData }));
  };

  const exportComplianceReport = () => {
    const report = {
      documents: documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        version: doc.version,
        status: doc.isActive ? 'Active' : 'Inactive',
        requiresSignature: doc.requiresSignature,
        lastUpdated: doc.lastUpdated,
      })),
      signatures: signatures.map(sig => ({
        id: sig.id,
        documentId: sig.documentId,
        customerName: sig.customerName,
        customerEmail: sig.customerEmail,
        signatureType: sig.signatureType,
        signedAt: sig.signedAt,
        validity: sig.validity,
      })),
      consents: consents.map(consent => ({
        id: consent.id,
        customerId: consent.customerId,
        documentId: consent.documentId,
        consentType: consent.consentType,
        status: consent.status,
        grantedAt: consent.grantedAt,
      })),
      generatedAt: new Date().toISOString(),
      totalDocuments: documents.length,
      totalSignatures: signatures.length,
      totalConsents: consents.length,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance_report_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'privacy_policy': return <FileText className="h-5 w-5 text-blue-600" />;
      case 'terms_of_service': return <Gavel className="h-5 w-5 text-purple-600" />;
      case 'nacha_authorization': return <Building2 className="h-5 w-5 text-green-600" />;
      case 'pci_compliance': return <Shield className="h-5 w-5 text-yellow-600" />;
      case 'bank_authorization': return <Building2 className="h-5 w-5 text-green-600" />;
      case 'auto_debit_consent': return <CreditCard className="h-5 w-5 text-blue-600" />;
      default: return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getSignatureStatusColor = (validity: string) => {
    switch (validity) {
      case 'valid': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'revoked': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConsentStatusColor = (status: string) => {
    switch (status) {
      case 'granted': return 'bg-green-100 text-green-800';
      case 'denied': return 'bg-red-100 text-red-800';
      case 'withdrawn': return 'bg-gray-100 text-gray-800';
      case 'expired': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Simple signature pad component
  const SignaturePad = ({ onSignatureChange }: { onSignatureChange: (data: string) => void }) => {
    const [isDrawing, setIsDrawing] = useState(false);
    const [signature, setSignature] = useState<string>('');
    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
      setIsDrawing(true);
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.beginPath();
      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      ctx.stroke();
    };

    const stopDrawing = () => {
      if (!isDrawing) return;
      
      setIsDrawing(false);
      const canvas = canvasRef.current;
      if (canvas) {
        const dataURL = canvas.toDataURL();
        setSignature(dataURL);
        onSignatureChange(dataURL);
      }
    };

    const clearSignature = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setSignature('');
      onSignatureChange('');
    };

    return (
      <div className="space-y-2">
        <canvas
          ref={canvasRef}
          width={400}
          height={150}
          className="border border-gray-300 rounded cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Sign above</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearSignature}
          >
            Clear
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance & Disclosures</h1>
          <p className="text-gray-600">Manage legal documents, signatures, and customer consent</p>
        </div>
        <Button
          onClick={exportComplianceReport}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'documents', label: 'Documents', icon: FileText },
            { id: 'signatures', label: 'Signatures', icon: User },
            { id: 'consents', label: 'Consents', icon: CheckCircle },
            { id: 'audit', label: 'Audit Trail', icon: Shield },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Legal Documents</h2>
            <div className="space-y-3">
              {documents.map(doc => (
                <div
                  key={doc.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedDocument?.id === doc.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedDocument(doc)}
                >
                  <div className="flex items-start">
                    <div className="mr-3 mt-0.5">
                      {getDocumentIcon(doc.type)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{doc.title}</h3>
                      <p className="text-sm text-gray-600">Version {doc.version}</p>
                      <div className="flex items-center mt-2">
                        <Badge className={doc.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {doc.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {doc.requiresSignature && (
                          <Badge className="ml-2 bg-blue-100 text-blue-800">
                            Requires Signature
                          </Badge>
                        )}
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Updated: {formatDate(doc.lastUpdated)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedDocument ? (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{selectedDocument.title}</h1>
                    <p className="text-gray-600">Version {selectedDocument.version} • Effective {formatDate(selectedDocument.effectiveDate)}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm">
                      <Print className="h-4 w-4 mr-1" />
                      Print
                    </Button>
                  </div>
                </div>

                <div className="prose max-w-none mb-6">
                  <pre className="whitespace-pre-wrap text-sm">{selectedDocument.content}</pre>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
                  <div className="flex space-x-3">
                    {selectedDocument.requiresSignature && (
                      <Button
                        onClick={() => setShowSignatureModal(true)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Collect Signature
                      </Button>
                    )}
                    <Button
                      onClick={() => setShowConsentModal(true)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Record Consent
                    </Button>
                  </div>
                </div>

                {selectedDocument.requiresSignature && (
                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex">
                      <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">Signature Required</h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>This document requires customer signature to be legally binding. Choose digital signature or electronic consent.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Select a document</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Choose a document from the left panel to view details and manage signatures.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Signatures Tab */}
      {activeTab === 'signatures' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Signature Records</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Signature Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Signed At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {signatures.map(signature => (
                  <tr key={signature.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{signature.customerName}</div>
                        <div className="text-sm text-gray-500">{signature.customerEmail}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {documents.find(d => d.id === signature.documentId)?.title || 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-500">
                        Version {documents.find(d => d.id === signature.documentId)?.version}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className="bg-blue-100 text-blue-800">
                        {signature.signatureType}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(signature.signedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getSignatureStatusColor(signature.validity)}>
                        {signature.validity}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Consents Tab */}
      {activeTab === 'consents' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Consent Records</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Consent Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Granted At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {consents.map(consent => (
                  <tr key={consent.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">Customer {consent.customerId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {documents.find(d => d.id === consent.documentId)?.title || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className="bg-purple-100 text-purple-800 capitalize">
                        {consent.consentType.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getConsentStatusColor(consent.status)}>
                        {consent.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {consent.grantedAt ? formatDate(consent.grantedAt) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {consent.status === 'granted' && (
                          <Button variant="outline" size="sm" className="text-red-600">
                            Revoke
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Audit Trail Tab */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Audit Trail</h2>
            <p className="text-sm text-gray-600">Complete history of all compliance activities</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {signatures.flatMap(sig => 
                sig.auditTrail.map((entry, index) => (
                  <div key={`${sig.id}-${index}`} className="flex items-start space-x-3 pb-4 border-b border-gray-200 last:border-b-0">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Shield className="w-4 h-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900">
                          {sig.customerName} - {entry.action.replace('_', ' ')}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {formatDate(entry.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{entry.details}</p>
                      <div className="mt-2 text-xs text-gray-500">
                        IP: {sig.ipAddress} • User Agent: {sig.userAgent.slice(0, 50)}...
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Signature Modal */}
      <Modal
        isOpen={showSignatureModal}
        onClose={() => {
          setShowSignatureModal(false);
          resetForm();
        }}
        title="Collect Digital Signature"
        size="lg"
      >
        <form onSubmit={handleSubmitSignature} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Name *
              </label>
              <Input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                placeholder="Enter customer name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Email *
              </label>
              <Input
                type="email"
                value={formData.customerEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                placeholder="Enter email address"
                required
              />
            </div>
          </div>

          {selectedDocument?.type === 'nacha_authorization' && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-medium text-gray-900">Banking Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Owner Name *
                  </label>
                  <Input
                    type="text"
                    value={formData.bankAccountOwner}
                    onChange={(e) => setFormData(prev => ({ ...prev, bankAccountOwner: e.target.value }))}
                    placeholder="Account owner name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank Name *
                  </label>
                  <Input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                    placeholder="Bank name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Routing Number *
                  </label>
                  <Input
                    type="text"
                    value={formData.routingNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, routingNumber: e.target.value.replace(/\D/g, '').slice(0, 9) }))}
                    placeholder="123456789"
                    maxLength={9}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Number *
                  </label>
                  <Input
                    type="text"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                    placeholder="Account number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Type *
                  </label>
                  <select
                    value={formData.accountType}
                    onChange={(e) => setFormData(prev => ({ ...prev, accountType: e.target.value as any }))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  >
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-medium text-gray-900">Signature</h3>
            
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="digital"
                  checked={formData.signatureType === 'digital'}
                  onChange={(e) => setFormData(prev => ({ ...prev, signatureType: e.target.value as any }))}
                  className="mr-2"
                />
                Digital Signature (Type your name)
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="electronic"
                  checked={formData.signatureType === 'electronic'}
                  onChange={(e) => setFormData(prev => ({ ...prev, signatureType: e.target.value as any }))}
                  className="mr-2"
                />
                Electronic Signature (Draw)
              </label>
            </div>

            {formData.signatureType === 'digital' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type your full name as signature *
                </label>
                <Input
                  type="text"
                  value={formData.signature}
                  onChange={(e) => setFormData(prev => ({ ...prev, signature: e.target.value }))}
                  placeholder="Type your full legal name"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  By typing your name, you agree that this constitutes your electronic signature.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Draw your signature *
                </label>
                <SignaturePad onSignatureChange={handleDigitalSignature} />
                <p className="mt-1 text-sm text-gray-500">
                  Draw your signature in the box above using your mouse or touch device.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Witness Name (optional)
                </label>
                <Input
                  type="text"
                  value={formData.witnessName}
                  onChange={(e) => setFormData(prev => ({ ...prev, witnessName: e.target.value }))}
                  placeholder="Witness name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Witness Email (optional)
                </label>
                <Input
                  type="email"
                  value={formData.witnessEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, witnessEmail: e.target.value }))}
                  placeholder="Witness email"
                />
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <Lock className="h-5 w-5 text-blue-400 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-blue-800">Legal Binding</h3>
                <div className="mt-1 text-sm text-blue-700">
                  <p>This digital signature has the same legal effect as a handwritten signature and creates a legally binding agreement.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowSignatureModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.signature || !formData.customerName || !formData.customerEmail}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'Processing...' : 'Complete Signature'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Consent Modal */}
      <Modal
        isOpen={showConsentModal}
        onClose={() => {
          setShowConsentModal(false);
          resetForm();
        }}
        title="Record Customer Consent"
        size="md"
      >
        <form onSubmit={handleSubmitConsent} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Name *
              </label>
              <Input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                placeholder="Enter customer name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Email *
              </label>
              <Input
                type="email"
                value={formData.customerEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                placeholder="Enter email address"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Address
            </label>
            <Input
              type="text"
              value={formData.customerAddress}
              onChange={(e) => setFormData(prev => ({ ...prev, customerAddress: e.target.value }))}
              placeholder="Enter full address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Phone
            </label>
            <Input
              type="tel"
              value={formData.customerPhone}
              onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
              placeholder="Enter phone number"
            />
          </div>

          {selectedDocument && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">{selectedDocument.title}</h4>
              <div className="flex items-start">
                <Checkbox
                  checked={formData.consentGiven}
                  onChange={(checked) => setFormData(prev => ({ ...prev, consentGiven: checked }))}
                />
                <div className="ml-3">
                  <label className="text-sm font-medium text-gray-900">
                    I have read and agree to the {selectedDocument.title}
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    By checking this box, you consent to the terms and conditions outlined in this document.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">Consent Record</h3>
                <div className="mt-1 text-sm text-yellow-700">
                  <p>This consent will be recorded with a timestamp, IP address, and user agent for audit purposes.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowConsentModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.customerName || !formData.customerEmail}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Recording...' : 'Record Consent'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ComplianceDisclosures;