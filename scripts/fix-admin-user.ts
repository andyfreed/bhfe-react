import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findAndFixAdminUser() {
  const adminEmail = 'a.freed@outlook.com';
  
  console.log(`Looking for user with email: ${adminEmail}`);
  
  // First, find the user
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', adminEmail);
    
  if (userError) {
    console.error('Error finding user:', userError);
    return;
  }
  
  if (!users || users.length === 0) {
    console.log('User not found in users table');
    
    // Try auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error listing auth users:', authError);
      return;
    }
    
    const authUser = authUsers.users.find(u => u.email === adminEmail);
    if (authUser) {
      console.log('Found user in auth.users:', authUser.id);
      console.log('User metadata:', authUser.user_metadata);
    } else {
      console.log('User not found in auth.users either');
    }
    return;
  }
  
  const user = users[0];
  console.log('Found user:', user);
  
  // Check profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
    
  if (profileError) {
    console.error('Error finding profile:', profileError);
  } else {
    console.log('Current profile:', profile);
    
    // Update profile to admin
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        role: 'admin',
        first_name: 'Andrew',
        last_name: 'Freed'
      })
      .eq('id', user.id);
      
    if (updateError) {
      console.error('Error updating profile:', updateError);
    } else {
      console.log('Successfully updated user to admin role');
    }
  }
}

// Also search for users with name "student"
async function findStudentUsers() {
  console.log('\nLooking for users with name "student"...');
  
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .or('first_name.ilike.%student%,last_name.ilike.%student%,full_name.ilike.%student%');
    
  if (error) {
    console.error('Error searching profiles:', error);
    return;
  }
  
  if (profiles && profiles.length > 0) {
    console.log(`Found ${profiles.length} profiles with "student" in name:`);
    profiles.forEach(p => {
      console.log(`- ID: ${p.id}, Name: ${p.first_name} ${p.last_name}, Email: ${p.email || 'N/A'}`);
    });
  }
}

async function main() {
  await findAndFixAdminUser();
  await findStudentUsers();
}

main().catch(console.error); 