-- Create the profiles table
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  role text
);

-- Drop existing trigger if it exists
drop trigger if exists on_auth_user_created on auth.users;

-- Create or replace the function
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

-- Create the trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Find your user ID (run this first)
select id, email, created_at
from auth.users
where email = 'a.freed@outlook.com';

-- Set admin role for your user
update profiles
set role = 'admin'
where id = '59152c41-62dd-483f-a4ab-28d8bf44b219';

-- Verify the update
select id, role
from profiles
where id = '59152c41-62dd-483f-a4ab-28d8bf44b219'; 