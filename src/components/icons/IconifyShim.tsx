قimport React from 'react';

export const Icon: React.FC<{ icon?: string; width?: number }> = ({ icon, width }) => {
  // Lightweight fallback for environments without @iconify/react.
  // Renders a semantic inline element with the icon name for visual tests.
  return (
    <span aria-hidden="true" style={{ display: 'inline-block', width: width || 20 }}>
      {icon}
    </span>
  );
};

export default Icon;
