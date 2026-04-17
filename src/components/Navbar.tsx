import React, { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';

// Import your logo icon (create this file in your assets folder)
import LogoIcon from '../assets/learnsphere-icon.svg'; // or use a PNG

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Background', href: '/background' },
    { name: 'Features', href: '/features' },
    { name: 'Learning', href: '/learning' },
    { name: 'Prototype', href: '/prototype' },
    { name: 'AI Assistant', href: '/ai-assistant' }
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/90 backdrop-blur-md shadow-sm py-3' 
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo with Site Icon */}
          <Link to="/" className="flex items-center space-x-3 group">
            {/* Custom Logo Icon - Replace BookOpen with your icon */}
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-lg blur-md group-hover:blur-lg transition-all opacity-0 group-hover:opacity-100"></div>
              <div className="relative bg-primary p-2 rounded-lg group-hover:bg-accent transition-all duration-300 shadow-md group-hover:shadow-lg">
                {/* Use your custom icon instead of BookOpen */}
                <img 
                  src={LogoIcon} 
                  alt="LearnSphere Logo" 
                  className="w-6 h-6 object-contain"
                  style={{ filter: 'brightness(0) invert(1)' }} // Makes icon white
                />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-dark tracking-tight group-hover:text-primary transition-colors">
                LearnSphere
              </span>
              <span className="text-xs text-gray-500 hidden sm:block">Offline-First Learning</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`font-medium text-sm transition-colors relative group ${
                    isActive ? 'text-primary' : 'text-gray hover:text-primary'
                  }`}
                >
                  {link.name}
                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all duration-300 ${
                      isActive ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                  />
                </Link>
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-dark hover:text-primary focus:outline-none p-2 rounded-lg hover:bg-secondary/50 transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100 shadow-lg overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    to={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-3 py-3 text-base font-medium rounded-md transition-colors ${
                      isActive
                        ? 'text-primary bg-secondary/50'
                        : 'text-gray hover:text-primary hover:bg-secondary'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
