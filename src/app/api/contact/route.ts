import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    // Parse the request body
    const data = await request.json();
    
    // Validate required fields
    const { name, email, subject, message } = data;
    
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }
    
    // Get Supabase client
    const supabase = createServerSupabaseClient();
    
    // Insert into contact_inquiries table
    const { data: contactInquiry, error } = await supabase
      .from('contact_inquiries')
      .insert({
        name,
        email,
        subject,
        message,
        status: 'new',
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error saving contact inquiry:', error);
      
      // Fallback: Log the message if database insert fails
      console.log('Contact inquiry received:', {
        name,
        email,
        subject,
        message,
        date: new Date().toISOString(),
      });
      
      return NextResponse.json(
        { 
          message: 'Your message has been received, but there was an issue with our system. We\'ll contact you soon.',
          fallback: true 
        },
        { status: 200 }
      );
    }
    
    // For a production app, you might want to send an email notification here
    // Using a service like SendGrid, Mailgun, AWS SES, etc.
    
    /*
    // Example with SendGrid (would need to install @sendgrid/mail package)
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    // Send email to admin
    await sgMail.send({
      to: 'admin@bunnellhelfrich.com',
      from: 'noreply@bunnellhelfrich.com',
      subject: `New Contact Form Submission: ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\nMessage: ${message}`,
      html: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong> ${message}</p>
      `,
    });
    
    // Send confirmation email to user
    await sgMail.send({
      to: email,
      from: 'support@bunnellhelfrich.com',
      subject: 'We received your message',
      text: `Dear ${name},\n\nThank you for contacting us. We've received your message and will get back to you as soon as possible.\n\nRegards,\nBunnell Helfrich Financial Education Team`,
      html: `
        <p>Dear ${name},</p>
        <p>Thank you for contacting us. We've received your message and will get back to you as soon as possible.</p>
        <p>Regards,<br>Bunnell Helfrich Financial Education Team</p>
      `,
    });
    */
    
    return NextResponse.json({
      message: 'Your message has been received. We\'ll get back to you soon.',
      inquiryId: contactInquiry.id
    });
    
  } catch (error) {
    console.error('Error processing contact form submission:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    );
  }
} 