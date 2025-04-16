'use client';
import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { STRIPE_PUBLISHABLE_KEY } from '@/config/stripe';
import { useRouter } from 'next/navigation';

// Initialize Stripe conditionally with error handling
let stripePromise: Promise<any> | null = null;

try {
  if (typeof STRIPE_PUBLISHABLE_KEY === 'string' && STRIPE_PUBLISHABLE_KEY) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY).catch(err => {
      console.warn('Stripe could not be loaded:', err);
      return null;
    });
  }
} catch (error) {
  console.warn('Error initializing Stripe:', error);
  stripePromise = null;
}

interface CourseEnrollButtonProps {
  courseId: string;
  selectedFormat?: string;
  formatPrice?: number;
}

export function CourseEnrollButton({ 
  courseId,
  selectedFormat,
  formatPrice
}: CourseEnrollButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [currentFormat, setCurrentFormat] = useState(selectedFormat);
  const [currentPrice, setCurrentPrice] = useState(formatPrice);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const router = useRouter();
  
  // Update local state when props change
  useEffect(() => {
    setCurrentFormat(selectedFormat);
    setCurrentPrice(formatPrice);
  }, [selectedFormat, formatPrice]);
  
  // Check if the user is already enrolled in this course
  useEffect(() => {
    async function checkEnrollment() {
      try {
        const response = await fetch('/api/user/enrollments');
        
        if (response.status === 401) {
          // User not authenticated, nothing to do
          return;
        }
        
        if (!response.ok) {
          throw new Error(`Error fetching enrollments: ${response.status}`);
        }
        
        const enrollments = await response.json();
        const isAlreadyEnrolled = enrollments.some(
          (enrollment: any) => enrollment.course_id === courseId
        );
        
        setIsEnrolled(isAlreadyEnrolled);
      } catch (error) {
        console.error('Error checking enrollment:', error);
      }
    }
    
    if (courseId) {
      checkEnrollment();
    }
  }, [courseId]);

  const handleFreeEnrollment = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/user/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 409) {
          // Already enrolled
          setIsEnrolled(true);
          alert('You are already enrolled in this course');
          return;
        }
        throw new Error(data.error || 'Failed to enroll in course');
      }
      
      setIsEnrolled(true);
      alert('Successfully enrolled in course!');
      
      // Redirect to my courses page
      router.push('/my-courses');
    } catch (error) {
      console.error('Enrollment error:', error);
      alert('Enrollment failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaidEnrollment = async () => {
    // Check if there was a previous Stripe error
    if (stripeError) {
      alert(`Payment system is currently unavailable (${stripeError}). Please try again later or contact support.`);
      return;
    }
    
    // Only proceed if Stripe is available
    if (!stripePromise) {
      setStripeError('Payment system not configured');
      alert('Payment system is not available. Please try again later or contact support.');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Create checkout session
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
          format: currentFormat,
          price: currentPrice
        }),
      });

      const { sessionId, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      // Try to get Stripe instance
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      // Redirect to checkout
      const result = await stripe.redirectToCheckout({
        sessionId,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      setStripeError(error.message || 'Unknown error');
      alert(`Payment failed: ${error.message || 'Unknown error'}. Please try again later.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnrollClick = async () => {
    // For demonstration purposes, if price is 0 or not set, use free enrollment
    // In a production environment, you'd want more robust logic here
    if (!currentPrice || currentPrice <= 0) {
      await handleFreeEnrollment();
    } else {
      await handlePaidEnrollment();
    }
  };

  if (isEnrolled) {
    return (
      <button
        onClick={() => router.push('/my-courses')}
        className={`
          w-full py-4 px-6 rounded-lg font-bold text-white text-center 
          flex items-center justify-center relative overflow-hidden
          transition-all duration-300 shadow-md
          bg-gradient-to-r from-green-600 to-green-700 hover:shadow-lg
        `}
      >
        <div className="relative z-10 flex items-center">
          <span className="mr-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </span>
          Go To My Courses
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={handleEnrollClick}
      disabled={isLoading}
      className={`
        w-full py-4 px-6 rounded-lg font-bold text-white text-center 
        flex items-center justify-center relative overflow-hidden
        transition-all duration-300 shadow-md
        ${isLoading 
          ? 'bg-neutral-400 cursor-not-allowed' 
          : 'bg-gradient-to-r from-blue-600 to-blue-800 hover:shadow-lg hover:from-blue-700 hover:to-blue-900'
        }
      `}
    >
      <div className="relative z-10 flex items-center">
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </>
        ) : (
          <>
            <span className="mr-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </span>
            {currentPrice && currentPrice > 0 
              ? (currentFormat ? `Enroll Now (${currentFormat})` : 'Enroll Now') 
              : 'Enroll Now (Free)'}
          </>
        )}
      </div>
      
      {/* Animated gradient to give a shimmer effect on hover */}
      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-all duration-1000 ease-in-out"></div>
    </button>
  );
}

// For default imports
export default CourseEnrollButton; 