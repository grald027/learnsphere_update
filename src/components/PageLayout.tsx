import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
interface PageLayoutProps {
  children: React.ReactNode;
}
export function PageLayout({ children }: PageLayoutProps) {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <motion.main
        key={location.pathname}
        initial={{
          opacity: 0
        }}
        animate={{
          opacity: 1
        }}
        exit={{
          opacity: 0
        }}
        transition={{
          duration: 0.3
        }}
        className="flex-grow pt-20" // Add padding top to account for fixed navbar
      >
        {children}
      </motion.main>
      <Footer />
    </div>);

}