
import React from 'react';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  toggleSidebar: () => void;
  title: string;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, title }) => {
  const navigate = useNavigate();
  
  return (
    <header className="bg-white shadow-sm h-16 flex items-center px-4 justify-between">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-4 lg:hidden">
          <Menu size={24} />
        </Button>
        <h1 className="text-xl font-semibold">{title}</h1>
      </div>
      <div className="flex items-center">
        {/* Placeholder for user profile or additional actions */}
        <Button 
          variant="ghost" 
          className="font-medium" 
          onClick={() => navigate('/')}
        >
          Objektbetreuer Portal
        </Button>
      </div>
    </header>
  );
};

export default Header;
