'use client';

import Header from "./Header";
import Footer from "./Footer";

export default function ClientLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <div className="flex flex-col min-h-screen backdrop-blur-sm">
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
} 