# BH Financial Education Installation Guide

This guide provides instructions for installing and running the BH Financial Education website on Windows, macOS, or Linux.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm (comes with Node.js)
- Supabase credentials (Anon Key and URL)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/bhfe-react.git
   cd bhfe-react
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env.local` file in the project root:
   ```
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

   # Development Mode Configuration (optional)
   NEXT_PUBLIC_USE_MOCK_AUTH=false
   ```

4. Start the development server:
   ```
   npm run dev
   ```

5. Access the website at http://localhost:3000

## Production Build

To create and run a production build:

1. Build the application:
   ```
   npm run build
   ```

2. Start the production server:
   ```
   npm run start
   ```

## Troubleshooting

- **Database connection issues**: Verify your Supabase credentials in the `.env.local` file
- **Port conflicts**: If port 3000 is already in use, you can use a different port:
  ```
  npm run dev -- -p 3001
  ```

## Updating the Application

To update to the latest version:
```
git pull
npm install
npm run build # If running in production
```

## Mock Authentication

For development without real Supabase credentials, you can enable mock authentication:
```
# In .env.local
NEXT_PUBLIC_USE_MOCK_AUTH=true
```

When mock authentication is enabled, you can login with:
- Email: test@example.com
- Password: password123 