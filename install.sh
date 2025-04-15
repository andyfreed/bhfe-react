#!/bin/bash

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}BH Financial Education Installation Script${NC}"
echo "====================================="
echo

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed.${NC}"
    echo "Please install Docker from https://docs.docker.com/get-docker/"
    exit 1
else
    echo -e "${GREEN}✓${NC} Docker is installed"
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed.${NC}"
    echo "Please install Docker Compose from https://docs.docker.com/compose/install/"
    exit 1
else
    echo -e "${GREEN}✓${NC} Docker Compose is installed"
fi

# Check if .env file exists
if [ -f .env ]; then
    echo -e "${YELLOW}A .env file already exists.${NC}"
    read -p "Do you want to overwrite it? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing .env file."
    else
        CREATE_ENV=true
    fi
else
    CREATE_ENV=true
fi

# Create .env file if needed
if [ "$CREATE_ENV" = true ]; then
    echo "Creating .env file..."
    
    # Check if .env.example exists and copy it
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}✓${NC} Created .env file from template"
    else
        # Otherwise create a basic .env file
        cat > .env << EOL
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ujgxftkzguriirozloxa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Development Mode Configuration
NEXT_PUBLIC_USE_MOCK_AUTH=false
EOL
        echo -e "${GREEN}✓${NC} Created basic .env file"
    fi

    # Ask for Supabase credentials
    echo
    echo -e "${YELLOW}Supabase Configuration:${NC}"
    echo "Please enter your Supabase credentials:"
    
    read -p "Supabase Anon Key: " ANON_KEY
    read -p "Supabase Service Role Key: " SERVICE_KEY
    
    # Update .env file with provided credentials
    sed -i.bak "s/NEXT_PUBLIC_SUPABASE_ANON_KEY=.*/NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY/" .env
    sed -i.bak "s/SUPABASE_SERVICE_ROLE_KEY=.*/SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY/" .env
    rm -f .env.bak # Remove backup file created by sed on macOS
    
    echo -e "${GREEN}✓${NC} Updated Supabase credentials in .env file"
fi

# Ask for deployment mode
echo
echo -e "${YELLOW}Deployment Mode:${NC}"
echo "1) Production (optimized build)"
echo "2) Development (with hot reloading)"
read -p "Choose deployment mode (1/2): " -n 1 -r
echo

# Pull latest Docker images
echo "Pulling latest Docker images..."
docker-compose pull

# Start application based on chosen mode
if [[ $REPLY =~ ^[1]$ ]]; then
    echo -e "${GREEN}Starting application in production mode...${NC}"
    docker-compose up -d
    echo -e "${GREEN}✓${NC} Application started in production mode"
    echo "Access the website at http://localhost:3000"
    echo
    echo "Useful commands:"
    echo "  - View logs: docker-compose logs -f"
    echo "  - Stop application: docker-compose down"
elif [[ $REPLY =~ ^[2]$ ]]; then
    echo -e "${GREEN}Starting application in development mode...${NC}"
    docker-compose -f docker-compose.dev.yml up -d
    echo -e "${GREEN}✓${NC} Application started in development mode with hot reloading"
    echo "Access the website at http://localhost:3000"
    echo
    echo "Useful commands:"
    echo "  - View logs: docker-compose -f docker-compose.dev.yml logs -f"
    echo "  - Stop application: docker-compose -f docker-compose.dev.yml down"
else
    echo -e "${RED}Invalid option. Please run the script again and select 1 or 2.${NC}"
    exit 1
fi

echo
echo -e "${GREEN}Installation complete!${NC}" 