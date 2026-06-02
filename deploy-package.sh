#!/bin/bash
# Local packaging script for CloudVault deployment

echo "=== CloudVault Production Packager ==="

# 1. Build frontend assets
echo "Building frontend production assets..."
cd frontend
npm run build
cd ..

# 2. Clean previous build folders
echo "Cleaning up temp folders..."
rm -rf deploy
rm -f cloudvault-deploy.zip

# 3. Create deploy workspace
mkdir -p deploy/backend
mkdir -p deploy/frontend-dist

# 4. Copy backend source code (excluding node_modules and local environments)
echo "Copying backend codebase..."
cp -R backend/config deploy/backend/
cp -R backend/controllers deploy/backend/
cp -R backend/middleware deploy/backend/
cp -R backend/models deploy/backend/
cp -R backend/routes deploy/backend/
cp -R backend/services deploy/backend/
cp backend/server.js deploy/backend/
cp backend/package.json deploy/backend/
cp backend/package-lock.json deploy/backend/

# 5. Copy built frontend assets
echo "Copying frontend build assets..."
cp -R frontend/dist/* deploy/frontend-dist/

# 6. Compress package
echo "Creating zip archive cloudvault-deploy.zip..."
zip -r cloudvault-deploy.zip deploy > /dev/null

# Clean temporary deploy directory
rm -rf deploy

echo "======================================"
echo "Packaged successfully!"
echo "Your deployment bundle is ready at: cloudvault-deploy.zip"
echo "======================================"
