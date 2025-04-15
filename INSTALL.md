# BH Financial Education Installation Guide

This guide provides instructions for installing and running the BH Financial Education website using Docker on Windows, macOS, or Linux.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed on your system
- [Docker Compose](https://docs.docker.com/compose/install/) (included with Docker Desktop for Windows and macOS)
- Supabase credentials (Anon Key and Service Role Key)

## Automated Installation

### Windows Users

1. Open Command Prompt or PowerShell
2. Navigate to the project directory:
   ```
   cd path\to\bhfe-react
   ```
3. Run the installation script:
   ```
   install.bat
   ```
4. Follow the prompts to enter your Supabase credentials and choose deployment mode

### macOS and Linux Users

1. Open Terminal
2. Navigate to the project directory:
   ```
   cd path/to/bhfe-react
   ```
3. Make the installation script executable:
   ```
   chmod +x install.sh
   ```
4. Run the installation script:
   ```
   ./install.sh
   ```
5. Follow the prompts to enter your Supabase credentials and choose deployment mode

## Manual Installation

If you prefer to set up manually or if the installation scripts don't work for your system:

1. Ensure Docker and Docker Compose are installed
2. Create a `.env` file in the project root:
   ```
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://ujgxftkzguriirozloxa.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # Development Mode Configuration
   NEXT_PUBLIC_USE_MOCK_AUTH=false
   ```
3. Choose your deployment mode:

   **For Production Mode:**
   ```
   docker-compose up -d
   ```

   **For Development Mode (with hot reloading):**
   ```
   docker-compose -f docker-compose.dev.yml up -d
   ```

4. Access the website at http://localhost:3000

## Troubleshooting

- **Container fails to start**: Check logs with `docker-compose logs`
- **Database connection issues**: Verify your Supabase credentials in the `.env` file
- **Port conflicts**: If port 3000 is already in use, modify the port mapping in `docker-compose.yml`

## Stopping the Application

To stop the application:
```
docker-compose down
```

## Updating the Application

To update to the latest version:
```
git pull
docker-compose pull
docker-compose up -d
```

## Additional Resources

For more detailed information about using Docker with this application, see the [DOCKER.md](./DOCKER.md) file. 