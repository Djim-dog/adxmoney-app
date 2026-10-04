import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({ children, className = "" }) => {
  return (
    <div className={`adx-page-scope min-h-screen bg-slate-50 ${className}`}>
      <style>{`
        .adx-page-scope {
          isolation: isolate;
        }
        .adx-page-scope .bg-slate-50 {
          background-color: #F8FAFC !important;
        }
      `}</style>
      {children}
    </div>
  );
};
