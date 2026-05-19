import React from 'react';
import { motion } from 'framer-motion';

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
            <span className="text-sm text-primary font-medium">📚 Research Background</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-dark mb-4">
            Background of the Problem
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Addressing the need for accessible, inclusive, and resilient educational technology in low-resource environments
          </p>
        </motion.div>

        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-12"
        >
          <p className="text-gray-600 leading-relaxed text-lg">
            The rapid advancement of digital technology has significantly transformed the educational landscape through
            the development of online learning platforms that provide flexible and accessible learning opportunities
            for students worldwide. However, despite these advancements, access to quality online education remains
            unequal — particularly in developing and low-resource communities where internet connectivity, digital
            devices, and technical support are limited (Hafeez et al., 2022; Arifudin, 2025).
          </p>
          <p className="text-gray-600 leading-relaxed text-lg mt-4">
            Many existing e-learning systems are designed with the assumption that users have stable and high-speed
            internet access, making them less effective for students who rely on limited mobile data or low-end
            devices (Rizvi et al., 2025). As a result, learners from rural and economically disadvantaged areas often
            experience reduced engagement, limited participation, and unequal learning opportunities — further
            widening the digital divide in education (Polat, 2024).
          </p>
        </motion.div>

        {/* Key Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
        >
          <div className="bg-red-50 rounded-2xl p-6 text-center border border-red-100">
            <div className="text-4xl mb-2">⚠️</div>
            <div className="text-3xl font-bold text-red-600 mb-2">Digital Divide</div>
            <p className="text-gray-600 text-sm">Widens learning inequality in low-resource communities (Polat, 2024)</p>
          </div>
          <div className="bg-yellow-50 rounded-2xl p-6 text-center border border-yellow-100">
            <div className="text-4xl mb-2">📡</div>
            <div className="text-3xl font-bold text-yellow-600 mb-2">Connectivity Gap</div>
            <p className="text-gray-600 text-sm">Most AI platforms require stable internet, excluding offline learners (Rizvi et al., 2025)</p>
          </div>
          <div className="bg-blue-50 rounded-2xl p-6 text-center border border-blue-100">
            <div className="text-4xl mb-2">🤖</div>
            <div className="text-3xl font-bold text-blue-600 mb-2">Offline-First AI</div>
            <p className="text-gray-600 text-sm">LearnSphere's approach to inclusive, accessible education</p>
          </div>
        </motion.div>

        {/* Related Literature */}
        <div className="space-y-10">

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h2 className="text-2xl font-bold text-dark mb-6 flex items-center gap-3">
              <span className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-lg">📄</span>
              Related Literature and Studies
            </h2>
          </motion.div>

          {/* Hafeez et al. */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-gray-50 rounded-2xl p-8 border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-2xl">📋</div>
              <div>
                <h3 className="text-lg font-bold text-dark">Quality Assurance in Online Learning</h3>
                <p className="text-sm text-gray-400">Hafeez et al. (2022)</p>
              </div>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Hafeez et al. (2022) examined quality assurance indicators in online learning and found that effective
              digital education depends on structured course design, accessibility, learner support, and system
              usability. Their study highlights that access to online platforms alone does not guarantee meaningful
              learning experiences. However, the research primarily focuses on quality evaluation and does not
              sufficiently address the challenges faced by learners in low-connectivity environments — particularly
              the lack of offline access, which is central to the present study.
            </p>
            <div className="mt-4 p-4 bg-red-50 rounded-xl border-l-4 border-red-400">
              <p className="text-red-700 text-sm">
                <strong>Gap Identified:</strong> Does not address offline access challenges in low-connectivity environments.
              </p>
            </div>
          </motion.div>

          {/* D. G. M. et al. */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="bg-primary/5 rounded-2xl p-8 border border-primary/10"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-2xl">🤖</div>
              <div>
                <h3 className="text-lg font-bold text-dark">AI-Powered Personalized Recommendation Systems</h3>
                <p className="text-sm text-gray-400">D. G. M. et al. (2024)</p>
              </div>
            </div>
            <p className="text-gray-600 leading-relaxed">
              D. G. M. et al. (2024) explored the role of artificial intelligence in enhancing online education through
              personalized recommendation systems. Their findings indicate that AI-driven platforms can significantly
              improve learning outcomes by providing adaptive feedback, customized content, and intelligent guidance
              tailored to individual learners. Despite these advantages, the study reveals a major limitation: most
              AI systems require continuous internet connectivity and substantial computational resources, restricting
              their accessibility for students in low-resource settings.
            </p>
            <div className="mt-4 p-4 bg-yellow-50 rounded-xl border-l-4 border-yellow-400">
              <p className="text-yellow-700 text-sm">
                <strong>Gap Identified:</strong> AI benefits are inaccessible to learners without stable internet or sufficient hardware.
              </p>
            </div>
          </motion.div>

          {/* Arifudin */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-gray-50 rounded-2xl p-8 border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">🌐</div>
              <div>
                <h3 className="text-lg font-bold text-dark">Digital Learning as the Future of Education</h3>
                <p className="text-sm text-gray-400">Arifudin (2025)</p>
              </div>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Arifudin (2025) emphasized the importance of digital learning as a key driver of the future of education,
              citing its flexibility, scalability, and ability to reach diverse learners. While the study supports the
              transformative potential of digital education, it remains largely conceptual and does not address
              practical barriers such as poor internet connectivity, limited access to devices, and the digital divide.
              These limitations underscore the need for more inclusive technological solutions that consider the
              realities of underserved populations.
            </p>
            <div className="mt-4 p-4 bg-orange-50 rounded-xl border-l-4 border-orange-400">
              <p className="text-orange-700 text-sm">
                <strong>Gap Identified:</strong> Conceptual in scope; does not account for practical connectivity and device barriers.
              </p>
            </div>
          </motion.div>

          {/* Rizvi et al. */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="bg-primary/5 rounded-2xl p-8 border border-primary/10"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">⚡</div>
              <div>
                <h3 className="text-lg font-bold text-dark">Adaptive Learning Technologies and AI</h3>
                <p className="text-sm text-gray-400">Rizvi et al. (2025)</p>
              </div>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Rizvi et al. (2025) investigated the impact of adaptive learning technologies and AI on personalized
              education. Their study concluded that adaptive systems enhance student engagement, retention, and
              academic performance by providing real-time feedback and individualized learning paths. However, similar
              to other AI-based systems, these technologies rely heavily on cloud-based infrastructure and stable
              internet connections — making them less effective for learners in offline or low-bandwidth environments.
              This limitation reinforces the importance of developing systems that can function independently of
              continuous connectivity.
            </p>
            <div className="mt-4 p-4 bg-blue-50 rounded-xl border-l-4 border-blue-400">
              <p className="text-blue-700 text-sm">
                <strong>Gap Identified:</strong> Cloud dependency limits effectiveness in offline or low-bandwidth environments.
              </p>
            </div>
          </motion.div>

          {/* Polat */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-gray-50 rounded-2xl p-8 border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl">🧠</div>
              <div>
                <h3 className="text-lg font-bold text-dark">Learner Readiness, Resilience, and Engagement</h3>
                <p className="text-sm text-gray-400">Polat (2024)</p>
              </div>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Polat (2024) examined the role of learner readiness, resilience, and engagement in the success of online
              education. The study found that factors such as digital literacy, self-regulation, and motivation
              significantly influence students' ability to succeed in online learning environments. This is particularly
              relevant for students in disadvantaged communities who may lack the necessary skills and support systems.
              However, the study does not propose specific technological interventions to address these challenges,
              especially in contexts where access to online resources is limited.
            </p>
            <div className="mt-4 p-4 bg-purple-50 rounded-xl border-l-4 border-purple-400">
              <p className="text-purple-700 text-sm">
                <strong>Gap Identified:</strong> Identifies learner challenges but proposes no technological solution for offline settings.
              </p>
            </div>
          </motion.div>

          {/* Mariam et al. */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="bg-primary/5 rounded-2xl p-8 border border-primary/10"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center text-2xl">📊</div>
              <div>
                <h3 className="text-lg font-bold text-dark">Digital Transformation and Student Engagement</h3>
                <p className="text-sm text-gray-400">Mariam et al. (2023)</p>
              </div>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Mariam et al. (2023) analyzed the effects of digital transformation on student engagement and concluded
              that interactive and well-designed digital platforms can significantly enhance learning outcomes. While
              their findings support the importance of user-centered design, the study assumes that learners have
              access to stable internet connections and modern devices. This assumption limits its applicability to
              low-resource environments where such conditions are not always present.
            </p>
            <div className="mt-4 p-4 bg-pink-50 rounded-xl border-l-4 border-pink-400">
              <p className="text-pink-700 text-sm">
                <strong>Gap Identified:</strong> Assumes stable internet and modern devices; not applicable to low-resource settings.
              </p>
            </div>
          </motion.div>

          {/* Summary & LearnSphere's Contribution */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-gradient-to-r from-primary/10 to-secondary/20 rounded-2xl p-8 border border-primary/20"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary/30 rounded-xl flex items-center justify-center text-2xl">🌍</div>
              <h2 className="text-2xl font-bold text-dark">Addressing the Research Gap</h2>
            </div>
            <p className="text-gray-600 leading-relaxed mb-6">
              Overall, the reviewed studies demonstrate that although online education and AI technologies have the
              potential to improve learning outcomes, they often fail to address the needs of learners in
              low-connectivity and resource-constrained settings. Common gaps identified include:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white/80 rounded-xl p-4">
                <div className="font-semibold text-red-600 mb-1">❌ Reliance on continuous internet access</div>
                <p className="text-sm text-gray-500">Most platforms and AI tools fail without connectivity</p>
              </div>
              <div className="bg-white/80 rounded-xl p-4">
                <div className="font-semibold text-red-600 mb-1">❌ Lack of offline functionality</div>
                <p className="text-sm text-gray-500">No local access to learning materials or AI assistance</p>
              </div>
              <div className="bg-white/80 rounded-xl p-4">
                <div className="font-semibold text-red-600 mb-1">❌ Limited inclusivity consideration</div>
                <p className="text-sm text-gray-500">Platforms not designed for underserved communities</p>
              </div>
              <div className="bg-white/80 rounded-xl p-4">
                <div className="font-semibold text-green-600 mb-1">✅ LearnSphere's Solution</div>
                <p className="text-sm text-gray-500">Offline-first, AI-assisted learning for low-resource environments</p>
              </div>
            </div>
            <p className="text-gray-600 leading-relaxed">
              These limitations highlight the need for innovative solutions such as the proposed{' '}
              <strong>LearnSphere</strong> platform, which aims to provide offline-first access and AI-assisted
              learning support tailored to the needs of underserved communities.
            </p>
          </motion.div>

          {/* References */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.55 }}
            className="bg-gray-50 rounded-2xl p-8 border border-gray-200"
          >
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xl">📖</span>
              <h3 className="text-xl font-bold text-dark">References</h3>
            </div>
            <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
              <p>
                Arifudin, O. (2025). Why digital learning is the key to the future of education.{' '}
                <em>International Journal of Education and Digital Learning, 3</em>(4), 201–210.
              </p>
              <p>
                D. G. M., Goudar, R. H., Kulkarni, A. A., Rathod, V. N., & Hukkeri, G. S. (2024). A digital
                recommendation system for personalized learning to enhance online education: A review.{' '}
                <em>IEEE Access, 12</em>, 34019–34041.
              </p>
              <p>
                Hafeez, M., Naureen, S., & Sultan, S. (2022). Quality indicators and models for online learning
                quality assurance in higher education.{' '}
                <em>Electronic Journal of e-Learning, 20</em>(4), 374–385.
              </p>
              <p>
                Mariam, S., Khawaja, K. F., Qaisar, M. N., & Ahmad, F. (2023). Digital transformation in education
                and student engagement. <em>International Journal of Management Education</em>.
              </p>
              <p>
                Polat, M. (2024). Readiness, resilience, and engagement: Analyzing the core building blocks of online
                education. <em>Education and Information Technologies, 29</em>, 1–28.
              </p>
              <p>
                Rizvi, I., Bose, C., & Tripathi, N. (2025). Transforming education: Adaptive learning, AI, and online
                platforms for personalization. In L. O. Yesufu & P. N. E. Nohuddin (Eds.),{' '}
                <em>Technology for societal transformation</em>. Springer.
              </p>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
