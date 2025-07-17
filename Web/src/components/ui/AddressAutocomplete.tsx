import React, { useRef, useEffect, useState } from 'react';
import { Input } from './input';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string, details?: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  required?: boolean;
  id?: string;
  className?: string;
  disabled?: boolean;
}

const GOOGLE_MAPS_API_KEY = 'AIzaSyDTRlbBes3PHeMaKgI9fJxygaaUEHwengc';

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  placeholder,
  required,
  id,
  className,
  disabled = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let script: HTMLScriptElement | null = null;

    const loadGoogleMapsScript = () => {
      return new Promise<void>((resolve, reject) => {
        // Check if Google Maps is already loaded
        if (window.google && window.google.maps && window.google.maps.places) {
          resolve();
          return;
        }

        // Check if script is already being loaded
        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
        if (existingScript) {
          existingScript.addEventListener('load', () => resolve());
          existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Maps')));
          return;
        }

        setIsLoading(true);
        setError(null);

        script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;

        script.addEventListener('load', () => {
          setIsLoading(false);
          resolve();
        });

        script.addEventListener('error', () => {
          setIsLoading(false);
          setError('Fehler beim Laden der Google Maps API');
          reject(new Error('Failed to load Google Maps'));
        });

        document.head.appendChild(script);
      });
    };

    const initAutocomplete = async () => {
      try {
        await loadGoogleMapsScript();

        if (inputRef.current && window.google && window.google.maps && window.google.maps.places) {
          // Clean up existing autocomplete if any
          if (autocompleteRef.current) {
            google.maps.event.clearInstanceListeners(autocompleteRef.current);
          }

          autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
            types: ['address'],
            componentRestrictions: { country: 'de' },
            fields: ['formatted_address', 'geometry', 'place_id', 'address_components'],
          });

          autocompleteRef.current.addListener('place_changed', () => {
            const place = autocompleteRef.current!.getPlace();
            if (place.formatted_address) {
              onChange(place.formatted_address, place);
            }
          });
        }
      } catch (err) {
        console.error('Error initializing Google Maps Autocomplete:', err);
        setError('Google Maps konnte nicht geladen werden');
      }
    };

    initAutocomplete();

    // Cleanup function
    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        id={id}
        className={`${className} ${error ? 'border-red-500' : ''} ${isLoading ? 'opacity-50' : ''}`}
        value={value}
        onChange={handleInputChange}
        placeholder={isLoading ? 'Lade Google Maps...' : placeholder}
        required={required}
        disabled={disabled || isLoading}
        autoComplete="off"
        type="text"
      />
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete; 