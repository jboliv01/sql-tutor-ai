import React from 'react';
import Header from './Header';
import "./globals.css";
// import Footer from './Footer';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
          {/* <Footer /> */}
        </div>
      </body>
    </html>
  );
}