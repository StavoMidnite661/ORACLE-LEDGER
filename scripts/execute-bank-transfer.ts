import axios from 'axios';

/**
 * Direct Rail Execution Script
 * This script simulates the Ledger Core triggering a real-world bank transfer
 * via the Gateway -> Bank Connector (ISO 20022).
 */

const GATEWAY_URL = 'http://localhost:3002/api/bank/transfer';

const mockTransfer = {
    instructionId: `SOVR-TX-${Date.now()}`,
    amount: 50250.75,
    currency: 'USD',
    beneficiary: {
        name: "GLOBAL VENDOR LOGISTICS",
        iban: "US99VEND8877665544",
        bic: "VENDUS44"
    }
};

async function triggerTransfer() {
    console.log("🚀 Initializing Direct Bank Rail Transfer...");
    console.log(`📡 Sending to Gateway: ${GATEWAY_URL}`);
    
    try {
        const response = await axios.post(GATEWAY_URL, mockTransfer);
        
        console.log("\n✅ BANK ACKNOWLEDGMENT RECEIVED:");
        console.log("--------------------------------------------------");
        console.log(`Status:          ${response.data.status}`);
        console.log(`Bank Ref:        ${response.data.bankReference}`);
        console.log(`Transmission:    ${response.data.mode}`);
        console.log(`Timestamp:       ${response.data.timestamp}`);
        console.log("--------------------------------------------------");
        console.log("\n📝 SYSTEM NOTE:");
        console.log("The Bank Connector has generated the ISO 20022 XML payload,");
        console.log("simulated PGP encryption, and queued it for SFTP upload.");
        
    } catch (error: any) {
        if (error.code === 'ECONNREFUSED') {
            console.error("\n❌ ERROR: Connection Refused.");
            console.error("Make sure you are running the services first!");
            console.error("Run: npm run dev:all");
        } else {
            console.error("\n❌ TRANSFER FAILED:", error.response?.data || error.message);
        }
    }
}

triggerTransfer();
