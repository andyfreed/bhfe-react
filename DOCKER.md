# Docker Setup for BH Financial Education

This document provides instructions for running the BH Financial Education website using Docker.

## Prerequisites

- Docker: [Install Docker](https://docs.docker.com/get-docker/)
- Docker Compose: [Install Docker Compose](https://docs.docker.com/compose/install/)

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/andyfreed/bhfe-react.git
   cd bhfe-react
   ```

2. **Set up environment variables**
   
   Create a `.env` file with the necessary environment variables:
   ```bash
   cp .env.example .env
   ```
   
   Then edit the `.env` file to add your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   ```

3. **Build and run the Docker containers**
   ```bash
   docker-compose up -d
   ```
   
   This will start:
   - The Next.js application (available at http://localhost:3000)
   - A PostgreSQL database (available at localhost:5432)

4. **Monitor the application logs**
   ```bash
   docker-compose logs -f app
   ```

## Development Workflow

### Running in development mode

To run the application in development mode with Docker:

```bash
docker-compose -f docker-compose.dev.yml up
```

### Running database migrations

To run database migrations:

```bash
docker-compose exec app npm run migrate
```

## Production Deployment

For production deployment:

1. **Build the production image**
   ```bash
   docker build -t bhfe-react:latest .
   ```

2. **Run the container**
   ```bash
   docker run -p 3000:3000 --env-file .env.production bhfe-react:latest
   ```

## Troubleshooting

### Database Connection Issues

If you encounter database connection issues:

1. Check that the database container is running:
   ```bash
   docker-compose ps
   ```

2. Check database logs:
   ```bash
   docker-compose logs db
   ```

3. Ensure your Supabase credentials are correct in the `.env` file.

### Application Not Starting

If the application container fails to start:

1. Check application logs:
   ```bash
   docker-compose logs app
   ```

2. Ensure all required environment variables are set.

## Cleaning Up

To stop and remove all containers, networks, and volumes:

```bash
docker-compose down -v
``` 