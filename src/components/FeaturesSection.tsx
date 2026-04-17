import React from 'react';
import { motion } from 'framer-motion';
import { WifiOff, Bot, Zap } from 'lucide-react';
export function FeaturesSection() {
  const features = [
  {
    icon: <WifiOff className="w-8 h-8" />,
    title: 'Offline-First Learning',
    description:
    'Access course materials, complete assignments, and track progress entirely offline. The system automatically syncs when a connection is restored.'
  },
  {
    icon: <Bot className="w-8 h-8" />,
    title: 'AI Assistant Support',
    description:
    'An integrated, lightweight AI tutor provides contextual help, answers questions, and guides students through complex topics locally.'
  },
  {
    icon: <Zap className="w-8 h-8" />,
    title: 'Low-Bandwidth Optimization',
    description:
    'Content is heavily compressed and optimized. The platform prioritizes text and essential assets to ensure fast loading on slow networks.'
  }];

  return (
    <section className="py-24 bg-secondary/20 min-h-[calc(100vh-80px)] flex flex-col justify-center">
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
            Core Features
          </h2>
          <p className="text-lg text-gray">
            Designed specifically to overcome infrastructure limitations while
            delivering a premium educational experience.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) =>
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
            whileHover={{
              y: -4
            }}
            className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-shadow duration-300 border border-gray-100">
            
              <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center text-primary mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-dark mb-3">
                {feature.title}
              </h3>
              <p className="text-gray leading-relaxed">{feature.description}</p>
            </motion.div>
          )}
        </div>
      </div>
    </section>);

}