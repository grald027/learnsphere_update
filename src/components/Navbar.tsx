import React, { useEffect, useState } from 'react';
import { Menu, X, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
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
  {
    name: 'Home',
    href: '/'
  },
  {
    name: 'Background',
    href: '/background'
  },
  {
    name: 'Features',
    href: '/features'
  },
  {
    name: 'Learning',
    href: '/learning'
  },
  {
    name: 'Prototype',
    href: '/prototype'
  },
  {
    name: 'AI Assistant',
    href: '/ai-assistant'
  }];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`}>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="bg-primary p-2 rounded-lg group-hover:bg-accent transition-colors">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-dark tracking-tight">
              LearnSphere
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`font-medium text-sm transition-colors relative group ${isActive ? 'text-primary' : 'text-gray hover:text-primary'}`}>
                  
                  {link.name}
                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all duration-300 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`}>
                  </span>
                </Link>);

            })}
            <Link
              to="/learning"
              className="bg-primary hover:bg-accent text-white px-5 py-2 rounded-full text-sm font-medium transition-colors shadow-sm hover:shadow-md">
              
              Explore Platform
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-dark hover:text-primary focus:outline-none">
              
              {isMobileMenuOpen ?
              <X className="w-6 h-6" /> :

              <Menu className="w-6 h-6" />
              }
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen &&
        <motion.div
          initial={{
            opacity: 0,
            height: 0
          }}
          animate={{
            opacity: 1,
            height: 'auto'
          }}
          exit={{
            opacity: 0,
            height: 0
          }}
          className="md:hidden bg-white border-t border-gray-100 shadow-lg overflow-hidden">
          
            <div className="px-4 pt-2 pb-6 space-y-1">
              {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-3 text-base font-medium rounded-md transition-colors ${isActive ? 'text-primary bg-secondary/50' : 'text-gray hover:text-primary hover:bg-secondary'}`}>
                  
                    {link.name}
                  </Link>);

            })}
            </div>
          </motion.div>
        }
      </AnimatePresence>
    </nav>);

}