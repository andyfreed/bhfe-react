import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About Beacon Hill Financial Educators, Inc.</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Empowering individuals with the knowledge and tools to make informed financial decisions.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-12">
          <div className="md:flex">
            <div className="md:flex-shrink-0 relative h-64 md:h-auto md:w-1/3">
              <Image 
                src="/images/logo-registered.png" 
                alt="Beacon Hill Financial Educators, Inc."
                fill
                className="object-contain p-8"
              />
            </div>
            <div className="p-8 md:p-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
              <p className="text-gray-600 mb-6">
                At Beacon Hill Financial Educators, Inc., we believe that financial literacy is a fundamental skill that everyone deserves to master. Our mission is to provide accessible, comprehensive, and engaging financial education that empowers individuals to take control of their financial future.
              </p>
              <p className="text-gray-600">
                Through our carefully crafted courses, we break down complex financial concepts into understandable, actionable insights that you can apply to your daily life and long-term planning.
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Our Approach</h2>
            <p className="text-gray-600">
              We take a practical, jargon-free approach to financial education. Our courses combine theoretical knowledge with real-world applications, ensuring that you not only understand financial concepts but can also apply them effectively in your own life.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Our Expertise</h2>
            <p className="text-gray-600">
              Our team consists of experienced financial professionals who bring decades of industry knowledge to our educational content. Each course is developed with attention to accuracy, relevance, and practicality.
            </p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Accessibility</h3>
              <p className="text-gray-600">Financial education should be available to everyone, regardless of background.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Practicality</h3>
              <p className="text-gray-600">We focus on knowledge that can be applied to real-life financial decisions.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Clarity</h3>
              <p className="text-gray-600">We explain complex concepts in simple, understandable terms.</p>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Start Your Financial Education Journey Today</h2>
          <p className="text-gray-600 mb-8">
            Browse our course catalog and take the first step toward financial empowerment.
          </p>
          <a 
            href="/courses" 
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Explore Courses
          </a>
        </div>
      </div>
    </div>
  );
} 