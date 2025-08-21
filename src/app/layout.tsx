import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from "next/script";
import './simple-globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Gym Body Analysis - AI-Powered Body Composition',
  description: 'Get instant body fat percentage analysis using advanced AI technology. Upload your photo for personalized fitness insights and recommendations.',
  keywords: 'body analysis, body fat percentage, gym, fitness, AI, body composition',
  authors: [{ name: 'Your Gym App' }],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#2563eb" />
        {/* Tailwind Play CDN - provides Tailwind utility classes at runtime without PostCSS */}
        
        <Script src="https://cdn.tailwindcss.com" strategy="afterInteractive" />
      </head>
      <body className={inter.className}>
        <main className="min-h-screen">
          {children}
        </main>
        
        {/* Footer */}
        <footer className="bg-gray-900 text-white py-8 mt-12">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Gym Body Analysis</h3>
              <p className="text-gray-400 text-sm">
                AI-powered body composition analysis for fitness enthusiasts
              </p>
            </div>
            
            <div className="border-t border-gray-800 pt-4">
              <p className="text-xs text-gray-500">
                © 2025 Gym Body Analysis. Results are estimates and should not replace professional medical advice.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}