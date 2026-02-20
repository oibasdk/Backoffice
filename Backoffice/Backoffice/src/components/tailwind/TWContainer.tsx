import React from 'react';

export const TWContainer: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className = '' }) => {
  return <div className={`container mx-auto px-6 py-8 ${className}`}>{children}</div>;
};

export default TWContainer;
