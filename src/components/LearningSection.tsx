import React, { useMemo, useState, createElement, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Download,
  BookOpen,
  Clock,
  BarChart3,
  CheckCircle2,
  Library,
  Trash2,
  ArrowDown,
  HardDrive,
  CloudOff,
  Sparkles,
  RefreshCw,
  Filter,
  X,
  Terminal,
  Database,
  Shield,
  Cloud,
  Cpu,
  Code2,
  GitBranch,
  Brain
} from 'lucide-react';

// Define module data type
interface Module {
  id: string;
  title: string;
  subject: string;
  description: string;
  lessons: number;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  size?: string;
  lastOpened?: Date;
  progress?: number;
  prerequisites?: string[];
  learningObjectives?: string[];
}

// Downloaded module type (extends Module with additional metadata)
interface DownloadedModule extends Module {
  downloadedAt: Date;
  filePath?: string;
  lastAccessed?: Date;
  localFile?: File;
}

// Storage key for localStorage
const STORAGE_KEY = 'learnsphere_downloaded_modules';

// Computer Science Modules Data
const sampleModules: Module[] = [
  {
    id: '1',
    title: 'Python Programming Fundamentals',
    subject: 'Programming Languages',
    description: 'Master Python basics including variables, loops, functions, and data structures. Perfect for beginners starting their coding journey.',
    lessons: 14,
    duration: '6 hours',
    difficulty: 'Beginner',
    size: '3.2 MB',
    prerequisites: ['Basic computer literacy'],
    learningObjectives: ['Write Python scripts', 'Understand control flow', 'Create functions']
  },
  {
    id: '2',
    title: 'Data Structures & Algorithms',
    subject: 'Computer Science Fundamentals',
    description: 'Learn essential data structures (arrays, linked lists, trees, graphs) and algorithms for efficient programming and technical interviews.',
    lessons: 20,
    duration: '10 hours',
    difficulty: 'Intermediate',
    size: '4.5 MB',
    prerequisites: ['Basic programming knowledge'],
    learningObjectives: ['Implement common data structures', 'Analyze algorithm complexity', 'Solve coding challenges']
  },
  {
    id: '3',
    title: 'Web Development with React',
    subject: 'Web Development',
    description: 'Build modern, responsive web applications using React.js, hooks, state management, and component-based architecture.',
    lessons: 16,
    duration: '8 hours',
    difficulty: 'Intermediate',
    size: '5.1 MB',
    prerequisites: ['HTML, CSS, JavaScript basics'],
    learningObjectives: ['Build React components', 'Manage state effectively', 'Create responsive UIs']
  },
  {
    id: '4',
    title: 'Database Management Systems',
    subject: 'Databases',
    description: 'Learn SQL, database design, normalization, and management of relational and NoSQL databases for modern applications.',
    lessons: 12,
    duration: '5 hours',
    difficulty: 'Intermediate',
    size: '3.8 MB',
    prerequisites: ['Basic programming'],
    learningObjectives: ['Write complex SQL queries', 'Design database schemas', 'Optimize query performance']
  },
  {
    id: '5',
    title: 'Cybersecurity Essentials',
    subject: 'Security',
    description: 'Understand core security concepts, encryption, network security, threat modeling, and best practices for secure development.',
    lessons: 15,
    duration: '7 hours',
    difficulty: 'Intermediate',
    size: '4.2 MB',
    prerequisites: ['Networking basics'],
    learningObjectives: ['Identify security threats', 'Implement encryption', 'Follow security best practices']
  },
  {
    id: '6',
    title: 'Cloud Computing & AWS',
    subject: 'Cloud Computing',
    description: 'Introduction to cloud services, AWS fundamentals, deployment strategies, and scalable infrastructure management.',
    lessons: 13,
    duration: '6 hours',
    difficulty: 'Intermediate',
    size: '4.0 MB',
    prerequisites: ['System administration basics'],
    learningObjectives: ['Deploy cloud applications', 'Manage AWS services', 'Understand cloud architecture']
  },
  {
    id: '7',
    title: 'Machine Learning Basics',
    subject: 'Artificial Intelligence',
    description: 'Introduction to ML concepts, supervised/unsupervised learning, neural networks, and practical implementations with Python.',
    lessons: 18,
    duration: '9 hours',
    difficulty: 'Advanced',
    size: '6.5 MB',
    prerequisites: ['Python, Statistics'],
    learningObjectives: ['Build ML models', 'Understand neural networks', 'Evaluate model performance']
  },
  {
    id: '8',
    title: 'Mobile App Development (Flutter)',
    subject: 'Mobile Development',
    description: 'Create cross-platform mobile apps using Flutter and Dart, including UI design, state management, and native features.',
    lessons: 14,
    duration: '7 hours',
    difficulty: 'Intermediate',
    size: '4.8 MB',
    prerequisites: ['Object-oriented programming'],
    learningObjectives: ['Build Flutter apps', 'Create responsive UIs', 'Integrate device features']
  },
  {
    id: '9',
    title: 'Git & Version Control',
    subject: 'DevOps & Tools',
    description: 'Master Git commands, branching strategies, collaboration workflows, and best practices for version control.',
    lessons: 10,
    duration: '4 hours',
    difficulty: 'Beginner',
    size: '2.5 MB',
    prerequisites: ['Command line basics'],
    learningObjectives: ['Use Git commands', 'Manage branches', 'Collaborate with teams']
  },
  {
    id: '10',
    title: 'Computer Networks',
    subject: 'Computer Science Fundamentals',
    description: 'Learn network protocols, OSI model, TCP/IP, routing, switching, and network security fundamentals.',
    lessons: 16,
    duration: '7 hours',
    difficulty: 'Intermediate',
    size: '4.3 MB',
    prerequisites: ['Basic computer knowledge'],
    learningObjectives: ['Understand network layers', 'Configure network services', 'Troubleshoot connectivity']
  },
  {
    id: '11',
    title: 'Operating Systems',
    subject: 'Computer Science Fundamentals',
    description: 'Explore process management, memory management, file systems, and concurrency in modern operating systems.',
    lessons: 15,
    duration: '8 hours',
    difficulty: 'Advanced',
    size: '5.0 MB',
    prerequisites: ['C programming'],
    learningObjectives: ['Understand OS concepts', 'Manage processes', 'Implement synchronization']
  },
  {
    id: '12',
    title: 'DevOps Fundamentals',
    subject: 'DevOps & Tools',
    description: 'Learn CI/CD pipelines, Docker containers, Kubernetes orchestration, and infrastructure as code.',
    lessons: 14,
    duration: '7 hours',
    difficulty: 'Advanced',
    size: '5.5 MB',
    prerequisites: ['Linux basics, Git'],
    learningObjectives: ['Build CI/CD pipelines', 'Containerize applications', 'Deploy with Kubernetes']
  },
  {
    id: '13',
    title: 'JavaScript & TypeScript',
    subject: 'Programming Languages',
    description: 'Master modern JavaScript (ES6+) and TypeScript for building robust, type-safe web applications.',
    lessons: 15,
    duration: '7 hours',
    difficulty: 'Intermediate',
    size: '4.1 MB',
    prerequisites: ['HTML/CSS basics'],
    learningObjectives: ['Write modern JavaScript', 'Use TypeScript types', 'Build web applications']
  },
  {
    id: '14',
    title: 'System Design & Architecture',
    subject: 'Software Engineering',
    description: 'Learn to design scalable, maintainable systems using design patterns, microservices, and architectural principles.',
    lessons: 12,
    duration: '8 hours',
    difficulty: 'Advanced',
    size: '5.8 MB',
    prerequisites: ['Software development experience'],
    learningObjectives: ['Apply design patterns', 'Design microservices', 'Scale applications']
  },
  {
    id: '15',
    title: 'Blockchain Fundamentals',
    subject: 'Emerging Technologies',
    description: 'Understand blockchain technology, smart contracts, cryptocurrencies, and decentralized applications (dApps).',
    lessons: 12,
    duration: '6 hours',
    difficulty: 'Intermediate',
    size: '4.5 MB',
    prerequisites: ['Basic programming'],
    learningObjectives: ['Understand blockchain concepts', 'Write smart contracts', 'Build dApps']
  }
];

// Computer Science Subjects/Categories
const subjects = [
  'All',
  'Programming Languages',
  'Computer Science Fundamentals',
  'Web Development',
  'Mobile Development',
  'Databases',
  'Security',
  'Cloud Computing',
  'Artificial Intelligence',
  'DevOps & Tools',
  'Software Engineering',
  'Emerging Technologies'
];

// Color mapping for CS subjects
const getSubjectColor = (subject: string) => {
  const colorMap: Record<string, string> = {
    'Programming Languages': 'bg-blue-100 text-blue-800 border-blue-200',
    'Computer Science Fundamentals': 'bg-purple-100 text-purple-800 border-purple-200',
    'Web Development': 'bg-orange-100 text-orange-800 border-orange-200',
    'Mobile Development': 'bg-green-100 text-green-800 border-green-200',
    'Databases': 'bg-cyan-100 text-cyan-800 border-cyan-200',
    'Security': 'bg-red-100 text-red-800 border-red-200',
    'Cloud Computing': 'bg-sky-100 text-sky-800 border-sky-200',
    'Artificial Intelligence': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'DevOps & Tools': 'bg-amber-100 text-amber-800 border-amber-200',
    'Software Engineering': 'bg-teal-100 text-teal-800 border-teal-200',
    'Emerging Technologies': 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200'
  };
  return colorMap[subject] || 'bg-gray-100 text-gray-800 border-gray-200';
};

// Helper functions for localStorage
const loadDownloadedModules = (): DownloadedModule[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Convert date strings back to Date objects
      return parsed.map((mod: any) => ({
        ...mod,
        downloadedAt: new Date(mod.downloadedAt),
        lastAccessed: mod.lastAccessed ? new Date(mod.lastAccessed) : undefined
      }));
    } catch (e) {
      console.error('Error loading downloaded modules:', e);
      return [];
    }
  }
  return [];
};

const saveDownloadedModules = (modules: DownloadedModule[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(modules));
};

// YourLibrary Component
interface YourLibraryProps {
  downloadedModules: DownloadedModule[];
  onRemoveModule: (id: string) => void;
  onOpenModule: (module: DownloadedModule) => void;
  isOpen: boolean;
  onClose: () => void;
}

function YourLibrary({ downloadedModules, onRemoveModule, onOpenModule, isOpen, onClose }: YourLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');

  const filteredModules = downloadedModules.filter(module => {
    const matchesSearch = module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          module.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'All' || module.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const totalStorage = downloadedModules.reduce((total, mod) => {
    const size = parseFloat(mod.size?.split(' ')[0] || '0');
    return total + size;
  }, 0);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold text-dark flex items-center gap-2">
              <Library className="w-6 h-6 text-primary" />
              Your Library
            </h2>
            <p className="text-gray text-sm mt-1">
              {downloadedModules.length} modules downloaded • {totalStorage.toFixed(1)} MB total
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray" />
          </button>
        </div>

        {/* Search and Filter */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search your CS modules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {subjects.map(subject => (
                <button
                  key={subject}
                  onClick={() => setSelectedSubject(subject)}
                  className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
                    selectedSubject === subject
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray hover:bg-gray-200'
                  }`}
                >
                  {subject}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Library Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredModules.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Code2 className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-dark mb-2">Your library is empty</h3>
              <p className="text-gray text-sm">
                Download modules from the Learning Library to see them here
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredModules.map((module) => (
                <motion.div
                  key={module.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getSubjectColor(module.subject)}`}>
                      {module.subject}
                    </span>
                    <button
                      onClick={() => onRemoveModule(module.id)}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="font-semibold text-dark mb-1">{module.title}</h3>
                  <p className="text-gray text-xs mb-3 line-clamp-2">{module.description}</p>
                  
                  {/* Prerequisites if available */}
                  {module.prerequisites && module.prerequisites.length > 0 && (
                    <div className="mb-2">
                      <span className="text-xs text-gray-500">Prerequisites: </span>
                      <span className="text-xs text-gray-600">
                        {module.prerequisites.join(', ')}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {module.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3" />
                      {module.size}
                    </span>
                    <span>
                      Downloaded: {module.downloadedAt.toLocaleDateString()}
                    </span>
                  </div>
                  
                  {module.progress !== undefined && module.progress > 0 && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Progress</span>
                        <span>{module.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-primary rounded-full h-1.5 transition-all"
                          style={{ width: `${module.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={() => onOpenModule(module)}
                    className="w-full py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"
                  >
                    <Terminal className="w-3 h-3 inline mr-1" />
                    Open Module
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Storage Warning Component
function StorageWarning({ usedSpace, totalSpace = 100 }: { usedSpace: number; totalSpace?: number }) {
  const percentage = (usedSpace / totalSpace) * 100;
  
  if (percentage < 70) return null;
  
  return (
    <div className={`mt-3 p-3 rounded-lg text-sm ${
      percentage >= 90 ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
    }`}>
      <div className="flex items-center gap-2">
        <HardDrive className="w-4 h-4" />
        <span className="font-medium">Storage Alert:</span>
        <span>You've used {usedSpace.toFixed(1)} MB of {totalSpace} MB. Consider removing some modules.</span>
      </div>
    </div>
  );
}

// Main Component
export function LearningSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubject, setActiveSubject] = useState('All');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadedModules, setDownloadedModules] = useState<DownloadedModule[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showOfflineOnly, setShowOfflineOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Load downloaded modules from localStorage on mount
  useEffect(() => {
    const saved = loadDownloadedModules();
    setDownloadedModules(saved);
  }, []);

  // Filter modules based on search, subject, and offline availability
  const filteredModules = useMemo(() => {
    let modules = sampleModules;
    
    // If offline-only filter is active, only show downloaded modules
    if (showOfflineOnly) {
      const downloadedIds = new Set(downloadedModules.map(m => m.id));
      modules = modules.filter(m => downloadedIds.has(m.id));
    }
    
    return modules.filter((module) => {
      const matchesSearch =
        module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        module.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        module.subject.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSubject =
        activeSubject === 'All' || module.subject === activeSubject;
      return matchesSearch && matchesSubject;
    });
  }, [searchQuery, activeSubject, downloadedModules, showOfflineOnly]);

  const handleDownload = (module: Module) => {
    setDownloadingId(module.id);
    
    // Simulate download delay
    setTimeout(() => {
      // Create downloaded module object
      const downloadedModule: DownloadedModule = {
        ...module,
        downloadedAt: new Date(),
        progress: 0,
        size: module.size || `${(Math.random() * 3 + 1).toFixed(1)} MB`
      };
      
      // Check if already downloaded
      if (!downloadedModules.find(m => m.id === module.id)) {
        const updated = [...downloadedModules, downloadedModule];
        setDownloadedModules(updated);
        saveDownloadedModules(updated);
        
        console.log(`Downloaded: ${module.title}`);
      }
      
      // Simulate file download for offline access
      const content = `# ${module.title}\n\n## Description\n${module.description}\n\n## Subject: ${module.subject}\n## Difficulty: ${module.difficulty}\n## Duration: ${module.duration}\n## Lessons: ${module.lessons}\n\n## Prerequisites\n${module.prerequisites?.join(', ') || 'None'}\n\n## Learning Objectives\n${module.learningObjectives?.map(obj => `- ${obj}`).join('\n') || 'Not specified'}\n\n---\n\nThis is a sample offline module for ${module.title}. In a production environment, this would contain the full course content (videos, interactive exercises, quizzes, coding challenges, and text) optimized and compressed for offline use.`;
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${module.title.toLowerCase().replace(/\s+/g, '-')}-module.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setDownloadingId(null);
    }, 1500);
  };

  const handleRemoveModule = (id: string) => {
    const updated = downloadedModules.filter(m => m.id !== id);
    setDownloadedModules(updated);
    saveDownloadedModules(updated);
  };

  const handleOpenModule = (module: DownloadedModule) => {
    // Update last accessed time
    const updated = downloadedModules.map(m => 
      m.id === module.id 
        ? { ...m, lastAccessed: new Date() }
        : m
    );
    setDownloadedModules(updated);
    saveDownloadedModules(updated);
    
    console.log(`Opening module: ${module.title}`);
    alert(`Opening "${module.title}" - This would load the offline content in production.`);
  };

  const isModuleDownloaded = (id: string) => {
    return downloadedModules.some(m => m.id === id);
  };

  const totalStorageUsed = downloadedModules.reduce((total, mod) => {
    const size = parseFloat(mod.size?.split(' ')[0] || '0');
    return total + size;
  }, 0);

  return (
    <section className="py-16 bg-secondary/10 min-h-[calc(100vh-80px)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Offline Mode Banner */}
        {!navigator.onLine && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3"
          >
            <CloudOff className="w-5 h-5 text-blue-600" />
            <div className="flex-1">
              <p className="text-blue-800 font-medium">Offline Mode Active</p>
              <p className="text-blue-600 text-sm">You're currently offline. Access your downloaded modules from Your Library.</p>
            </div>
            <button
              onClick={() => setShowLibrary(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Go to Library
            </button>
          </motion.div>
        )}

        {/* Header & Search */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mb-12"
        >
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="flex justify-center mb-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Terminal className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-dark mb-4">
              Learning Library
            </h2>
            <p className="text-lg text-gray">
              Browse and download modules for offline access. From programming basics to advanced topics, learn anytime, anywhere.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="relative flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for programming languages, frameworks, topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-full border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-dark placeholder-gray-400"
                />
              </div>
              
              {/* Your Library Button */}
              <button
                onClick={() => setShowLibrary(true)}
                className="px-5 py-4 bg-white border border-gray-200 rounded-full hover:shadow-md transition-all flex items-center gap-2 text-dark hover:text-primary"
              >
                <Code2 className="w-5 h-5" />
                <span className="hidden sm:inline">My Library</span>
                {downloadedModules.length > 0 && (
                  <span className="ml-1 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {downloadedModules.length}
                  </span>
                )}
              </button>

              {/* Filter Toggle Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-5 py-4 rounded-full transition-all flex items-center gap-2 ${
                  showFilters || showOfflineOnly
                    ? 'bg-primary text-white'
                    : 'bg-white border border-gray-200 text-dark hover:bg-gray-50'
                }`}
              >
                <Filter className="w-5 h-5" />
                <span className="hidden sm:inline">Filters</span>
              </button>
            </div>
          </div>

          {/* Expanded Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="max-w-2xl mx-auto mt-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm"
              >
                <div className="flex flex-wrap gap-4 items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showOfflineOnly}
                      onChange={(e) => setShowOfflineOnly(e.target.checked)}
                      className="w-4 h-4 text-primary rounded focus:ring-primary"
                    />
                    <span className="text-sm text-dark">Show only downloaded modules</span>
                  </label>
                  
                  <div className="h-6 w-px bg-gray-200" />
                  
                  <div className="flex items-center gap-2 text-sm text-gray">
                    <HardDrive className="w-4 h-4" />
                    <span>Storage: {totalStorageUsed.toFixed(1)} MB used</span>
                  </div>
                  
                  {downloadedModules.length > 0 && (
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to remove all downloaded modules? This action cannot be undone.')) {
                          setDownloadedModules([]);
                          saveDownloadedModules([]);
                        }
                      }}
                      className="text-red-500 text-sm hover:text-red-700"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Storage Warning */}
        <StorageWarning usedSpace={totalStorageUsed} totalSpace={100} />

        {/* Subject Filters */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
          className="mb-12 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar"
        >
          <div className="flex space-x-3 sm:justify-center min-w-max">
            {subjects.map((subject) => (
              <button
                key={subject}
                onClick={() => setActiveSubject(subject)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  activeSubject === subject
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-secondary/50 text-gray hover:bg-secondary hover:text-primary'
                }`}
              >
                {subject === 'All' ? 'All Topics' : subject}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Module Grid */}
        {filteredModules.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredModules.map((module, index) => {
                const isDownloaded = isModuleDownloaded(module.id);
                return (
                  <motion.div
                    layout
                    key={module.id}
                    initial={{ opacity: 0, scale: 0.9, y: 24 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.4, ease: 'easeOut', delay: index * 0.05 }}
                    whileHover={{ y: -4 }}
                    className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-shadow duration-300 flex flex-col h-full relative"
                  >
                    {/* Downloaded Badge */}
                    {isDownloaded && (
                      <div className="absolute top-4 right-4">
                        <div className="bg-green-100 text-green-700 rounded-full p-1.5" title="Downloaded for offline use">
                          <ArrowDown className="w-3 h-3" />
                        </div>
                      </div>
                    )}

                    <div className="mb-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getSubjectColor(module.subject)}`}
                      >
                        {module.subject}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-dark mb-2 line-clamp-2">
                      {module.title}
                    </h3>
                    <p className="text-gray text-sm mb-4 flex-grow line-clamp-3">
                      {module.description}
                    </p>

                    {/* Prerequisites Chip */}
                    {module.prerequisites && module.prerequisites.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                          <GitBranch className="w-3 h-3" />
                          <span>Prerequisites:</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {module.prerequisites.map((pre, idx) => (
                            <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                              {pre}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2 mb-6 pt-4 border-t border-gray-50">
                      <div className="flex flex-col items-center text-center">
                        <BookOpen className="w-4 h-4 text-primary mb-1" />
                        <span className="text-xs font-medium text-dark">
                          {module.lessons}
                        </span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                          Lessons
                        </span>
                      </div>
                      <div className="flex flex-col items-center text-center border-x border-gray-100">
                        <Clock className="w-4 h-4 text-primary mb-1" />
                        <span className="text-xs font-medium text-dark">
                          {module.duration}
                        </span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                          Time
                        </span>
                      </div>
                      <div className="flex flex-col items-center text-center">
                        <BarChart3 className="w-4 h-4 text-primary mb-1" />
                        <span className="text-xs font-medium text-dark">
                          {module.difficulty}
                        </span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                          Level
                        </span>
                      </div>
                    </div>

                    {module.size && (
                      <div className="mb-4 text-xs text-gray-400 flex items-center justify-center gap-1">
                        <HardDrive className="w-3 h-3" />
                        <span>{module.size}</span>
                      </div>
                    )}

                    <button
                      onClick={() => isDownloaded ? handleOpenModule(downloadedModules.find(m => m.id === module.id)!) : handleDownload(module)}
                      disabled={downloadingId === module.id && !isDownloaded}
                      className={`w-full py-3 rounded-xl font-medium text-sm flex items-center justify-center transition-all duration-300 ${
                        isDownloaded
                          ? 'bg-green-500 text-white shadow-md hover:bg-green-600'
                          : downloadingId === module.id
                          ? 'bg-green-500 text-white shadow-md'
                          : 'bg-primary text-white hover:bg-accent shadow-sm hover:shadow-md'
                      }`}
                    >
                      {isDownloaded ? (
                        <>
                          <BookOpen className="w-4 h-4 mr-2" />
                          Open Module
                        </>
                      ) : downloadingId === module.id ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Download Module
                        </>
                      )}
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6 text-primary/50">
              <Search className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-dark mb-2">
              No modules found
            </h3>
            <p className="text-gray max-w-md mx-auto">
              {showOfflineOnly 
                ? "You haven't downloaded any CS modules yet. Download some modules to access them offline."
                : `We couldn't find any modules matching "${searchQuery}" in the ${activeSubject} category. Try adjusting your search or filters.`
              }
            </p>
            {showOfflineOnly && downloadedModules.length === 0 && (
              <button
                onClick={() => setShowOfflineOnly(false)}
                className="mt-6 text-primary font-medium hover:underline"
              >
                Show all modules
              </button>
            )}
            {!showOfflineOnly && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveSubject('All');
                }}
                className="mt-6 text-primary font-medium hover:underline"
              >
                Clear all filters
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* Your Library Modal */}
      <AnimatePresence>
        {showLibrary && (
          <YourLibrary
            downloadedModules={downloadedModules}
            onRemoveModule={handleRemoveModule}
            onOpenModule={handleOpenModule}
            isOpen={showLibrary}
            onClose={() => setShowLibrary(false)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}