import React from 'react';
import { motion } from 'framer-motion';
export function BackgroundSection() {
  const cards = [
  {
    title: 'The Technological Gap',
    content:
    'Despite the rapid growth of online education, millions of students globally lack reliable internet access. This digital divide exacerbates educational inequalities, leaving vulnerable populations behind in an increasingly digital world.'
  },
  {
    title: 'Why Offline-First?',
    content:
    'An offline-first architecture ensures that learning materials, progress tracking, and core functionalities remain accessible regardless of connectivity. By syncing data only when a connection is available, we create a resilient learning environment.'
  },
  {
    title: 'AI in Education',
    content:
    'Integrating lightweight, localized AI models provides students with personalized tutoring, immediate feedback, and interactive learning experiences without requiring constant high-bandwidth cloud connections.'
  }];

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
            Background & Rationale
          </h2>
          <p className="text-lg text-gray">
            Understanding the need for accessible, resilient educational
            technology in low-resource environments.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cards.map((card, index) =>
          <motion.div
            key={index}
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
              delay: index * 0.15
            }}
            className="bg-secondary/30 rounded-2xl p-8 border border-secondary hover:border-primary/30 transition-colors">
            
              <h3 className="text-xl font-semibold text-dark mb-4">
                {card.title}
              </h3>
              <p className="text-gray leading-relaxed">{card.content}</p>
            </motion.div>
          )}
        </div>
      </div>
    </section>);

}