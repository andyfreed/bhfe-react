'use client';
import { courses } from '@/data/courses';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { STRIPE_PUBLISHABLE_KEY } from '@/config/stripe';

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

interface Props {
  params: {
    slug: string;
  };
}

export default function CoursePage({ params }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const course = courses.find((c) => c.slug === params.slug);

  if (!course) {
    notFound();
  }

  const handleEnrollClick = async () => {
    try {
      setIsLoading(true);
      
      // Create Stripe checkout session
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: course.id,
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
    <div className="py-12 bg-brand-gray-bg">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Course Content */}
          <div className="lg:col-span-2">
            <div className="flex gap-2 mb-4">
              {course.type.map((type) => (
                <span
                  key={type}
                  className="px-3 py-1 text-sm font-semibold rounded-full bg-brand-gray-light text-brand-blue"
                >
                  {type}
                </span>
              ))}
            </div>
            
            <h1 className="text-4xl font-bold mb-6 text-brand-blue">{course.title}</h1>
            
            <div className="relative h-[400px] mb-8 rounded-lg overflow-hidden">
              <Image
                src={course.image || '/images/course-placeholder.jpg'}
                alt={course.title}
                fill
                style={{ objectFit: 'cover' }}
              />
            </div>

            <div className="prose max-w-none">
              <h2 className="text-2xl font-bold mb-4 text-brand-blue">Course Description</h2>
              <p className="mb-8 text-brand-gray-nav">{course.description}</p>

              <h2 className="text-2xl font-bold mb-4 text-brand-blue">Learning Objectives</h2>
              <ul className="space-y-2 mb-8">
                {course.objectives.map((objective, index) => (
                  <li key={index} className="flex items-start text-brand-gray-nav">
                    <span className="text-brand-orange mr-2">✓</span>
                    {objective}
                  </li>
                ))}
              </ul>

              <h2 className="text-2xl font-bold mb-4 text-brand-blue">Course Features</h2>
              <ul className="space-y-2 mb-8">
                {course.features.map((feature, index) => (
                  <li key={index} className="flex items-start text-brand-gray-nav">
                    <span className="text-brand-orange mr-2">•</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <h2 className="text-2xl font-bold mb-4 text-brand-blue">Instructor</h2>
              <div className="flex items-start gap-4">
                {course.instructor.image && (
                  <Image
                    src={course.instructor.image}
                    alt={course.instructor.name}
                    width={100}
                    height={100}
                    className="rounded-full"
                  />
                )}
                <div>
                  <h3 className="text-xl font-bold mb-2 text-brand-blue">{course.instructor.name}</h3>
                  <p className="text-brand-gray-nav">{course.instructor.bio}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Enrollment Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
              <div className="text-3xl font-bold mb-4 text-brand-orange">${course.price.toFixed(2)}</div>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-brand-gray-nav">Duration:</span>
                  <span className="font-semibold text-brand-blue">{course.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-gray-nav">Credits:</span>
                  <span className="font-semibold text-brand-blue">{course.credits} Credits</span>
                </div>
              </div>

              <button
                onClick={handleEnrollClick}
                disabled={isLoading}
                className="w-full bg-brand-orange hover:bg-brand-dark-orange text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : 'Enroll Now'}
              </button>

              <div className="mt-6 text-sm text-brand-gray-nav">
                <p className="mb-2">✓ Instant access</p>
                <p className="mb-2">✓ Certificate upon completion</p>
                <p>✓ 30-day money-back guarantee</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 