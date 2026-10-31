#!/usr/bin/env bash
set -e

echo "===================================================="
echo "🚀 راه‌اندازی خودکار اپلیکیشن دوپول (Dopool) روی سرور ابر آروان"
echo "===================================================="

# 1. Update packages & install curl, nginx, unzip, git
sudo apt-get update -y
sudo apt-get install -y curl nginx unzip git

# 2. Install Node.js 20 LTS if not installed
if ! command -v node &> /dev/null; then
  echo "📦 در حال نصب Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

# 3. Install dependencies and build production bundle
echo "⚙️ در حال نصب پکیج‌ها و ساخت نسخه نهایی (Production Build)..."
npm install --legacy-peer-deps
npm run build

# 4. Copy built files to Nginx web root
echo "📂 انتقال فایل‌های نهایی به وب‌سرور Nginx..."
sudo rm -rf /var/www/dopool
sudo mkdir -p /var/www/dopool
sudo cp -r dist/* /var/www/dopool/
sudo chown -R www-data:www-data /var/www/dopool

# 5. Configure Nginx for SPA + Gzip
DOMAIN_NAME=${1:-"_"}
sudo tee /etc/nginx/sites-available/dopool > /dev/null <<EOF
server {
    listen 80;
    server_name ${DOMAIN_NAME};

    root /var/www/dopool;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/javascript application/javascript application/json image/svg+xml;

    location ~* \.(?:ico|css|js|gif|jpe?g|png|svg|woff2?|ttf|eot)$ {
        expires 30d;
        access_log off;
        add_header Cache-Control "public, max-age=2592000, immutable";
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/dopool /etc/nginx/sites-enabled/dopool
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

SERVER_IP=$(hostname -I | awk '{print $1}')
echo "===================================================="
echo "✅ نصب با موفقیت کامل شد!"
echo "🌐 آدرس تست روی آی‌پی سرور شما: http://${SERVER_IP}"
if [ "$DOMAIN_NAME" != "_" ]; then
  echo "🔗 آدرس دامنه: http://${DOMAIN_NAME}"
fi
echo "===================================================="
