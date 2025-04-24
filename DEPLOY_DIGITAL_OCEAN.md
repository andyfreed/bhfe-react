# Deploying BH Financial Education to Digital Ocean App Platform

This guide walks you through deploying your Next.js application to Digital Ocean App Platform.

## Prerequisites

- [Digital Ocean](https://www.digitalocean.com/) account
- Your application code in a GitHub repository
- Supabase project (already set up)

## Deployment Steps

### 1. Prepare Your Repository

Make sure your application code is pushed to a GitHub repository that Digital Ocean can access.

### 2. Create a New App on Digital Ocean

1. Log in to your [Digital Ocean account](https://cloud.digitalocean.com/)
2. Navigate to the App Platform section
3. Click "Create App"
4. Connect your GitHub account and select your repository
5. Select the branch you want to deploy (usually `main`)

### 3. Configure Your App

#### Build Settings

Digital Ocean should automatically detect that this is a Next.js application. If not, use these settings:

- **Build Command**: `npm run build`
- **Run Command**: `npm start`
- **Output Directory**: `.next`

#### Environment Variables

Add the following environment variables:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase project anon key

### 4. Resource Plan Selection

Choose a resource plan that fits your needs:
- For testing and low-traffic sites, the Basic plan is sufficient
- For production use, consider the Professional plan for better performance

### 5. Finalize and Deploy

1. Review all settings
2. Click "Launch App"
3. Wait for the build and deployment to complete

## Post-Deployment Configuration

### Setting up a Custom Domain (Optional)

1. In your app's settings, navigate to Domains
2. Add your custom domain
3. Follow the DNS configuration instructions

### Enabling Automatic Deployments

By default, Digital Ocean will automatically deploy when you push to your selected branch. You can adjust this in the app settings:

1. Go to your app's settings
2. Select Components > Your App Component
3. Navigate to the "General" tab
4. Configure your auto-deploy settings

## Using the Deployment Script

This project includes a helper script for deploying to Digital Ocean App Platform:

```bash
# Run the deployment script
npm run deploy:do
```

This script will:
1. Check if you have the Digital Ocean CLI (doctl) installed
2. Verify you're authenticated with Digital Ocean
3. Prompt for your app name and Supabase credentials
4. Create and deploy your application automatically

### Prerequisites for the Script
- Digital Ocean CLI (doctl) installed: [Installation Guide](https://docs.digitalocean.com/reference/doctl/how-to/install/)
- Authenticated with Digital Ocean: Run `doctl auth init`
- Your Supabase URL and anon key

## Files Related to Digital Ocean Deployment

- `.do/app.yaml` - Digital Ocean App specification
- `.do/README.md` - Information specific to Digital Ocean deployment
- `scripts/deploy-to-do.sh` - Helper script for deployment via CLI

## Useful Resources

- [Digital Ocean App Platform Documentation](https://docs.digitalocean.com/products/app-platform/)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Digital Ocean App Platform Pricing](https://www.digitalocean.com/pricing/app-platform)

## Troubleshooting

### Build Failures

If your app fails to build:

1. Check the build logs for specific errors
2. Verify that all required environment variables are set
3. Make sure your package.json has the correct build and start scripts

### Runtime Errors

If your app builds but has runtime errors:

1. Check app logs in the Digital Ocean console
2. Verify that your Supabase connection is working
3. Check that your environment variables are correctly set

## Monitoring and Scaling

- Use the Digital Ocean monitoring tools to track app performance
- You can scale your app horizontally (more instances) or vertically (more resources) as needed

## Useful Commands for Local Testing

Before deploying, test your production build locally:

```bash
# Build your application
npm run build

# Start the production server
npm start
``` 