'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getSession, logout } from '@/lib/authService';
import { useAdminCheck } from '@/hooks/useAdminCheck';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { isAdmin } = useAdminCheck();
  const menuRef = useRef<HTMLDivElement>(null);
  const userMenuButtonRef = useRef<HTMLButtonElement>(null);
  const userMenuDropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const isInAdmin = pathname?.startsWith('/admin');

  useEffect(() => {
    async function checkAuth() {
      const { data: session } = await getSession();
      if (session) {
        setIsLoggedIn(true);
        const email = session.user?.email || '';
        setUserName(email.split('@')[0] || 'User');
      } else {
        setIsLoggedIn(false);
      }
      setIsLoading(false);
    }
    
    checkAuth();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      
      // Check if click was outside the user menu
      const isClickInUserMenu = 
        (userMenuButtonRef.current && userMenuButtonRef.current.contains(event.target as Node)) ||
        (userMenuDropdownRef.current && userMenuDropdownRef.current.contains(event.target as Node));
        
      if (!isClickInUserMenu && userMenu) {
        setUserMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenu]);

  // Close mobile menu when navigating
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      setUserMenu(false);
      // Forcing a reload to clear all states and re-render the page
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="site-header bg-white shadow-sm py-4">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <div className="logo-container">
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
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button 
              className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-expanded={isMenuOpen}
              aria-label="Toggle menu"
            >
              <span className="sr-only">Open menu</span>
              {isMenuOpen ? (
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
          
          {/* Desktop navigation */}
          <nav className="hidden md:block">
            <ul className="flex space-x-6 items-center">
              <li><Link href="/" className="hover:text-blue-600">Home</Link></li>
              <li><Link href="/courses" className="hover:text-blue-600">Courses</Link></li>
              <li><Link href="/about" className="hover:text-blue-600">About</Link></li>
              <li><Link href="/contact" className="hover:text-blue-600">Contact</Link></li>
              
              {isInAdmin && (
                <li>
                  <Link 
                    href="/" 
                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Exit Admin
                  </Link>
                </li>
              )}
              
              {!isLoading && !isLoggedIn && !isInAdmin && (
                <>
                  <li>
                    <Link href="/login" className="text-indigo-600 hover:text-indigo-800 font-medium">
                      Login
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/register" 
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                    >
                      Register
                    </Link>
                  </li>
                </>
              )}
              
              {!isLoading && isLoggedIn && !isInAdmin && (
                <li className="relative">
                  <button 
                    ref={userMenuButtonRef}
                    onClick={() => setUserMenu(!userMenu)}
                    className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    <span>{userName}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {userMenu && (
                    <div 
                      ref={userMenuDropdownRef}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200"
                    >
                      <Link 
                        href="/account" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        My Account
                      </Link>
                      <Link 
                        href="/my-courses" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        My Courses
                      </Link>
                      {isAdmin && (
                        <Link 
                          href="/admin" 
                          className="block px-4 py-2 text-sm text-indigo-600 hover:bg-gray-100 font-medium"
                        >
                          Admin Dashboard
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </li>
              )}
              
              {!isLoggedIn && !isInAdmin && (
                <li>
                  <Link 
                    href="/admin/login" 
                    className="text-gray-500 hover:text-gray-700 text-sm"
                  >
                    Admin
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        </div>
        
        {/* Mobile navigation menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-2 border-t border-gray-200" ref={menuRef}>
            <nav className="pt-2">
              <ul className="space-y-3">
                <li><Link href="/" className="block hover:text-blue-600">Home</Link></li>
                <li><Link href="/courses" className="block hover:text-blue-600">Courses</Link></li>
                <li><Link href="/about" className="block hover:text-blue-600">About</Link></li>
                <li><Link href="/contact" className="block hover:text-blue-600">Contact</Link></li>
                
                {isInAdmin && (
                  <li>
                    <Link 
                      href="/" 
                      className="block text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Exit Admin
                    </Link>
                  </li>
                )}
                
                {!isLoading && !isLoggedIn && !isInAdmin && (
                  <>
                    <li>
                      <Link href="/login" className="block text-indigo-600 hover:text-indigo-800 font-medium">
                        Login
                      </Link>
                    </li>
                    <li>
                      <Link 
                        href="/register" 
                        className="block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-center"
                      >
                        Register
                      </Link>
                    </li>
                  </>
                )}
                
                {!isLoading && isLoggedIn && !isInAdmin && (
                  <>
                    <li className="border-t border-gray-100 pt-2 mt-2">
                      <div className="font-medium text-gray-800">
                        Logged in as: {userName}
                      </div>
                    </li>
                    <li>
                      <Link 
                        href="/account" 
                        className="block text-gray-700 hover:text-indigo-600"
                      >
                        My Account
                      </Link>
                    </li>
                    <li>
                      <Link 
                        href="/my-courses" 
                        className="block text-gray-700 hover:text-indigo-600"
                      >
                        My Courses
                      </Link>
                    </li>
                    {isAdmin && (
                      <li>
                        <Link 
                          href="/admin" 
                          className="block text-indigo-600 hover:text-indigo-600 font-medium"
                        >
                          Admin Dashboard
                        </Link>
                      </li>
                    )}
                    <li>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left text-red-600 hover:text-red-800"
                      >
                        Logout
                      </button>
                    </li>
                  </>
                )}
                
                {!isLoggedIn && !isInAdmin && (
                  <li className="border-t border-gray-100 pt-3 mt-3">
                    <Link 
                      href="/admin/login" 
                      className="block text-gray-500 hover:text-gray-700 text-sm"
                    >
                      Admin
                    </Link>
                  </li>
                )}
              </ul>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 