#!/bin/bash
set -e

echo "================================================================="
echo " 🚀 PRODUCTION PERSISTENT VPS DEPLOYMENT & HARDENING SCRIPT"
echo "================================================================="

# 1. Ensure Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed on this host. Please install Docker first."
    exit 1
fi

# 2. Enforce strict permissions on local .env if present
if [ -f .env ]; then
    echo "🔒 Securing .env permissions (chmod 600)..."
    chmod 600 .env
fi

# 3. Inject High-Entropy ADMIN_API_KEY if not already set
if [ -z "$ADMIN_API_KEY" ]; then
    echo "🔑 Injecting high-entropy ADMIN_API_KEY secret into session..."
    export ADMIN_API_KEY=$(openssl rand -hex 32)
    echo "   (ADMIN_API_KEY generated in-memory. Inject into your VPS secret manager)."
fi

# 4. Build Docker container with clean image layers (.dockerignore enforced)
echo "📦 Building production Docker image (web4-agent-gateway:latest)..."
docker build -t web4-agent-gateway:latest .

# 5. Stop & remove existing container instance
echo "🛑 Stopping any existing container..."
docker stop web4-agent-gateway 2>/dev/null || true
docker rm web4-agent-gateway 2>/dev/null || true

# 6. Launch persistent background container with persistent data volume
echo "🟢 Launching persistent background container with restart=always..."
docker run -d \
  --name web4-agent-gateway \
  --restart always \
  -p 3000:3000 \
  -e PORT=3000 \
  -e PAY_TO_ADDRESS="${PAY_TO_ADDRESS:-0x2E3344DfF97a679b8E401fF9E74E856Cf56c6315}" \
  -e NETWORK="${NETWORK:-eip155:8453}" \
  -e FACILITATOR_URL="${FACILITATOR_URL:-https://facilitator.openx402.ai}" \
  -e ADMIN_API_KEY="${ADMIN_API_KEY}" \
  -e MAX_DAILY_USDC_PER_WALLET="${MAX_DAILY_USDC_PER_WALLET:-50.0}" \
  -v gateway-db-data:/app/data \
  -v gateway-logs-data:/app/logs \
  web4-agent-gateway:latest

PUBLIC_IP=$(curl -s ifconfig.me || echo "YOUR_VPS_IP")

echo ""
echo "================================================================="
echo " 🎉 PRODUCTION DEPLOYMENT COMPLETE!"
echo " 🌐 Gateway Host: http://${PUBLIC_IP}:3000"
echo " 💳 PayTo Wallet: ${PAY_TO_ADDRESS:-0x2E3344DfF97a679b8E401fF9E74E856Cf56c6315}"
echo ""
echo " 📋 POST-DEPLOYMENT HTTPS VALIDATION CHECKLIST:"
echo " ---------------------------------------------------------------"
echo " 1. Verify Health:        curl https://YOUR_DOMAIN/v1/health"
echo " 2. Verify OpenAPI Spec:  curl https://YOUR_DOMAIN/v1/openapi.json"
echo " 3. Verify HTTP 402:      curl -i https://YOUR_DOMAIN/v1/scrape?url=https://example.com"
echo " 4. Test Container Reboot: docker restart web4-agent-gateway"
echo " 5. Audit Accounting:     docker exec -it web4-agent-gateway npm run test:reconcile"
echo "================================================================="
