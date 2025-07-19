import React from 'react';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

interface HeaderProps {
  toggleSidebar: () => void;
  title: string;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, title }) => {
  
  return (
    <header className="bg-white shadow-sm h-16 flex items-center px-4 justify-between">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-4 lg:hidden">
          <Menu size={24} />
        </Button>
        <h1 className="text-xl font-semibold">{title}</h1>
      </div>

    </header>
  );
};

export default Header;
