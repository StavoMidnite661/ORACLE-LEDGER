#!/bin/bash

# Start the Microservices Architecture
# 1. Legacy Monolith (Port 3001)
# 2. API Gateway (Port 3002)
# 3. Risk & Compliance Service (Port 3003)
# 4. Blockchain Bridge Service (Port 3004)
# 5. Payment Gateway Service (Port 3005)

"D:\Program Files\node-v25.2.1-win-x64\npx.cmd" concurrently \
  --names "LEGACY,GATEWAY,RISK,CHAIN,PAYMENT" \
  --prefix-colors "blue,magenta,green,yellow,cyan" \
  "tsx server/api.ts" \
  "tsx microservices/gateway/index.ts" \
  "tsx microservices/risk-compliance/index.ts" \
  "tsx microservices/blockchain-bridge/index.ts" \
  "tsx microservices/payment-gateway/index.ts"
