import { Link, useLocation } from 'react-router-dom';

export default function FirebaseNav() {
  const location = useLocation();
  
  const links = [
    { path: '/firebase/firestore', label: 'Firestore Example' },
    { path: '/firebase/auth', label: 'Authentication Example' }
  ];

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Firebase Examples</h1>
        <Link to="/" className="text-blue-600 hover:text-blue-800">
          Back to Dashboard
        </Link>
      </div>
      
      <nav className="flex border-b border-gray-200">
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`px-4 py-2 text-sm font-medium ${
              location.pathname === link.path
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
} 