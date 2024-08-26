import React from 'react';
import { Database } from 'lucide-react';
import LogoutButton from './components/Logout';

const Header: React.FC = () => {
  return (
    <header className="shadow-sm bg-opacity-25">
      <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Database className="h-10 w-10 text-indigo-600 mr-3" />
            <h1 className="text-2xl sm:text-3xl font-bold text-indigo-800">
              SQL Challenge AI
            </h1>
          </div>
          <div className="flex items-center">
            <LogoutButton />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;