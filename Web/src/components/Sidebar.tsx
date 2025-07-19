import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Building, ListTodo, Home, Users, DollarSign, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getInitials = (email: string) => {
    return email.split('@')[0].substring(0, 2).toUpperCase();
  };
  
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
      label: 'Liegenschaftsaufträge',
      path: '/jobs'
    },
    {
      icon: <ListTodo size={20} />,
      label: 'Baustellen',
      children: [
        {
          label: 'Wasserschäden',
          path: '/jobs/baustellen/wasserschaden',
        },
        {
          label: 'Sonderaufträge',
          path: '/jobs/baustellen/sonderauftrag',
        },
      ]
    },
    {
      icon: <ListTodo size={20} />,
      label: 'Meine Aufträge',
      path: '/meine-auftraege'
    },
    {
      icon: <Users size={20} />,
      label: 'Mitarbeiter',
      path: '/employees'
    },
    {
      icon: <DollarSign size={20} />,
      label: 'Bilanz',
      path: '/balance'
    }
  ];

  // Close sidebar when clicking outside on mobile
  const handleClickOutside = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Check if any child route is active for a given parent
  const isParentActive = (children: any[]) => {
    return children.some(child => location.pathname === child.path);
  };

  // Check if a route should be highlighted, excluding Baustellen routes from Liegenschaftsaufträge
  const isRouteActive = (path: string) => {
    if (path === '/jobs') {
      // Only highlight Liegenschaftsaufträge if we're exactly on /jobs or /jobs/:id (but not Baustellen routes)
      return location.pathname === '/jobs' || 
             (location.pathname.startsWith('/jobs/') && 
              !location.pathname.startsWith('/jobs/baustellen/'));
    }
    return location.pathname === path;
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
          "fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-50 transition-transform duration-300 lg:translate-x-0 lg:static lg:z-0 flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-primary">Objektverwaltung</h2>
        </div>
        
        <nav className="p-3 space-y-1 flex-1">
          {sidebarLinks.map((link) => (
            link.children ? (
              <div key={link.label}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2 font-semibold text-sm",
                  isParentActive(link.children)
                    ? "text-primary bg-primary/10 rounded-md"
                    : "text-gray-700"
                )}>
                  {link.icon}
                  <span>{link.label}</span>
                </div>
                <div className="ml-8 space-y-1">
                  {link.children.map((child) => (
                    <NavLink
                      key={child.path}
                      to={child.path}
                      onClick={() => onClose()}
                      className={({ isActive }) => cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md w-full text-sm",
                        isActive 
                          ? "bg-primary text-primary-foreground" 
                          : "text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      <span>{child.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            ) : (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => onClose()}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md w-full text-sm",
                  isRouteActive(link.path)
                    ? "bg-primary text-primary-foreground" 
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                {link.icon}
                <span>{link.label}</span>
              </NavLink>
            )
          ))}
        </nav>
        
        {/* User Profile Section */}
        {currentUser && (
          <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3 h-auto p-3 hover:bg-gray-100 rounded-none"
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {getInitials(currentUser.email || '')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start min-w-0 flex-1">
                    <span className="text-sm font-medium text-gray-900 truncate w-full">
                      {currentUser.email}
                    </span>
                    <span className="text-xs text-gray-500">Angemeldet</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {currentUser.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      Angemeldet
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profil</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Abmelden</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;
