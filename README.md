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

### Running the Application

1. Start the development server:
```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

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
