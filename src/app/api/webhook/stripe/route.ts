import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } from '@/config/stripe';
import { createServerSupabaseClient } from '@/lib/supabase';
import { SupabaseClient } from '@supabase/supabase-js';

const stripe = new Stripe(STRIPE_SECRET_KEY);

export async function POST(req: NextRequest) {
  let event: Stripe.Event;
  const signature = req.headers.get('stripe-signature') as string;
  const body = await req.text();

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle the event
  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Get metadata from the session
      const { courseId, format } = session.metadata as { 
        courseId: string, 
        format: string 
      };
      
      // Make sure we have the user ID and course ID
      if (!courseId || !session.customer_email) {
        throw new Error('Missing required metadata');
      }

      // Create the Supabase client
      const supabase = createServerSupabaseClient();
      
      // Get user by email
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', session.customer_email);
      
      if (userError || !users || users.length === 0) {
        throw new Error(`User not found for email: ${session.customer_email}`);
      }
      
      const userId = users[0].id;
      
      // Check if enrollment already exists
      const { data: existingEnrollments, error: checkError } = await supabase
        .from('user_enrollments')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', courseId);
        
      if (existingEnrollments && existingEnrollments.length > 0) {
        // Enrollment already exists, no need to create a new one
        console.log(`Enrollment already exists for user ${userId} and course ${courseId}`);
        return NextResponse.json({ success: true });
      }
      
      // Create enrollment in the database
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('user_enrollments')
        .insert([
          {
            user_id: userId,
            course_id: courseId,
            enrolled_at: new Date().toISOString(),
            progress: 0,
            completed: false,
            payment_id: session.id,
            enrollment_type: 'paid',
            enrollment_notes: `Paid for ${format} format via Stripe (${session.id})`
          }
        ]);
      
      if (enrollmentError) {
        throw new Error(`Failed to create enrollment: ${enrollmentError.message}`);
      }
      
      console.log(`Created enrollment for user ${userId}, course ${courseId}`);
      
      return NextResponse.json({ success: true });
    }
    
    // Return a 200 response for other event types
    return NextResponse.json({ received: true });
    
  } catch (error: any) {
    console.error(`Webhook error: ${error.message}`);
    return NextResponse.json(
      { error: `Webhook handler failed: ${error.message}` },
      { status: 500 }
    );
  }
} 