import React from 'react';
import { motion } from 'framer-motion';
import { Database, Cloud, Smartphone, Bot, ArrowRightLeft } from 'lucide-react';
export function PrototypeSection() {
  return (
    <section className="py-24 bg-white min-h-[calc(100vh-80px)] flex flex-col justify-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <motion.div
          initial={{
            opacity: 0,
            y: 24
          }}
          whileInView={{
            opacity: 1,
            y: 0
          }}
          viewport={{
            once: true,
            margin: '-80px'
          }}
          transition={{
            duration: 0.5,
            ease: 'easeOut'
          }}
          className="text-center max-w-3xl mx-auto mb-16">
          
          <h2 className="text-3xl md:text-4xl font-bold text-dark mb-4">
            System Architecture
          </h2>
          <p className="text-lg text-gray">
            A robust, decentralized approach ensuring continuous learning.
          </p>
        </motion.div>

        <motion.div
          initial={{
            opacity: 0,
            y: 24
          }}
          whileInView={{
            opacity: 1,
            y: 0
          }}
          viewport={{
            once: true,
            margin: '-80px'
          }}
          transition={{
            duration: 0.5,
            ease: 'easeOut',
            delay: 0.15
          }}
          className="max-w-4xl mx-auto bg-secondary/10 rounded-3xl p-8 md:p-12 border border-secondary">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center relative">
            {/* Cloud Sync */}
            <div className="flex flex-col items-center z-10">
              <div className="w-24 h-24 bg-white rounded-2xl shadow-md flex items-center justify-center text-primary mb-4 border border-gray-100">
                <Cloud className="w-10 h-10" />
              </div>
              <h4 className="font-bold text-dark text-center">Uploaded Lessons</h4>
              <p className="text-xs text-gray text-center mt-2">
                Centralized content & global progress
              </p>
            </div>

            {/* Connecting Arrows */}
            <div className="hidden md:flex justify-center items-center text-primary/50">
              <ArrowRightLeft className="w-12 h-12" />
            </div>

            {/* Local Device */}
            <div className="flex flex-col items-center bg-white p-6 rounded-3xl shadow-lg border border-primary/20 z-10 relative md:col-span-1">
              <div className="absolute -top-3 -right-3 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                Student Device
              </div>

              <div className="w-16 h-16 bg-secondary rounded-xl flex items-center justify-center text-primary mb-4">
                <Smartphone className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-dark mb-6">Student Interface</h4>

              <div className="w-full space-y-3">
                <div className="flex items-center p-3 bg-secondary/30 rounded-lg border border-secondary">
                  <Database className="w-5 h-5 text-primary mr-3" />
                  <span className="text-sm font-medium text-dark">
                    Local Storage
                  </span>
                </div>
                <div className="flex items-center p-3 bg-secondary/30 rounded-lg border border-secondary">
                  <Bot className="w-5 h-5 text-primary mr-3" />
                  <span className="text-sm font-medium text-dark">
                    Local AI Model
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile connecting arrow */}
            <div className="flex md:hidden justify-center items-center text-primary/50 py-4">
              <ArrowRightLeft className="w-8 h-8 rotate-90" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>);

}