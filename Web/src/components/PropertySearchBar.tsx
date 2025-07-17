
import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface PropertySearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onAddProperty: () => void;
}

const PropertySearchBar: React.FC<PropertySearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  onAddProperty
}) => {
  return (
    <div className="flex items-center space-x-2 w-full">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Liegenschaft suchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>
      <Button onClick={onAddProperty}>
        Liegenschaft hinzufügen
      </Button>
    </div>
  );
};

export default PropertySearchBar;
