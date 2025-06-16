# Deployment Guide for BH Financial Education

## 🚀 Vercel Deployment Steps

### 1. **Prepare Supabase Database**

Before deploying, you need to apply the missing database policy:

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **SQL Editor**
3. Run the SQL commands from `supabase-migration-update-policy.sql`:

```sql
-- Add UPDATE policy for users to update their own exam answers
CREATE POLICY "Users can update their own exam answers"
  ON public.user_exam_answers FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM user_exam_attempts
    WHERE id = user_exam_answers.attempt_id AND user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_exam_attempts
    WHERE id = attempt_id AND user_id = auth.uid()
  ));
```

### 2. **Deploy to Vercel**

1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect it's a Next.js project

3. **Configure Environment Variables** in Vercel:
   - Go to Project Settings → Environment Variables
   - Add the following variables:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NEXT_PUBLIC_USE_MOCK_AUTH=false
   ```

4. **Deploy**:
   - Click "Deploy"
   - Vercel will build and deploy your application

### 3. **Get Your Supabase Credentials**

From your Supabase Dashboard:

1. **Project URL**: Go to Settings → API → Project URL
2. **Anon Key**: Go to Settings → API → Project API keys → `anon` `public`
3. **Service Role Key**: Go to Settings → API → Project API keys → `service_role` `secret`

### 4. **Test the Deployment**

1. Visit your Vercel deployment URL
2. Test the exam functionality:
   - Take an exam
   - Change answers multiple times
   - Submit the exam
   - Verify correct scoring

### 5. **Troubleshooting**

If you encounter issues:

1. **Check Vercel Function Logs**:
   - Go to Vercel Dashboard → Your Project → Functions tab
   - Check for any error logs

2. **Verify Environment Variables**:
   - Ensure all required environment variables are set
   - Make sure `NEXT_PUBLIC_USE_MOCK_AUTH=false`

3. **Check Supabase Policies**:
   - Verify the UPDATE policy was applied successfully
   - Check RLS is enabled on `user_exam_answers` table

## 📋 Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | ✅ |
| `NEXT_PUBLIC_USE_MOCK_AUTH` | Set to `false` for production | ✅ |

## 🔧 Post-Deployment

After successful deployment:

1. **Update any hardcoded URLs** in your application to use the Vercel domain
2. **Test all functionality** thoroughly in the production environment
3. **Monitor** the application for any issues using Vercel's monitoring tools

## 🆘 Support

If you encounter any issues during deployment, check:
- Vercel deployment logs
- Supabase database logs
- Browser console for client-side errors 