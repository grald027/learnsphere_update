import React from 'react';
import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
export function Footer() {
  return (
    <footer className="bg-dark text-white py-12 border-t border-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <Link
            to="/"
            className="flex items-center space-x-3 mb-6 md:mb-0 group">
            
            <div className="bg-primary/20 p-2 rounded-lg group-hover:bg-primary/30 transition-colors">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight block group-hover:text-primary-100 transition-colors">
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
            <p className="text-xs text-gray-500">
              &copy; {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </footer>);

}