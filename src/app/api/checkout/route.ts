import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '@/config/stripe';
import { getCourseWithRelations } from '@/lib/courses';
import type { CourseWithRelations } from '@/types/database';

// Create Stripe instance with latest API version
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

export async function POST(request: Request) {
  try {
    // Return early if Stripe is not configured
    if (!stripe) {
      return NextResponse.json(
        { error: 'Payment processing is not configured' },
        { status: 503 }
      );
    }
    
    const { courseId, format, price } = await request.json();
    
    // Fetch the course from the database with all relations
    const course = await getCourseWithRelations(courseId) as CourseWithRelations;

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Determine price based on format or use lowest price as fallback
    let finalPrice = 0;
    let selectedFormat = '';
    
    if (format && price) {
      // Use the selected format and price
      finalPrice = price;
      selectedFormat = format;
    } else if (course.formats && course.formats.length > 0) {
      // Fallback to lowest price from formats
      finalPrice = Math.min(...course.formats.map((f) => f.price));
      selectedFormat = course.formats.find(f => f.price === finalPrice)?.format || 'Default';
    }

    // Format the title and description for Stripe
    const title = course.title || 'Course';
    const description = course.description || '';
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${title} (${selectedFormat})`,
              description: description.substring(0, 500), // Limit description length for Stripe
            },
            unit_amount: Math.round(finalPrice * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${request.headers.get('origin')}/courses/${course.sku.toLowerCase().replace(/\s+/g, '-')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin')}/courses/${course.sku.toLowerCase().replace(/\s+/g, '-')}`,
      metadata: {
        courseId: course.id,
        format: selectedFormat,
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Error creating checkout session' },
      { status: 500 }
    );
  }
} 