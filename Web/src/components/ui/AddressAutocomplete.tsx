import React, { useRef, useEffect } from 'react';
import { Input } from './input';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string, details?: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  required?: boolean;
  id?: string;
  className?: string;
}

const GOOGLE_MAPS_API_KEY = 'AIzaSyDTRlbBes3PHeMaKgI9fJxygaaUEHwengc';

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  placeholder,
  required,
  id,
  className,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    // Load Google Maps script if not already loaded
    if (!window.google || !window.google.maps) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.onload = () => initAutocomplete();
      document.body.appendChild(script);
    } else {
      initAutocomplete();
    }
    // eslint-disable-next-line
  }, []);

  const initAutocomplete = () => {
    if (inputRef.current && window.google && window.google.maps) {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'de' },
      });
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current!.getPlace();
        onChange(inputRef.current!.value, place);
      });
    }
  };

  return (
    <Input
      ref={inputRef}
      id={id}
      className={className}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      autoComplete="off"
      type="text"
    />
  );
};

export default AddressAutocomplete; 