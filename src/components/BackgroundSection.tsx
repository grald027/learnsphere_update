import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Wifi, Cpu, Zap, Users, Globe, CheckCircle, AlertTriangle } from 'lucide-react';

export function BackgroundSection() {
  return (
    <section className="py-20 bg-white min-h-[calc(100vh-80px)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Research Background</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-dark mb-4">
            Background & Rationale
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Understanding the need for accessible, resilient educational technology in low-resource environments
          </p>
        </motion.div>

        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="prose prose-lg max-w-none mb-12"
        >
          <p className="text-gray-600 leading-relaxed text-lg">
            The rapid advancement of digital technologies has transformed education, enabling broader access to learning resources. 
            However, Hafeez et al. (2022) found that effective digital education depends on more than just access—it requires 
            structured course design, learner support, and system usability. Despite these advancements, significant challenges 
            remain in ensuring both quality and inclusivity for learners in low-connectivity environments.
          </p>
        </motion.div>

        {/* Key Statistics / Problem Statement */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
        >
          <div className="bg-red-50 rounded-2xl p-6 text-center border border-red-100">
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <div className="text-3xl font-bold text-red-600 mb-2">3.7B+</div>
            <p className="text-gray-600 text-sm">People lack internet access globally</p>
          </div>
          <div className="bg-yellow-50 rounded-2xl p-6 text-center border border-yellow-100">
            <WifiOff className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
            <div className="text-3xl font-bold text-yellow-600 mb-2">Digital Divide</div>
            <p className="text-gray-600 text-sm">Exacerbates educational inequalities worldwide</p>
          </div>
          <div className="bg-blue-50 rounded-2xl p-6 text-center border border-blue-100">
            <Cpu className="w-10 h-10 text-blue-500 mx-auto mb-3" />
            <div className="text-3xl font-bold text-blue-600 mb-2">AI + Offline</div>
            <p className="text-gray-600 text-sm">The future of inclusive education</p>
          </div>
        </motion.div>

        {/* Main Content Area */}
        <div className="space-y-12">
          
          {/* The Technological Gap */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-gray-50 rounded-2xl p-8 border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <WifiOff className="w-6 h-6 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-dark">The Persistent Digital Divide</h2>
            </div>
            
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 leading-relaxed">
                The digital divide extends beyond mere internet connectivity. According to Hafeez et al. (2022), 
                effective online learning depends on quality assurance indicators including structured course design, 
                accessibility, learner support, and system usability. Unfortunately, students in rural and low-income 
                communities often rely on limited mobile data and low-end devices, resulting in reduced engagement 
                and poorer academic outcomes.
              </p>
              <p className="text-gray-600 leading-relaxed mt-4">
                Arifudin (2025) emphasizes that while digital learning is key to the future of education, its 
                transformative potential remains largely conceptual without addressing practical barriers such as 
                poor internet connectivity and the digital divide. This highlights a systemic issue where educational 
                technologies may unintentionally reinforce existing inequalities.
              </p>
              <div className="mt-4 p-4 bg-red-50 rounded-xl border-l-4 border-red-400">
                <p className="text-red-700 text-sm font-medium">
                  <strong>Key Insight:</strong> {" "}
                  Access to online platforms alone does not guarantee meaningful learning experiences — Hafeez et al. (2022)
                </p>
              </div>
            </div>
          </motion.div>

          {/* Why Offline-First */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="bg-primary/5 rounded-2xl p-8 border border-primary/10"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-dark">Why Offline-First Architecture?</h2>
            </div>
            
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 leading-relaxed">
                Rizvi et al. (2025) investigated adaptive learning technologies and concluded that while AI enhances 
                student engagement and retention, these systems rely heavily on cloud-based infrastructure and stable 
                internet connections. This limitation makes them less effective for learners in offline or low-bandwidth 
                environments, reinforcing the need for offline-first solutions.
              </p>
              <p className="text-gray-600 leading-relaxed mt-4">
                Similarly, D. G. M. et al. (2024) found that AI-driven platforms significantly improve learning outcomes 
                through personalized feedback and adaptive content, but noted a major limitation: most AI systems require 
                continuous internet connectivity and substantial computational resources. LearnSphere addresses this gap 
                by providing offline-capable AI assistance.
              </p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 border">
                  <CheckCircle className="w-5 h-5 text-green-500 mb-2" />
                  <h4 className="font-semibold text-dark mb-1">Offline Access</h4>
                  <p className="text-sm text-gray-500">Learn anytime, anywhere without internet</p>
                </div>
                <div className="bg-white rounded-xl p-4 border">
                  <CheckCircle className="w-5 h-5 text-green-500 mb-2" />
                  <h4 className="font-semibold text-dark mb-1">Local AI Assistant</h4>
                  <p className="text-sm text-gray-500">Smart tutoring without cloud dependence</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* AI in Education */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-gray-50 rounded-2xl p-8 border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Cpu className="w-6 h-6 text-purple-500" />
              </div>
              <h2 className="text-2xl font-bold text-dark">AI-Powered Personalized Learning</h2>
            </div>
            
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 leading-relaxed">
                Polat (2024) examined the role of learner readiness, resilience, and engagement in online education success. 
                The study found that factors such as digital literacy, self-regulation, and motivation significantly influence 
                students' ability to succeed. This is particularly relevant for students in disadvantaged communities who may 
                lack necessary skills and support systems.
              </p>
              <p className="text-gray-600 leading-relaxed mt-4">
                Mariam et al. (2023) analyzed digital transformation effects on student engagement, concluding that interactive 
                and well-designed digital platforms significantly enhance learning outcomes. However, their study assumes 
                learners have access to stable internet connections—an assumption that limits its applicability to low-resource 
                environments.
              </p>
              <p className="text-gray-600 leading-relaxed mt-4">
                <strong>LearnSphere bridges these gaps</strong> by integrating lightweight, localized AI models that provide 
                personalized tutoring, immediate feedback, and interactive learning experiences without requiring constant 
                high-bandwidth cloud connections.
              </p>
            </div>
          </motion.div>

          {/* Research Gap & Our Contribution */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="bg-gradient-to-r from-primary/10 to-secondary/20 rounded-2xl p-8 border border-primary/20"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary/30 rounded-xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-dark">Addressing the Research Gap</h2>
            </div>
            
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 leading-relaxed">
                The reviewed studies demonstrate that although online education and AI technologies have potential to improve 
                learning outcomes, they often fail to address the needs of learners in low-connectivity and resource-constrained 
                settings. Common gaps identified include:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                <div className="bg-white/80 rounded-xl p-4">
                  <div className="font-semibold text-red-600 mb-1">❌ Reliance on continuous internet</div>
                  <p className="text-sm text-gray-500">Most platforms fail offline</p>
                </div>
                <div className="bg-white/80 rounded-xl p-4">
                  <div className="font-semibold text-red-600 mb-1">❌ Lack of offline functionality</div>
                  <p className="text-sm text-gray-500">No local access to materials</p>
                </div>
                <div className="bg-white/80 rounded-xl p-4">
                  <div className="font-semibold text-red-600 mb-1">❌ Limited accessibility consideration</div>
                  <p className="text-sm text-gray-500">Not designed for low-resource settings</p>
                </div>
                <div className="bg-white/80 rounded-xl p-4">
                  <div className="font-semibold text-green-600 mb-1">✅ LearnSphere's Solution</div>
                  <p className="text-sm text-gray-500">Offline-first + AI-assisted learning</p>
                </div>
              </div>
              <p className="text-gray-600 leading-relaxed">
                <strong>LearnSphere</strong> directly addresses these limitations by providing an offline-first, AI-assisted 
                learning platform designed specifically for underserved communities where connectivity is unreliable or unavailable.
              </p>
            </div>
          </motion.div>

          {/* References Section */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-gray-50 rounded-2xl p-8 border border-gray-200 mt-8"
          >
            <div className="flex items-center gap-2 mb-6">
              <BookOpen className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-bold text-dark">References</h3>
            </div>
            <div className="space-y-3 text-sm text-gray-600">
              <p>Hafeez, M., Naureen, S., & Sultan, S. (2022). Quality indicators and models for online learning quality assurance in higher education. <em>Electronic Journal of e-Learning, 20</em>(4), 374-385.</p>
              
              <p>D. G. M., Goudar, R. H., Kulkarni, A. A., Rathod, V. N., & Hukkeri, G. S. (2024). A digital recommendation system for personalized learning to enhance online education: A review. <em>IEEE Access, 12</em>, 34019-34041.</p>
              
              <p>Arifudin, O. (2025). Why digital learning is the key to the future of education. <em>International Journal of Education and Digital Learning, 3</em>(4), 201-210.</p>
              
              <p>Rizvi, I., Bose, C., & Tripathi, N. (2025). Transforming education: Adaptive learning, AI, and online platforms for personalization. In L. O. Yesufu & P. N. E. Nohuddin (Eds.), <em>Technology for societal transformation</em>. Springer.</p>
              
              <p>Polat, M. (2024). Readiness, resilience, and engagement: Analyzing the core building blocks of online education. <em>Education and Information Technologies, 29</em>, 1-28.</p>
              
              <p>Mariam, S., Khawaja, K. F., Qaisar, M. N., & Ahmad, F. (2023). Digital transformation in education and student engagement. <em>International Journal of Management Education</em>.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
