'use client';
import Image from 'next/image';
import Link from 'next/link';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="pt-16">
      <div className="bg-gray-100 py-4">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-8">
              <p className="flex items-start space-x-4">
                <Image
                  src="/images/Affiliation-CFP.png"
                  width={100}
                  height={50}
                  alt="CFP Affiliation Logo"
                  className="mt-1"
                />
                <span>
                  CFP®, CERTIFIED FINANCIAL PLANNER® are certification marks owned by the Certified Financial Planner Board of Standards, Inc. These marks are awarded to individuals who successfully complete CFP® Board's initial and ongoing certification requirements.
                </span>
              </p>
              <p className="flex items-start space-x-4 mt-4">
                <Image
                  src="/images/nasba.png"
                  width={100}
                  height={50}
                  alt="National Association of State Boards of Accountancy (NASBA) Logo"
                  className="mt-1"
                  style={{ width: 'auto', height: '50px' }}
                />
                <span>
                  Beacon Hill Financial Educators, Inc. is registered with the National Association of State Boards of Accountancy (NASBA) as a sponsor of continuing professional education on the National Registry of CPE Sponsors. State boards of accountancy have final authority on the acceptance of individual courses for CPE credit. Complaints regarding registered sponsors may be submitted to the National Registry of CPE Sponsors through its website: <a href="https://www.nasbaregistry.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.nasbaregistry.org</a>
                </span>
              </p>
            </div>
            <div className="md:col-span-3 md:col-start-10">
              <div className="space-y-4">
                <Image
                  src="/images/cfp-board.png"
                  width={200}
                  height={60}
                  alt="CFP Continuing Education Provider Logo"
                  className="w-full"
                />
                <Image
                  src="/images/ce.png"
                  width={200}
                  height={60}
                  alt="IRS Approved Continuing Education Provider"
                  className="w-full"
                />
                <Image
                  src="/images/iwi_logo.png"
                  width={200}
                  height={60}
                  alt="Investments & Wealth Institute"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-black py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-8">
              <p className="text-white text-xl">
                Have a Question? <a href="tel:8005887039" className="text-blue-400 hover:text-blue-300">Call 800-588-7039</a>
              </p>
            </div>
            <div className="md:col-span-3 md:col-start-10">
              <a href="https://discord.gg/ZFmUmbD269" title="Discord" target="_blank" rel="noopener noreferrer">
                <Image
                  src="/images/discord.png"
                  width={150}
                  height={50}
                  alt="Discord"
                  className="w-full"
                />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mt-8">
            <div className="md:col-span-8 text-center text-white">
              <p>
                Copyright © 2001 – {currentYear}, All Rights Reserved.<br />
                Beacon Hill Financial Educators Inc.<br />
                51A Middle Street, Newburyport, MA 01950<br />
                <a href="tel:8005887039" className="hover:text-blue-300">800.588.7039</a>
                <span className="hidden md:inline">&nbsp;&nbsp;&nbsp;&nbsp;</span>
                <a href="mailto:contact@bhfe.com" className="hover:text-blue-300">contact@bhfe.com</a>
              </p>
            </div>
            <div className="md:col-span-4">
              <nav>
                <ul className="flex flex-col md:flex-row justify-center md:justify-end space-y-2 md:space-y-0 md:space-x-6 text-white">
                  <li><Link href="/privacy" className="hover:text-blue-300">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="hover:text-blue-300">Terms of Use</Link></li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 