# Production Admin Setup Guide

## Prerequisites
✅ Supabase environment variables set in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Steps to Set Up Admin Access

### 1. Create a User in Supabase
1. Go to your Supabase dashboard
2. Navigate to Authentication → Users
3. Click "Invite user" or "Create user"
4. Enter your email and set a password

### 2. Make the User an Admin
1. Go to the SQL Editor in Supabase
2. Run this SQL command (replace with your email):
```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

### 3. Verify Admin Setup
Run this query to confirm:
```sql
SELECT id, email, role 
FROM profiles 
WHERE email = 'your-email@example.com';
```

You should see `role: admin` in the results.

### 4. Login to Admin Panel
1. Visit `https://your-site.vercel.app/admin/login`
2. Enter your email and password
3. You'll be redirected to `/admin/users` after successful login

## Troubleshooting

### If you can't log in:
1. Check that your user exists in Supabase Auth
2. Verify the user has `role = 'admin'` in the profiles table
3. Make sure cookies are enabled in your browser
4. Check the browser console for any errors

### If you see "Server configuration error":
- Verify all Supabase environment variables are set correctly in Vercel
- Redeploy your application after setting environment variables

## Security Notes
- The `admin-verified` cookie is set for 24 hours
- Only users with `role = 'admin'` in the profiles table can access admin pages
- All admin API routes check for both valid Supabase session and admin role 