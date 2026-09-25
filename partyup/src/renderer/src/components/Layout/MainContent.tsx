import React from 'react';

interface MainContentProps {
  children: React.ReactNode;
}

export function MainContent({ children }: MainContentProps) {
  return (
    <main className="app-main" role="main">
      <div className="main-content">
        {children}
      </div>
    </main>
  );
}
