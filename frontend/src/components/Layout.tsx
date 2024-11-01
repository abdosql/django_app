import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <main className="pt-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto py-6">
        {children}
      </div>
    </main>
  );
} 