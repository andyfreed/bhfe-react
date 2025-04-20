# BHFE React Application

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm (comes with Node.js)
- A Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone https://github.com/andyfreed/bhfe-react.git
cd bhfe-react
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Create a `.env.local` file in the root directory
   - Add the following variables:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

To get your Supabase credentials:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Project Settings -> API
4. Copy the "Project URL" for `NEXT_PUBLIC_SUPABASE_URL`
5. Copy the "anon" public key for `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Database Setup

The application requires specific tables and roles in your Supabase database:

1. Create the profiles table:
```sql
create table profiles (
  id uuid references auth.users on delete cascade,
  role text,
  primary key (id)
);
```

2. Set up the new user trigger:
```sql
create function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

3. To create an admin user:
   - Register a new user through the application
   - In Supabase SQL editor, run:
```sql
update profiles
set role = 'admin'
where id = 'your_user_id';
```

### Database Migrations

The application includes database migration scripts in the `src/db/migrations` directory. To apply migrations:

1. Connect to your Supabase database using the SQL Editor
2. Open and run each migration file in sequence

Key migrations include:

1. Creating user_enrollments table (`src/db/migrations/user_enrollments.sql`)
2. Adding image_url to courses (`src/db/migrations/add_image_url_to_courses.sql`)

To apply a single migration using our utility script:

```bash
node scripts/apply-migration.js src/db/migrations/add_image_url_to_courses.sql
```

Remember to run migrations in order as some might depend on previous ones.

### Running the Application

1. Start the development server:
```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

### Docker Development (macOS)

You can also use Docker to run the application, which ensures a consistent development environment:

1. Make sure Docker Desktop is installed on your Mac:
```bash
docker --version
```

2. Create a `.env` file in the root directory with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

3. Start the development environment:
```bash
docker compose -f docker-compose.dev.yml up --build
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

5. To stop the Docker containers, press `Ctrl+C` in the terminal or run:
```bash
docker compose -f docker-compose.dev.yml down
```

Benefits of using Docker for development:
- Consistent environment across all development machines
- No need to install Node.js locally
- Live code changes are automatically detected (using volume mounts)
- Easier onboarding for new developers

### Admin Access

The admin section is protected and requires authentication. To access:
1. Navigate to `/admin/login`
2. Log in with an admin user (must have role = 'admin' in profiles table)
3. You'll be redirected to the admin dashboard if authentication is successful

### Project Structure

```
bhfe-react/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   ├── lib/             # Utility libraries
│   └── styles/          # CSS and styling files
├── public/              # Static files
├── .env.local          # Local environment variables (not in git)
└── package.json        # Project dependencies and scripts
```

### Environment Variables

Required environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| NEXT_PUBLIC_SUPABASE_URL | Your Supabase project URL | https://xxx.supabase.co |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Your Supabase anon key | eyJ0eXAi... |

### Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

### Security Notes

- Never commit `.env.local` or any other files containing sensitive information
- Always use environment variables for sensitive configuration
- Keep your Supabase keys secure and never share them publicly

### Troubleshooting

Common issues:

1. **Supabase Connection Error**
   - Check if your `.env.local` file exists and has the correct values
   - Verify your Supabase project is active
   - Ensure you're using the correct URL format (should start with `https://`)

2. **Admin Access Denied**
   - Verify your user exists in the profiles table
   - Check if the role is set to 'admin'
   - Try logging out and back in

For more help, please submit an issue on GitHub.

# Cross-Computer Development Setup

When working on this project across multiple computers, you can use the following approaches to avoid authentication errors:

## Option 1: Use the Setup Script

We've included a setup script that makes it easy to configure your development environment:

```bash
# Run the setup script
npm run setup-dev
```

This script will guide you through setting up your environment and gives you two options:
1. Configure real Supabase credentials
2. Enable mock authentication (no real backend needed)

## Option 2: Manual Configuration

### Using Real Supabase Credentials
To use real Supabase credentials, ensure your `.env.local` file has the following variables:
```
NEXT_PUBLIC_SUPABASE_URL=your_actual_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key
NEXT_PUBLIC_USE_MOCK_AUTH=false
```

### Using Mock Authentication
For development without real Supabase credentials, you can enable mock authentication:
```
# In .env.local
NEXT_PUBLIC_USE_MOCK_AUTH=true
```

When mock authentication is enabled, you can login with:
- Email: test@example.com
- Password: password123
