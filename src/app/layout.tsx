import '@/styles/theme.css'
import './globals.css'
import { Poppins } from 'next/font/google'
import { Metadata } from 'next'
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'BH Financial Education',
  description: 'Professional education courses for financial professionals',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${poppins.className} min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100`}>
        <div className="flex flex-col min-h-screen backdrop-blur-sm">
          <Header />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  )
}
