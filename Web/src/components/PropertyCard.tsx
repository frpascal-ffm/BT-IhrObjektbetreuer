
import React from 'react';
import { Property } from '@/lib/firestore';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Building, Euro } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PropertyCardProps {
  property: Property;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  const navigate = useNavigate();
  
  return (
    <Card 
      className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(`/properties/${property.id}`)}
    >
      <CardContent className="p-0">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 p-2 rounded-md">
              <Building className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">{property.name}</h3>
              <p className="text-sm text-gray-500 truncate">{property.address}</p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 border-t border-gray-100 flex justify-between text-xs text-gray-500">
        <span>{property.type}</span>
        {property.monthlyIncome && property.monthlyIncome > 0 && (
          <span className="flex items-center gap-1 text-green-600 font-medium">
            <Euro className="h-3 w-3" />
            {property.monthlyIncome.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
          </span>
        )}
      </CardFooter>
    </Card>
  );
};

export default PropertyCard;
