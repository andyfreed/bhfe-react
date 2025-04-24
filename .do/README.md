# Digital Ocean App Platform Deployment

This directory contains configuration files for deploying the BH Financial Education application on Digital Ocean App Platform.

## Configuration

The `app.yaml` file defines:
- Basic app configuration
- Service setup for the web component
- Environment variables
- Build and run commands

## Deployment Variables

When deploying, you'll need to set these environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key

## Manual Deployment Steps

If you prefer to deploy through the Digital Ocean dashboard instead of using the app spec:

1. Create a new App from the App Platform dashboard
2. Connect to your GitHub repository
3. Configure with these settings:
   - **Build Command**: `npm run build`
   - **Run Command**: `npm start`
   - Set the environment variables listed above

## Monitoring

After deployment, you can monitor your app's performance in the Digital Ocean dashboard.

## Troubleshooting

### Common Issues

1. **Build fails**: Check the build logs for errors. Common causes:
   - Missing environment variables
   - Dependency issues

2. **App runs but can't connect to Supabase**: 
   - Verify your Supabase URL and anon key are correct
   - Check Supabase is allowing connections from Digital Ocean IPs

3. **"Internal server error"**:
   - Check the logs in the DO dashboard
   - Look for runtime errors related to missing environment variables

## Useful Commands

For local testing before deployment:

```bash
# Build the app locally
npm run build

# Test production mode locally
npm start
```

## Scaling

To scale your application:
1. Go to the app settings in the Digital Ocean dashboard
2. Under "Resources", you can adjust:
   - Instance count
   - Instance size 