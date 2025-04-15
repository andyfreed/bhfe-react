import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-128px)] flex items-center justify-center px-4 md:px-6">
      <div className="max-w-lg w-full text-center">
        <h1 className="text-7xl font-bold text-gray-900">404</h1>
        <h2 className="mt-4 text-2xl font-bold text-gray-800">Page Not Found</h2>
        <p className="mt-4 text-gray-600">
          Sorry, we couldn't find the page you're looking for. The page might have been moved or deleted.
        </p>
        <div className="mt-8 flex flex-col md:flex-row items-center justify-center gap-4">
          <Link 
            href="/" 
            className="px-6 py-3 rounded-lg text-white font-medium bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            Return Home
          </Link>
          <Link 
            href="/courses" 
            className="px-6 py-3 rounded-lg text-indigo-600 font-medium bg-white border border-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            Browse Courses
          </Link>
        </div>
      </div>
    </div>
  );
} 