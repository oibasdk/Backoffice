import React from 'react';

export const TWCard: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className = '' }) => {
  return (
    <div
      className={`bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 rounded-lg shadow-sm p-4 ${className}`}
      role="region"
    >
      {children}
    </div>
  );
};

export default TWCard;
