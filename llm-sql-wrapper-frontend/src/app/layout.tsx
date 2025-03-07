'use client';

import React from 'react';
import { SessionProvider } from "next-auth/react";
import LayoutContent from './LayoutContent';
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <LayoutContent>{children}</LayoutContent>
        </SessionProvider>
      </body>
    </html>
  );
}