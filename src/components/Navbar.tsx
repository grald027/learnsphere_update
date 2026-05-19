import React, { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import LogoIcon from '../assets/learnsphere_icon.png';

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
    { name: 'Sphere', href: '/ai-assistant' }
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled 
            ? 'bg-white/80 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] border-b border-gray-100/50 py-3' 
            : 'bg-gradient-to-b from-white/10 via-white/5 to-transparent backdrop-blur-sm py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Enhanced Logo Section */}
            <Link 
              to="/" 
              className="flex items-center space-x-3 group"
            >
              <motion.div 
                className="relative"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Animated gradient ring */}
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-accent/30 to-primary/30 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Logo container with glass morphism */}
                <div className="relative bg-gradient-to-br from-primary to-primary/80 p-2.5 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <img 
                    src={LogoIcon} 
                    alt="LearnSphere Logo" 
                    className="w-6 h-6 object-contain drop-shadow-sm"
                    style={{ filter: 'brightness(0) invert(1)' }}
                  />
                </div>
              </motion.div>
              
              <div className="flex flex-col">
                <motion.span 
                  className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent group-hover:from-primary group-hover:to-accent transition-all duration-300"
                  whileHover={{ x: 2 }}
                >
                  LearnSphere
                </motion.span>
                <span className="text-[11px] font-medium text-gray-400 tracking-wide hidden sm:block">
                  Offline-First Learning
                </span>
              </div>
            </Link>

            {/* Enhanced Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link, index) => {
                const isActive = location.pathname === link.href;
                return (
                  <motion.div
                    key={link.name}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      to={link.href}
                      className={`relative px-4 py-2.5 font-medium text-sm transition-all duration-300 rounded-lg ${
                        isActive 
                          ? 'text-primary' 
                          : 'text-gray-600 hover:text-primary'
                      }`}
                    >
                      {/* Hover background effect */}
                      <span className="absolute inset-0 rounded-lg bg-primary/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      
                      {/* Active indicator - bottom bar */}
                      <span
                        className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 h-0.5 bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-300 ${
                          isActive ? 'w-6 opacity-100' : 'w-0 opacity-0 group-hover:w-4 group-hover:opacity-60'
                        }`}
                      />
                      
                      {/* Text with slight scaling on hover */}
                      <span className="relative inline-block transition-transform duration-300 group-hover:scale-105">
                        {link.name}
                      </span>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* Enhanced Mobile Menu Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden relative w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-gray-200/50 hover:bg-white/20 transition-all duration-300"
            >
              <motion.div
                animate={{ rotate: isMobileMenuOpen ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-gray-700" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-700" />
                )}
              </motion.div>
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Improved Mobile Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            />
            
            {/* Menu panel */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-[72px] left-4 right-4 z-50 md:hidden"
            >
              <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                <div className="py-2 px-3 space-y-1">
                  {navLinks.map((link, index) => {
                    const isActive = location.pathname === link.href;
                    return (
                      <motion.div
                        key={link.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Link
                          to={link.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`relative block px-4 py-3 text-base font-medium rounded-xl transition-all duration-300 overflow-hidden group ${
                            isActive
                              ? 'text-primary bg-gradient-to-r from-primary/10 to-accent/10'
                              : 'text-gray-700 hover:text-primary hover:bg-gray-50'
                          }`}
                        >
                          {/* Hover slide effect */}
                          <span className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
                          
                          <span className="relative flex items-center justify-between">
                            {link.name}
                            {isActive && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-1.5 h-1.5 rounded-full bg-primary"
                              />
                            )}
                          </span>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
                
                {/* Decorative gradient line at bottom */}
                <div className="h-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
