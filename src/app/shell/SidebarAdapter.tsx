import React from 'react';
import { Link } from 'react-router-dom';

type NavItem = {
  id?: string | number;
  label?: string;
  url?: string;
  children?: NavItem[];
};

const renderItems = (items: NavItem[] = []) => {
  return items.map((it) => (
    <div key={String(it.id || it.label)} className="mb-1">
      {it.children && it.children.length ? (
        <details className="group">
          <summary className="cursor-pointer py-2 px-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800">{it.label}</summary>
          <div className="pl-4 mt-2">{renderItems(it.children)}</div>
        </details>
      ) : (
        <Link
          to={it.url || '#'}
          className="block py-2 px-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          {it.label}
        </Link>
      )}
    </div>
  ));
};

const SidebarAdapter: React.FC<{ sections?: any[] }> = ({ sections = [] }) => {
  return (
    <nav className="w-full">
      {sections.map((s, idx) => (
        <div key={idx} className="mb-4">
          {s.title && <div className="px-2 text-xs font-semibold text-neutral-500 uppercase mb-2">{s.title}</div>}
          <div className="px-2">{renderItems(s.items || s.children || [])}</div>
        </div>
      ))}
    </nav>
  );
};

export default SidebarAdapter;
