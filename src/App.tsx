import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { PageLayout } from './components/PageLayout';
import { HeroSection } from './components/HeroSection';
import { BackgroundSection } from './components/BackgroundSection';
import { FeaturesSection } from './components/FeaturesSection';
import { AIChatSection } from './components/AIChatSection';
import { LearningSection } from './components/LearningSection';
export function App() {
  return (
    <BrowserRouter>
      <div className="bg-white font-sans text-gray selection:bg-primary/20 selection:text-primary">
        <PageLayout>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<HeroSection />} />
              <Route path="/background" element={<BackgroundSection />} />
              <Route path="/features" element={<FeaturesSection />} />
              <Route path="/learning" element={<LearningSection />} />
              <Route path="/ai-assistant" element={<AIChatSection />} />
            </Routes>
          </AnimatePresence>
        </PageLayout>
      </div>
    </BrowserRouter>);

}
