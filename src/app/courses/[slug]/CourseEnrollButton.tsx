'use client';
import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { STRIPE_PUBLISHABLE_KEY } from '@/config/stripe';

// Only initialize Stripe if the key exists
const stripePromise = typeof STRIPE_PUBLISHABLE_KEY === 'string' && STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(STRIPE_PUBLISHABLE_KEY)
  : null;

interface CourseEnrollButtonProps {
  courseId: string;
}

export function CourseEnrollButton({ courseId }: CourseEnrollButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleEnrollClick = async () => {
    // Only proceed if Stripe is available
    if (!stripePromise) {
      console.error('Stripe configuration is missing');
      alert('Payment system is not configured. Please try again later.');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Create Stripe checkout session
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
        }),
      });

      const { sessionId, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      // Redirect to Stripe checkout
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to load');

      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId,
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleEnrollClick}
      disabled={isLoading}
      className="w-full bg-theme-accent-DEFAULT hover:bg-theme-accent-dark text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
    >
      {isLoading ? 'Processing...' : 'Enroll Now'}
    </button>
  );
}

// For default imports
export default CourseEnrollButton; 