import React from 'react';
import { Link } from 'react-router-dom';

export default function Logo() {
  return (
    <Link to="/" className="flex items-center">
      <img 
        src="/assets/atmosense-logo.svg"  // Updated path to the logo
        alt="Temperature Monitor"
        className="h-14 w-auto" // Adjust size as needed
      />
    </Link>
  );
} 