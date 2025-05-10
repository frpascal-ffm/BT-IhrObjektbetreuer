
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Building, ListTodo, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const sidebarLinks = [
    {
      icon: <Home size={20} />,
      label: 'Dashboard',
      path: '/'
    },
    {
      icon: <Building size={20} />,
      label: 'Liegenschaften',
      path: '/properties'
    },
    {
      icon: <ListTodo size={20} />,
      label: 'Aufträge',
      path: '/jobs'
    }
  ];

  // Close sidebar when clicking outside on mobile
  const handleClickOutside = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 lg:hidden z-40"
          onClick={handleClickOutside}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={cn(
          "fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-50 transition-transform duration-300 lg:translate-x-0 lg:static lg:z-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-primary">Objektverwaltung</h2>
        </div>
        
        <nav className="p-3 space-y-1">
          {sidebarLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              onClick={() => onClose()}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2 rounded-md w-full text-sm",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              {link.icon}
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
