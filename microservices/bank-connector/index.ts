import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
// @ts-ignore
import { Document, Tag } from 'iso20022.js'; 
// Note: Actual library usage may vary based on version, using generic XML construction principle if strict typing fails

dotenv.config();

const PORT = process.env.BANK_CONNECTOR_PORT || 3007;
const BANK_SFTP_HOST = process.env.BANK_SFTP_HOST || 'sftp.jpmorgan.com';
const BANK_SFTP_USER = process.env.BANK_SFTP_USER || 'SIMULATED_USER';

const app = express();
app.use(cors());
app.use(bodyParser.json());

// --- ISO 20022 Generator (pain.001.001.03) ---
// This function constructs a standard XML payload for a credit transfer.
// In a real scenario, this would be encrypted with PGP before sending.
function generatePain001(instructionId: string, amount: number, debtor: any, creditor: any) {
    const timestamp = new Date().toISOString();
    
    // Simplified XML construction for demonstration of the "pain.001" structure
    const xml = `
<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03">
    <CstmrCdtTrfInitn>
        <GrpHdr>
            <MsgId>${instructionId}</MsgId>
            <CreDtTm>${timestamp}</CreDtTm>
            <NbOfTxs>1</NbOfTxs>
            <CtrlSum>${amount.toFixed(2)}</CtrlSum>
            <InitgPty>
                <Nm>${debtor.name}</Nm>
            </InitgPty>
        </GrpHdr>
        <PmtInf>
            <PmtInfId>PMT-${instructionId}</PmtInfId>
            <PmtMtd>TRF</PmtMtd>
            <BtchBookg>false</BtchBookg>
            <ReqdExctnDt>${timestamp.split('T')[0]}</ReqdExctnDt>
            <Dbtr>
                <Nm>${debtor.name}</Nm>
            </Dbtr>
            <DbtrAcct>
                <Id>
                    <IBAN>${debtor.iban}</IBAN>
                </Id>
            </DbtrAcct>
            <DbtrAgt>
                <FinInstnId>
                    <BIC>${debtor.bic}</BIC>
                </FinInstnId>
            </DbtrAgt>
            <CdtTrfTxInf>
                <PmtId>
                    <EndToEndId>${instructionId}</EndToEndId>
                </PmtId>
                <Amt>
                    <InstdAmt Ccy="USD">${amount.toFixed(2)}</InstdAmt>
                </Amt>
                <CdtrAgt>
                    <FinInstnId>
                        <BIC>${creditor.bic}</BIC>
                    </FinInstnId>
                </CdtrAgt>
                <Cdtr>
                    <Nm>${creditor.name}</Nm>
                </Cdtr>
                <CdtrAcct>
                    <Id>
                        <IBAN>${creditor.iban}</IBAN>
                    </Id>
                </CdtrAcct>
            </CdtTrfTxInf>
        </PmtInf>
    </CstmrCdtTrfInitn>
</Document>`;
    return xml.trim();
}

// --- Bank Integration Endpoints ---

// 1. Initiate a Direct Transfer (Push to Bank)
app.post('/api/bank/transfer', async (req, res) => {
    try {
        const { amount, currency, beneficiary, instructionId } = req.body;
        
        console.log(`[BankConnector] Received Transfer Request: ${instructionId} for ${currency} ${amount}`);

        // Mock Debtor (Our Organization)
        const debtor = {
            name: "SOVR DEVELOPMENT HOLDINGS LLC",
            iban: "US55BANK1234567890", // Mock US IBAN format
            bic: "BANKUS33"
        };

        // Generate the ISO 20022 Payload
        const xmlPayload = generatePain001(instructionId, amount, debtor, beneficiary);
        
        console.log(`[BankConnector] Generated ISO 20022 (pain.001) Payload:\n${xmlPayload}`);

        // Simulate SFTP Upload
        // In reality, this would use 'ssh2-sftp-client' to put the file on the bank's server.
        console.log(`[BankConnector] 🔐 Encrypting payload with PGP Public Key for ${BANK_SFTP_HOST}...`);
        console.log(`[BankConnector] 🚀 Uploading to sftp://${BANK_SFTP_USER}@${BANK_SFTP_HOST}/inbound/payment_instruction_${instructionId}.xml`);
        
        // Simulate Bank Response (Async Acknowledgment)
        const bankAckId = "ACK-" + Math.random().toString(36).substring(7).toUpperCase();

        res.json({
            status: "SUBMITTED",
            bankReference: bankAckId,
            mode: "DIRECT_SFTP",
            timestamp: new Date().toISOString(),
            message: "Payment instruction generated, encrypted, and queued for batch transmission."
        });

    } catch (error: any) {
        console.error(`[BankConnector] Error: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

// 2. Poll for Status (Mocking a Bank "Daily Statement" or Webhook)
app.get('/api/bank/status/:instructionId', (req, res) => {
    const { instructionId } = req.params;
    // Mock random status
    const statuses = ["PENDING_BANK_REVIEW", "CLEARED", "REJECTED_NSF"];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    res.json({
        instructionId,
        status,
        updatedAt: new Date().toISOString()
    });
});

// Health Check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        service: 'Bank Connector', 
        protocol: 'ISO 20022', 
        mode: 'HOST-TO-HOST (SFTP)' 
    });
});

app.listen(PORT, () => {
    console.log(`🏦 Bank Connector Service running on port ${PORT}`);
    console.log(`   - Protocols: ISO 20022 (XML), SFTP Stubbed`);
    console.log(`   - Target Bank Host: ${BANK_SFTP_HOST}`);
});
