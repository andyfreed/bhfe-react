import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <section className="bg-blue-900 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Professional Education for Financial Advisors
              </h1>
              <p className="text-xl mb-8">
                Comprehensive continuing education courses for CFP®, CPA, and other financial professionals.
              </p>
              <Link 
                href="/courses" 
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors"
              >
                View Our Courses
              </Link>
            </div>
            <div className="relative h-[400px]">
              <Image
                src="/images/hero-image.jpg"
                fill
                style={{ objectFit: 'cover' }}
                alt="Financial Education"
                className="rounded-lg shadow-xl"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Beacon Hill Financial Educators?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="text-4xl mb-4">🎓</div>
              <h3 className="text-xl font-bold mb-3">Expert Instructors</h3>
              <p>Learn from experienced professionals with real-world expertise in financial planning and education.</p>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-xl font-bold mb-3">Accredited Courses</h3>
              <p>Our courses are approved for CFP®, CPA, and IRS continuing education credits.</p>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl mb-4">🌐</div>
              <h3 className="text-xl font-bold mb-3">Flexible Learning</h3>
              <p>Access our courses online at your convenience, with comprehensive support when you need it.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Featured Courses</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Course cards will be dynamically populated here */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-bold mb-3">CFP® Certification Course</h3>
                <p className="text-gray-600 mb-4">Comprehensive preparation for the CFP® certification examination.</p>
                <Link 
                  href="/courses/cfp-certification" 
                  className="text-blue-600 hover:text-blue-800 font-semibold"
                >
                  Learn More →
                </Link>
              </div>
            </div>
            {/* Add more course cards as needed */}
          </div>
        </div>
      </section>
    </>
  );
}
