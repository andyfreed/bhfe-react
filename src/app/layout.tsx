import '@/styles/theme.css'
import './globals.css'
import { Inter } from 'next/font/google'
import { Metadata } from 'next'
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const inter = Inter({ subsets: ['latin'] })

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
      <body className={`${inter.className} min-h-screen bg-theme-neutral-50`}>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </div>
        <script src="//code.jivosite.com/widget/mUoKDT8qDo" async></script>
      </body>
    </html>
  )
}
