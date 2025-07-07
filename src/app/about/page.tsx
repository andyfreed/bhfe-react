import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About Us | BHFE',
  description: 'Learn about our mission to provide high-quality healthcare finance education.',
};

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About BHFE</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Empowering healthcare finance professionals through comprehensive education and training programs.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-semibold text-gray-900 mb-6">Our Mission</h2>
            <p className="text-gray-700 text-lg mb-6">
              We are dedicated to providing cutting-edge healthcare finance education that prepares 
              professionals for the challenges of modern healthcare administration.
            </p>
            <p className="text-gray-700 text-lg mb-6">
              Our courses are designed by industry experts and delivered through innovative online 
              platforms to ensure maximum accessibility and engagement.
            </p>
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-blue-900 mb-3">Why Choose BHFE?</h3>
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  Expert-led curriculum
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  Flexible online learning
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  Industry-recognized certifications
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  Continuous support
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Our Values</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-800">Excellence</h4>
                  <p className="text-gray-600">Delivering the highest quality education and training.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Innovation</h4>
                  <p className="text-gray-600">Embracing new technologies and methodologies.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Accessibility</h4>
                  <p className="text-gray-600">Making education available to all professionals.</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Get Started</h3>
              <p className="text-gray-700 mb-4">
                Ready to advance your career in healthcare finance? Explore our comprehensive 
                course catalog and find the perfect program for your goals.
              </p>
              <Link 
                href="/courses" 
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Courses
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-16 bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Our Impact</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">1000+</div>
              <div className="text-gray-700">Students Trained</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">50+</div>
              <div className="text-gray-700">Course Modules</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">95%</div>
              <div className="text-gray-700">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 