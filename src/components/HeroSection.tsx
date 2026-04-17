import React, { Children } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Globe2, BookOpen, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';
export function HeroSection() {
  const containerVariants = {
    hidden: {
      opacity: 0
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };
  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 24
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut'
      }
    }
  };
  return (
    <section className="relative min-h-[calc(100vh-80px)] flex items-center justify-center overflow-hidden bg-gradient-to-b from-secondary/50 to-white py-20">
      {/* Background decorative elements */}
      <div className="absolute top-1/4 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-accent/5 rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <motion.div
          className="text-center max-w-4xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{
            once: true,
            margin: '-80px'
          }}>
          
          <motion.div
            variants={itemVariants}
            className="mb-6 flex justify-center">
            
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-secondary text-primary text-sm font-semibold tracking-wide">
              <Globe2 className="w-4 h-4 mr-2" />
              Enhancing Access to Quality Online Education
            </span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-4xl md:text-6xl font-bold text-dark tracking-tight mb-6 leading-tight">
            
            An Offline-First <br className="hidden md:block" />
            <span className="text-primary">AI-Assisted</span> Learning Platform
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-lg md:text-xl text-gray mb-10 max-w-2xl mx-auto leading-relaxed">
            
            Bridging the digital divide with a resilient, low-bandwidth
            optimized educational environment. Learn anywhere, anytime—even
            without a reliable internet connection.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4">
            
            <Link
              to="/learning"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 border border-transparent text-base font-medium rounded-full text-white bg-primary hover:bg-accent transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
              
              Get Started
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              to="/background"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 border-2 border-secondary text-base font-medium rounded-full text-dark bg-white hover:bg-secondary/50 transition-colors">
              
              Read the Study
            </Link>
          </motion.div>

          {/* Feature Highlights */}
          <motion.div
            variants={itemVariants}
            className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto border-t border-gray-100 pt-10">
            
            <div className="flex flex-col items-center text-center">
              <div className="bg-secondary p-3 rounded-full mb-3 text-primary">
                <Globe2 className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-dark">Offline-First</h3>
              <p className="text-sm text-gray mt-1">Works without internet</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-secondary p-3 rounded-full mb-3 text-primary">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-dark">AI Assistant</h3>
              <p className="text-sm text-gray mt-1">Smart local tutoring</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-secondary p-3 rounded-full mb-3 text-primary">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-dark">Accessible</h3>
              <p className="text-sm text-gray mt-1">Low-bandwidth optimized</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>);

}