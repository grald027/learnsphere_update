import React from 'react';
import { Link } from 'react-router-dom';
import LogoIcon from '../assets/learnsphere_icon.png'; // Same icon import

export function Footer() {
  return (
    <footer className="bg-dark text-white py-12 border-t border-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <Link
            to="/"
            className="flex items-center space-x-3 mb-6 md:mb-0 group"
          >
            {/* Logo Icon in Footer */}
            <div className="bg-primary/20 p-2 rounded-lg group-hover:bg-primary/30 transition-all duration-300">
              <img 
                src={LogoIcon} 
                alt="LearnSphere Logo" 
                className="w-6 h-6 object-contain"
                style={{ filter: 'brightness(0) invert(1)' }} // Makes icon white for dark background
              />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight block group-hover:text-primary transition-colors">
                LearnSphere
              </span>
              <span className="text-xs text-gray-400">
                Offline-First AI-Assisted Learning
              </span>
            </div>
          </Link>

          <div className="text-center md:text-right">
            <p className="text-sm text-gray-400 mb-2">
              Enhancing Access to Quality Online Education
            </p>
            <div className="flex items-center justify-center md:justify-end space-x-4 text-xs text-gray-500">
              <span>&copy; {new Date().getFullYear()} LearnSphere</span>
              <span>•</span>
              <span>Offline-First Platform</span>
              <span>•</span>
              <span>v1.0.0</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
