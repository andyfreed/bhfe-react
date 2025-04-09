import Link from 'next/link';

export default function ThankYouPage() {
  return (
    <main className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 bg-theme-primary-light/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <svg 
              className="w-10 h-10 text-theme-primary-DEFAULT" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 13l4 4L19 7" 
              />
            </svg>
          </div>
          
          <h1 className="text-4xl font-bold text-theme-neutral-800 mb-4">
            Thank You!
          </h1>
          
          <p className="text-xl text-theme-neutral-600 mb-8">
            Your message has been received. We appreciate you taking the time to reach out and we'll get back to you as soon as possible.
          </p>
          
          <div className="bg-theme-neutral-50 rounded-lg p-6 mb-8 border border-theme-neutral-200">
            <h2 className="text-lg font-semibold text-theme-neutral-800 mb-2">
              What happens next?
            </h2>
            <p className="text-theme-neutral-600 mb-4">
              A member of our team will review your inquiry and respond within 1-2 business days. 
              If your matter is urgent, please feel free to call us directly.
            </p>
            <p className="text-theme-neutral-600">
              <strong>Phone:</strong> (800) 555-1234
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/"
              className="px-6 py-3 bg-theme-primary-DEFAULT text-white rounded-lg hover:bg-theme-primary-dark transition-colors"
            >
              Return to Home
            </Link>
            
            <Link 
              href="/courses"
              className="px-6 py-3 bg-white border border-theme-neutral-200 text-theme-neutral-800 rounded-lg hover:bg-theme-neutral-50 transition-colors"
            >
              Browse Courses
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
} 