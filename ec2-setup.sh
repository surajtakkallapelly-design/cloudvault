#!/bin/bash
# EC2 Setup Script for Ubuntu 20.04/22.04 LTS
# Run this on your EC2 instance with: sudo bash ec2-setup.sh

echo "=== EC2 Instance Setup and Config ==="

# 1. Update system packages
echo "Updating apt indexes..."
sudo apt-get update -y
sudo apt-get upgrade -y

# 2. Install Node.js (Node 20)
echo "Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install Nginx and Unzip
echo "Installing Nginx and unzip..."
sudo apt-get install -y nginx unzip

# 4. Install PM2 Globally
echo "Installing PM2 process manager..."
sudo npm install -y pm2 -g

# 5. Create deployment directories
echo "Creating deployment target directories..."
sudo mkdir -p /var/www/cloudvault/backend
sudo mkdir -p /var/www/cloudvault/frontend-dist
sudo chown -R $USER:$USER /var/www/cloudvault

# 6. Configure Nginx Reverse Proxy
echo "Configuring Nginx routing..."
sudo tee /etc/nginx/sites-available/cloudvault > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;

    # Frontend Static Assets
    location / {
        root /var/www/cloudvault/frontend-dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API Proxy
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 100M;
    }

    # Uploads mock files fallback
    location /uploads {
        alias /var/www/cloudvault/backend/uploads;
        autoindex off;
    }
}
EOF

# Activate Nginx site config and restart
sudo ln -sf /etc/nginx/sites-available/cloudvault /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

echo "======================================"
echo "EC2 Setup Finished!"
echo "Server is configured and listening on port 80."
echo "Make sure Port 80 (HTTP) is open in your Security Group."
echo "======================================"
