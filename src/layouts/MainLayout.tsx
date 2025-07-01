
import React from 'react';

interface MainLayoutProps {
  children: React.ReactNode;
  activeModule: string | null;
  setActiveModule: (module: any) => void;
}

export function MainLayout({ children, activeModule, setActiveModule }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4">
        {children}
      </div>
    </div>
  );
}
