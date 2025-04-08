'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const isInAdmin = pathname?.startsWith('/admin');

  return (
    <header className="site-header">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-12 items-center">
          <div className="col-span-6 md:col-span-3 logo-container">
            <Link href="/" title="Home">
              <Image
                src="/images/logo-registered.png"
                width={200}
                height={60}
                alt="Beacon Hill Financial Educators Logo"
                className="pb-1"
              />
            </Link>
          </div>
          
          <div className="col-span-4 md:col-span-7 hidden md:block"></div>
          
          <div className="col-span-2 md:hidden">
            <div className="mobile-nav">
              <button 
                className="nav-toggle"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <span className="block w-6 h-0.5 bg-black mb-1"></span>
                <span className="block w-6 h-0.5 bg-black mb-1"></span>
                <span className="block w-6 h-0.5 bg-black"></span>
              </button>
            </div>
          </div>
          
          <nav className={`col-span-12 md:col-span-9 ${isMenuOpen ? 'block' : 'hidden'} md:block`}>
            <ul className="flex flex-col md:flex-row md:justify-end space-y-2 md:space-y-0 md:space-x-6">
              <li><Link href="/" className="hover:text-blue-600">Home</Link></li>
              <li><Link href="/courses" className="hover:text-blue-600">Courses</Link></li>
              <li><Link href="/about" className="hover:text-blue-600">About</Link></li>
              <li><Link href="/contact" className="hover:text-blue-600">Contact</Link></li>
              <li>
                <Link 
                  href={isInAdmin ? "/" : "/login"} 
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  {isInAdmin ? "Exit Admin" : "Admin Panel"}
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header; 