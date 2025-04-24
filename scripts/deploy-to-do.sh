#!/bin/bash

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== BH Financial Education - Digital Ocean Deployment Helper ===${NC}"
echo

# Check if doctl is installed
if ! command -v doctl &> /dev/null; then
    echo -e "${RED}The Digital Ocean CLI (doctl) is not installed.${NC}"
    echo "Please install it from: https://docs.digitalocean.com/reference/doctl/how-to/install/"
    exit 1
else
    echo -e "${GREEN}✓${NC} Digital Ocean CLI is installed"
fi

# Check if user is authenticated
echo -e "${YELLOW}Checking if you're authenticated with Digital Ocean...${NC}"
if ! doctl account get &> /dev/null; then
    echo -e "${RED}You're not authenticated with Digital Ocean.${NC}"
    echo "Please run 'doctl auth init' and follow the instructions."
    exit 1
else
    echo -e "${GREEN}✓${NC} Authenticated with Digital Ocean"
fi

# Ask for app name
echo
echo -e "${YELLOW}What would you like to name your app? (e.g., bhfe-education)${NC}"
read -p "> " app_name

# Ask for Supabase URL
echo
echo -e "${YELLOW}Enter your Supabase URL:${NC}"
read -p "> " supabase_url

# Ask for Supabase Anon Key
echo
echo -e "${YELLOW}Enter your Supabase Anon Key:${NC}"
read -p "> " supabase_anon_key

# Create a temporary app spec file
temp_app_spec=$(mktemp)
cat > "$temp_app_spec" << EOL
name: $app_name
region: nyc
services:
  - name: web
    github:
      branch: main
      deploy_on_push: true
    source_dir: /
    http_port: 3000
    instance_count: 1
    instance_size_slug: basic-xs
    routes:
      - path: /
    envs:
      - key: NEXT_PUBLIC_SUPABASE_URL
        scope: RUN_AND_BUILD_TIME
        value: $supabase_url
      - key: NEXT_PUBLIC_SUPABASE_ANON_KEY
        scope: RUN_AND_BUILD_TIME
        value: $supabase_anon_key
      - key: NODE_ENV
        scope: RUN_AND_BUILD_TIME
        value: production
    build_command: npm run build
    run_command: npm start
EOL

echo
echo -e "${YELLOW}Ready to deploy your application with the following settings:${NC}"
echo -e "  App Name: ${GREEN}$app_name${NC}"
echo -e "  Supabase URL: ${GREEN}$supabase_url${NC}"
echo -e "  Supabase Anon Key: ${GREEN}${supabase_anon_key:0:5}...${NC}"
echo

# Ask for confirmation
echo -e "${YELLOW}Would you like to proceed with deployment? (y/n)${NC}"
read -p "> " confirm

if [[ "$confirm" == "y" || "$confirm" == "Y" ]]; then
    echo
    echo -e "${YELLOW}Creating and deploying app to Digital Ocean...${NC}"
    
    doctl apps create --spec "$temp_app_spec"
    
    if [ $? -eq 0 ]; then
        echo
        echo -e "${GREEN}✓${NC} App creation initiated!"
        echo
        echo -e "To check your app status, run: ${YELLOW}doctl apps list${NC}"
        echo -e "To get deployment details, run: ${YELLOW}doctl apps get YOUR_APP_ID${NC}"
        echo
        echo -e "${BLUE}Note:${NC} The initial build and deployment may take a few minutes."
    else
        echo
        echo -e "${RED}App creation failed. See error messages above.${NC}"
    fi
else
    echo
    echo -e "${YELLOW}Deployment cancelled.${NC}"
fi

# Clean up the temporary file
rm "$temp_app_spec"

echo
echo -e "${GREEN}Done!${NC}" 