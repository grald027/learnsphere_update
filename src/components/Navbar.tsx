import React, { useEffect, useState } from 'react';
import { Menu, X, ChevronDown, Search, User, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import LogoIcon from '../assets/learnsphere_icon.png';

export function Navbar({ theme, setTheme }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Background', href: '/background' },
    { 
      name: 'Features', 
      href: '/features',
      dropdown: [
        { name: 'Interactive Learning', href: '/features/interactive' },
        { name: 'Progress Tracking', href: '/features/progress' },
        { name: 'Gamification', href: '/features/gamification' },
      ]
    },
    { 
      name: 'Learning', 
      href: '/learning',
      dropdown: [
        { name: 'Courses', href: '/learning/courses' },
        { name: 'Quizzes', href: '/learning/quizzes' },
        { name: 'Resources', href: '/learning/resources' },
      ]
    },
    { name: 'Sphere', href: '/ai-assistant' }
  ];

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Implement search functionality
    console.log('Searching for:', searchQuery);
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled 
            ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg py-3' 
            : 'bg-transparent py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo Section - Enhanced */}
            <Link 
              to="/" 
              className="flex items-center space-x-3 group relative"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-lg blur-xl opacity-0 group-hover:opacity-70 transition-opacity duration-500"></div>
                <div className="relative bg-gradient-to-br from-primary to-accent p-2 rounded-xl shadow-md group-hover:shadow-xl transition-all duration-300">
                  <img 
                    src={LogoIcon} 
                    alt="LearnSphere Logo" 
                    className="w-7 h-7 object-contain"
                    style={{ filter: 'brightness(0) invert(1)' }}
                  />
                </div>
              </motion.div>
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  LearnSphere
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                  Offline-First Learning
                </span>
              </div>
            </Link>

            {/* Desktop Navigation - Enhanced */}
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.href || 
                  (link.dropdown && link.dropdown.some(item => location.pathname === item.href));
                
                return (
                  <div key={link.name} className="relative dropdown-container">
                    {link.dropdown ? (
                      <>
                        <button
                          onClick={() => setActiveDropdown(activeDropdown === link.name ? null : link.name)}
                          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 flex items-center space-x-1 group ${
                            isActive 
                              ? 'text-primary bg-primary/10' 
                              : 'text-gray-700 dark:text-gray-300 hover:text-primary hover:bg-primary/5'
                          }`}
                        >
                          <span>{link.name}</span>
                          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${
                            activeDropdown === link.name ? 'rotate-180' : ''
                          }`} />
                        </button>
                        
                        <AnimatePresence>
                          {activeDropdown === link.name && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.2 }}
                              className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50"
                            >
                              {link.dropdown.map((item) => (
                                <Link
                                  key={item.name}
                                  to={item.href}
                                  onClick={() => setActiveDropdown(null)}
                                  className={`block px-4 py-3 text-sm transition-colors ${
                                    location.pathname === item.href
                                      ? 'bg-primary/10 text-primary'
                                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                  }`}
                                >
                                  {item.name}
                                </Link>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    ) : (
                      <Link
                        to={link.href}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 relative group ${
                          isActive 
                            ? 'text-primary bg-primary/10' 
                            : 'text-gray-700 dark:text-gray-300 hover:text-primary hover:bg-primary/5'
                        }`}
                      >
                        {link.name}
                        {isActive && (
                          <motion.div
                            layoutId="activeNav"
                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        )}
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-3">
              {/* Search Bar - Desktop */}
              <form onSubmit={handleSearch} className="hidden md:block">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-48 pl-9 pr-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 border border-transparent rounded-lg focus:outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </form>

              {/* Theme Toggle */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </motion.button>

              {/* User Profile (Optional) */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="hidden md:flex items-center space-x-2 p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-semibold">
                  U
                </div>
              </motion.button>

              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation - Enhanced */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden"
            >
              <div className="px-4 pt-4 pb-6 space-y-2">
                {/* Mobile Search */}
                <form onSubmit={handleSearch} className="mb-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </form>

                {navLinks.map((link, index) => {
                  const isActive = location.pathname === link.href;
                  
                  if (link.dropdown) {
                    return (
                      <div key={link.name} className="space-y-2">
                        <div className="px-3 py-2 text-base font-medium text-gray-500 dark:text-gray-400">
                          {link.name}
                        </div>
                        <div className="ml-4 space-y-1 border-l-2 border-gray-200 dark:border-gray-700">
                          {link.dropdown.map((item) => (
                            <Link
                              key={item.name}
                              to={item.href}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                                location.pathname === item.href
                                  ? 'text-primary bg-primary/10'
                                  : 'text-gray-600 dark:text-gray-400 hover:text-primary hover:bg-primary/5'
                              }`}
                            >
                              {item.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  
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
                        className={`block px-3 py-3 text-base font-medium rounded-lg transition-all ${
                          isActive
                            ? 'text-primary bg-primary/10'
                            : 'text-gray-700 dark:text-gray-300 hover:text-primary hover:bg-primary/5'
                        }`}
                      >
                        {link.name}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Spacer to prevent content hiding under navbar */}
      <div className="h-16 md:h-20"></div>
    </>
  );
}
