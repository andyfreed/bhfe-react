#!/bin/bash

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== BH Financial Education Setup Script ===${NC}"
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed.${NC}"
    echo "Please install Node.js from https://nodejs.org/ (v18 or higher recommended)"
    exit 1
else
    node_version=$(node -v)
    echo -e "${GREEN}✓${NC} Node.js ${node_version} is installed"
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm is not installed.${NC}"
    echo "npm should come with Node.js. Please reinstall Node.js from https://nodejs.org/"
    exit 1
else
    npm_version=$(npm -v)
    echo -e "${GREEN}✓${NC} npm ${npm_version} is installed"
fi

# Install dependencies
echo
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install

# Check for environment file
echo
if [ -f .env.local ]; then
    echo -e "${YELLOW}An .env.local file already exists. Do you want to update it? (y/n)${NC}"
    read -p "> " update_env
    
    if [[ "$update_env" == "y" || "$update_env" == "Y" ]]; then
        setup_env=true
    else
        setup_env=false
        echo -e "${GREEN}Keeping existing .env.local file${NC}"
    fi
else
    setup_env=true
fi

# Setup environment file if needed
if [ "$setup_env" = true ]; then
    echo -e "${YELLOW}Setting up environment configuration (.env.local)${NC}"
    echo -e "Do you want to:"
    echo -e "1) Configure with real Supabase credentials"
    echo -e "2) Use mock authentication (for development without Supabase)"
    read -p "> " env_choice
    
    if [ "$env_choice" = "1" ]; then
        echo -e "${YELLOW}Enter your Supabase URL:${NC}"
        read -p "> " supabase_url
        
        echo -e "${YELLOW}Enter your Supabase anon key:${NC}"
        read -p "> " supabase_anon_key
        
        cat > .env.local << EOL
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=${supabase_url}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabase_anon_key}

# Development Configuration
NEXT_PUBLIC_USE_MOCK_AUTH=false
EOL
        echo -e "${GREEN}✓${NC} Environment file created with Supabase credentials"
    else
        cat > .env.local << EOL
# Development Configuration with Mock Authentication
NEXT_PUBLIC_USE_MOCK_AUTH=true
EOL
        echo -e "${GREEN}✓${NC} Environment file created with mock authentication"
        echo -e "${YELLOW}Note: You can log in with:${NC}"
        echo -e "Email: test@example.com"
        echo -e "Password: password123"
    fi
fi

echo
echo -e "${GREEN}Setup complete!${NC}"
echo
echo -e "To start the development server:"
echo -e "  ${YELLOW}npm run dev${NC}"
echo
echo -e "To build for production:"
echo -e "  ${YELLOW}npm run build${NC}"
echo -e "  ${YELLOW}npm run start${NC}"
echo 