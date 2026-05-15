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
  semester?: number;
  year?: number;
}

// Downloaded module type
interface DownloadedModule extends Module {
  downloadedAt: Date;
  filePath?: string;
  lastAccessed?: Date;
  localFile?: File;
}

// Storage key for localStorage
const STORAGE_KEY = 'learnsphere_downloaded_modules';

// Complete Computer Science Program Modules (32 Courses)
const sampleModules: Module[] = [
  // Year 1 - Semester 1
  {
    id: '1',
    title: 'Introduction to Computing',
    subject: 'Computer Science Fundamentals',
    description: 'Overview of computing concepts, history of computers, number systems, data representation, and basic computer organization.',
    lessons: 8,
    duration: '3 hours',
    difficulty: 'Beginner',
    size: '2.1 MB',
    prerequisites: ['None'],
    learningObjectives: ['Understand computer history', 'Learn number systems', 'Basic computer organization'],
    semester: 1,
    year: 1
  },
  {
    id: '2',
    title: 'Fundamentals of Programming (C++)',
    subject: 'Programming Languages',
    description: 'Learn C++ programming basics including variables, control structures, functions, arrays, and pointers.',
    lessons: 16,
    duration: '8 hours',
    difficulty: 'Beginner',
    size: '3.5 MB',
    prerequisites: ['Introduction to Computing'],
    learningObjectives: ['Write C++ programs', 'Understand pointers and memory', 'Implement functions'],
    semester: 1,
    year: 1
  },
  {
    id: '3',
    title: 'Living In the IT Era',
    subject: 'Social & Professional',
    description: 'Explores the impact of information technology on society, digital citizenship, and ethical considerations in computing.',
    lessons: 10,
    duration: '4 hours',
    difficulty: 'Beginner',
    size: '2.5 MB',
    prerequisites: ['None'],
    learningObjectives: ['Understand IT impact on society', 'Digital ethics', 'Professional responsibilities'],
    semester: 1,
    year: 1
  },

  // Year 1 - Semester 2
  {
    id: '4',
    title: 'Intermediate Programming (Python)',
    subject: 'Programming Languages',
    description: 'Python programming covering OOP concepts, file handling, exception handling, and basic libraries.',
    lessons: 14,
    duration: '7 hours',
    difficulty: 'Intermediate',
    size: '3.2 MB',
    prerequisites: ['Fundamentals of Programming (C++)'],
    learningObjectives: ['Master Python syntax', 'Implement OOP in Python', 'Use Python libraries'],
    semester: 2,
    year: 1
  },
  {
    id: '5',
    title: 'Discrete Structures 1',
    subject: 'Mathematics & Theory',
    description: 'Introduction to propositional logic, set theory, functions, relations, and basic proof techniques.',
    lessons: 12,
    duration: '6 hours',
    difficulty: 'Intermediate',
    size: '3.8 MB',
    prerequisites: ['College Algebra'],
    learningObjectives: ['Apply propositional logic', 'Work with sets and relations', 'Construct mathematical proofs'],
    semester: 2,
    year: 1
  },
  {
    id: '6',
    title: 'Multimedia Systems and Technology',
    subject: 'Media & Graphics',
    description: 'Study of multimedia elements: text, graphics, audio, video, and animation with practical applications.',
    lessons: 10,
    duration: '5 hours',
    difficulty: 'Beginner',
    size: '4.2 MB',
    prerequisites: ['Introduction to Computing'],
    learningObjectives: ['Understand multimedia formats', 'Create multimedia content', 'Learn compression techniques'],
    semester: 2,
    year: 1
  },

  // Year 2 - Semester 1
  {
    id: '7',
    title: 'Discrete Structures 2',
    subject: 'Mathematics & Theory',
    description: 'Advanced topics including graph theory, trees, combinatorics, recurrence relations, and counting principles.',
    lessons: 12,
    duration: '6 hours',
    difficulty: 'Advanced',
    size: '4.0 MB',
    prerequisites: ['Discrete Structures 1'],
    learningObjectives: ['Apply graph theory', 'Solve recurrence relations', 'Master combinatorics'],
    semester: 1,
    year: 2
  },
  {
    id: '8',
    title: 'Object-Oriented Programming',
    subject: 'Programming Languages',
    description: 'Advanced programming concepts: classes, inheritance, polymorphism, encapsulation, and design patterns.',
    lessons: 15,
    duration: '8 hours',
    difficulty: 'Intermediate',
    size: '3.9 MB',
    prerequisites: ['Intermediate Programming (Python)'],
    learningObjectives: ['Implement OOP principles', 'Apply design patterns', 'Build OOP applications'],
    semester: 1,
    year: 2
  },
  {
    id: '9',
    title: 'Data Structures and Algorithms',
    subject: 'Algorithms & Data Structures',
    description: 'Implementation and analysis of fundamental data structures: arrays, lists, stacks, queues, trees, and graphs.',
    lessons: 18,
    duration: '10 hours',
    difficulty: 'Advanced',
    size: '5.0 MB',
    prerequisites: ['Object-Oriented Programming'],
    learningObjectives: ['Implement data structures', 'Analyze algorithm complexity', 'Choose appropriate structures'],
    semester: 1,
    year: 2
  },
  {
    id: '10',
    title: 'Embedded Systems',
    subject: 'Systems & Architecture',
    description: 'Introduction to embedded systems, microcontrollers, interfacing, and real-time programming concepts.',
    lessons: 12,
    duration: '6 hours',
    difficulty: 'Advanced',
    size: '4.5 MB',
    prerequisites: ['Computer Architecture'],
    learningObjectives: ['Program microcontrollers', 'Interface with sensors', 'Real-time systems design'],
    semester: 1,
    year: 2
  },

  // Year 2 - Semester 2
  {
    id: '11',
    title: 'Algorithms and Complexity',
    subject: 'Algorithms & Data Structures',
    description: 'Advanced algorithm design techniques: divide-and-conquer, dynamic programming, greedy algorithms, and NP-completeness.',
    lessons: 16,
    duration: '9 hours',
    difficulty: 'Advanced',
    size: '5.2 MB',
    prerequisites: ['Data Structures and Algorithms'],
    learningObjectives: ['Design complex algorithms', 'Analyze computational complexity', 'Understand NP-completeness'],
    semester: 2,
    year: 2
  },
  {
    id: '12',
    title: 'Information Management',
    subject: 'Databases',
    description: 'Database design, SQL, normalization, transaction management, and NoSQL databases.',
    lessons: 14,
    duration: '7 hours',
    difficulty: 'Intermediate',
    size: '4.1 MB',
    prerequisites: ['Data Structures and Algorithms'],
    learningObjectives: ['Design databases', 'Write complex SQL queries', 'Implement transactions'],
    semester: 2,
    year: 2
  },
  {
    id: '13',
    title: 'Web Systems and Technologies 1',
    subject: 'Web Development',
    description: 'Front-end web development: HTML5, CSS3, JavaScript, responsive design, and modern frameworks.',
    lessons: 14,
    duration: '7 hours',
    difficulty: 'Intermediate',
    size: '4.8 MB',
    prerequisites: ['Object-Oriented Programming'],
    learningObjectives: ['Build responsive websites', 'Master JavaScript', 'Use front-end frameworks'],
    semester: 2,
    year: 2
  },
  {
    id: '14',
    title: 'Computational Science',
    subject: 'Scientific Computing',
    description: 'Numerical methods, scientific computing, simulation techniques, and mathematical modeling.',
    lessons: 12,
    duration: '6 hours',
    difficulty: 'Advanced',
    size: '4.3 MB',
    prerequisites: ['Discrete Structures 2'],
    learningObjectives: ['Apply numerical methods', 'Run scientific simulations', 'Mathematical modeling'],
    semester: 2,
    year: 2
  },

  // Year 3 - Semester 1
  {
    id: '15',
    title: 'Automata Theory and Formal Languages',
    subject: 'Theory of Computation',
    description: 'Finite automata, regular expressions, context-free grammars, Turing machines, and computability theory.',
    lessons: 14,
    duration: '7 hours',
    difficulty: 'Advanced',
    size: '4.5 MB',
    prerequisites: ['Discrete Structures 2'],
    learningObjectives: ['Understand automata', 'Design formal languages', 'Explore computability'],
    semester: 1,
    year: 3
  },
  {
    id: '16',
    title: 'Architecture and Organization',
    subject: 'Systems & Architecture',
    description: 'Computer organization, instruction set architecture, pipelining, memory hierarchy, and I/O systems.',
    lessons: 14,
    duration: '7 hours',
    difficulty: 'Advanced',
    size: '4.8 MB',
    prerequisites: ['Introduction to Computing'],
    learningObjectives: ['Understand CPU architecture', 'Analyze pipelining', 'Memory hierarchy design'],
    semester: 1,
    year: 3
  },
  {
    id: '17',
    title: 'Information Assurance and Security',
    subject: 'Security',
    description: 'Cybersecurity principles, cryptography, network security, risk management, and security policies.',
    lessons: 16,
    duration: '8 hours',
    difficulty: 'Advanced',
    size: '5.0 MB',
    prerequisites: ['Networking and Communications'],
    learningObjectives: ['Implement security measures', 'Apply cryptography', 'Risk assessment'],
    semester: 1,
    year: 3
  },
  {
    id: '18',
    title: 'CS Elective 1 (System Fundamentals)',
    subject: 'Electives',
    description: 'Advanced systems programming, operating system internals, and system-level development.',
    lessons: 12,
    duration: '6 hours',
    difficulty: 'Advanced',
    size: '4.2 MB',
    prerequisites: ['Operating Systems'],
    learningObjectives: ['Systems programming', 'OS internals understanding', 'Low-level development'],
    semester: 1,
    year: 3
  },

  // Year 3 - Semester 2
  {
    id: '19',
    title: 'Application Development and Emerging Technologies',
    subject: 'Software Engineering',
    description: 'Modern application development methodologies, cloud computing, IoT, and emerging tech trends.',
    lessons: 12,
    duration: '6 hours',
    difficulty: 'Advanced',
    size: '4.5 MB',
    prerequisites: ['Object-Oriented Programming'],
    learningObjectives: ['Develop modern apps', 'Explore emerging tech', 'Apply new methodologies'],
    semester: 2,
    year: 3
  },
  {
    id: '20',
    title: 'Web Systems and Technologies 2',
    subject: 'Web Development',
    description: 'Back-end web development: server-side programming, databases, APIs, and full-stack applications.',
    lessons: 14,
    duration: '7 hours',
    difficulty: 'Advanced',
    size: '5.0 MB',
    prerequisites: ['Web Systems and Technologies 1', 'Information Management'],
    learningObjectives: ['Build back-end systems', 'Create REST APIs', 'Full-stack development'],
    semester: 2,
    year: 3
  },
  {
    id: '21',
    title: 'Programming Languages',
    subject: 'Programming Languages',
    description: 'Programming language paradigms: functional, logic, and concurrent programming with language design principles.',
    lessons: 14,
    duration: '7 hours',
    difficulty: 'Advanced',
    size: '4.5 MB',
    prerequisites: ['Object-Oriented Programming'],
    learningObjectives: ['Learn language paradigms', 'Understand language design', 'Compare programming languages'],
    semester: 2,
    year: 3
  },
  {
    id: '22',
    title: 'Software Engineering 1',
    subject: 'Software Engineering',
    description: 'Software development lifecycle, requirements engineering, design patterns, and project management.',
    lessons: 14,
    duration: '7 hours',
    difficulty: 'Advanced',
    size: '4.5 MB',
    prerequisites: ['Object-Oriented Programming'],
    learningObjectives: ['Apply SDLC', 'Gather requirements', 'Use design patterns'],
    semester: 2,
    year: 3
  },

  // Year 4 - Semester 1
  {
    id: '23',
    title: 'Social Issues and Professional Practice',
    subject: 'Social & Professional',
    description: 'Ethical and social issues in computing, professional responsibilities, and legal aspects of IT.',
    lessons: 10,
    duration: '5 hours',
    difficulty: 'Intermediate',
    size: '3.0 MB',
    prerequisites: ['Living In the IT Era'],
    learningObjectives: ['Understand computing ethics', 'Professional responsibilities', 'Legal compliance'],
    semester: 1,
    year: 4
  },
  {
    id: '24',
    title: 'CS Elective 2 (Graphics and Visual Design)',
    subject: 'Electives',
    description: 'Computer graphics fundamentals, 2D/3D rendering, visual design principles, and animation.',
    lessons: 12,
    duration: '6 hours',
    difficulty: 'Advanced',
    size: '5.0 MB',
    prerequisites: ['Multimedia Systems and Technology'],
    learningObjectives: ['Implement computer graphics', 'Create 3D renders', 'Apply design principles'],
    semester: 1,
    year: 4
  },
  {
    id: '25',
    title: 'Mobile Computing',
    subject: 'Mobile Development',
    description: 'Mobile app development for iOS and Android platforms, including UI/UX and device features.',
    lessons: 14,
    duration: '7 hours',
    difficulty: 'Advanced',
    size: '4.8 MB',
    prerequisites: ['Web Systems and Technologies 1'],
    learningObjectives: ['Build mobile apps', 'Cross-platform development', 'Mobile UI/UX design'],
    semester: 1,
    year: 4
  },
  {
    id: '26',
    title: 'Modeling and Simulation',
    subject: 'Scientific Computing',
    description: 'System modeling, discrete and continuous simulation, and analysis of simulation results.',
    lessons: 12,
    duration: '6 hours',
    difficulty: 'Advanced',
    size: '4.2 MB',
    prerequisites: ['Computational Science'],
    learningObjectives: ['Create system models', 'Run simulations', 'Analyze simulation data'],
    semester: 1,
    year: 4
  },

  // Year 4 - Semester 2
  {
    id: '27',
    title: 'Data Mining Concepts and Techniques',
    subject: 'Data Science',
    description: 'Data preprocessing, classification, clustering, association rules, and pattern discovery techniques.',
    lessons: 14,
    duration: '7 hours',
    difficulty: 'Advanced',
    size: '5.0 MB',
    prerequisites: ['Information Management'],
    learningObjectives: ['Apply data mining techniques', 'Discover patterns', 'Implement classifiers'],
    semester: 2,
    year: 4
  },
  {
    id: '28',
    title: 'Machine Learning',
    subject: 'Artificial Intelligence',
    description: 'Supervised and unsupervised learning, neural networks, deep learning, and model evaluation.',
    lessons: 16,
    duration: '8 hours',
    difficulty: 'Advanced',
    size: '5.5 MB',
    prerequisites: ['Data Mining Concepts', 'Statistics'],
    learningObjectives: ['Build ML models', 'Train neural networks', 'Evaluate model performance'],
    semester: 2,
    year: 4
  },
  {
    id: '29',
    title: 'Human and Computer Interaction',
    subject: 'HCI & Design',
    description: 'User-centered design, usability testing, interface design, and user experience principles.',
    lessons: 12,
    duration: '6 hours',
    difficulty: 'Intermediate',
    size: '3.8 MB',
    prerequisites: ['Web Systems and Technologies 1'],
    learningObjectives: ['Design user interfaces', 'Conduct usability tests', 'Apply HCI principles'],
    semester: 2,
    year: 4
  },
  {
    id: '30',
    title: 'Operating Systems',
    subject: 'Systems & Architecture',
    description: 'Process management, memory management, file systems, concurrency, and OS security.',
    lessons: 15,
    duration: '8 hours',
    difficulty: 'Advanced',
    size: '4.8 MB',
    prerequisites: ['Architecture and Organization'],
    learningObjectives: ['Understand OS components', 'Manage processes', 'Implement concurrency'],
    semester: 2,
    year: 4
  },
  {
    id: '31',
    title: 'Software Engineering 2',
    subject: 'Software Engineering',
    description: 'Advanced software engineering: Agile methodologies, software testing, DevOps, and quality assurance.',
    lessons: 14,
    duration: '7 hours',
    difficulty: 'Advanced',
    size: '4.5 MB',
    prerequisites: ['Software Engineering 1'],
    learningObjectives: ['Apply Agile methods', 'Implement CI/CD', 'Software testing strategies'],
    semester: 2,
    year: 4
  },
  {
    id: '32',
    title: 'Networking and Communications',
    subject: 'Networking',
    description: 'Network protocols, OSI model, TCP/IP, routing, switching, and network security fundamentals.',
    lessons: 15,
    duration: '8 hours',
    difficulty: 'Advanced',
    size: '4.8 MB',
    prerequisites: ['Introduction to Computing'],
    learningObjectives: ['Understand network layers', 'Configure network services', 'Implement network security'],
    semester: 2,
    year: 4
  }
];

// Subjects/Categories (Organized by program areas)
const subjects = [
  'All',
  'Programming Languages',
  'Algorithms & Data Structures',
  'Computer Science Fundamentals',
  'Mathematics & Theory',
  'Theory of Computation',
  'Systems & Architecture',
  'Software Engineering',
  'Web Development',
  'Mobile Development',
  'Databases',
  'Data Science',
  'Artificial Intelligence',
  'Networking',
  'Security',
  'HCI & Design',
  'Media & Graphics',
  'Scientific Computing',
  'Social & Professional',
  'Electives'
];

// Color mapping for subjects
const getSubjectColor = (subject: string) => {
  const colorMap: Record<string, string> = {
    'Programming Languages': 'bg-blue-100 text-blue-800 border-blue-200',
    'Algorithms & Data Structures': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'Computer Science Fundamentals': 'bg-purple-100 text-purple-800 border-purple-200',
    'Mathematics & Theory': 'bg-slate-100 text-slate-800 border-slate-200',
    'Theory of Computation': 'bg-slate-100 text-slate-800 border-slate-200',
    'Systems & Architecture': 'bg-gray-100 text-gray-800 border-gray-200',
    'Software Engineering': 'bg-teal-100 text-teal-800 border-teal-200',
    'Web Development': 'bg-orange-100 text-orange-800 border-orange-200',
    'Mobile Development': 'bg-green-100 text-green-800 border-green-200',
    'Databases': 'bg-cyan-100 text-cyan-800 border-cyan-200',
    'Data Science': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'Artificial Intelligence': 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
    'Networking': 'bg-sky-100 text-sky-800 border-sky-200',
    'Security': 'bg-red-100 text-red-800 border-red-200',
    'HCI & Design': 'bg-pink-100 text-pink-800 border-pink-200',
    'Media & Graphics': 'bg-rose-100 text-rose-800 border-rose-200',
    'Scientific Computing': 'bg-blue-100 text-blue-800 border-blue-200',
    'Social & Professional': 'bg-amber-100 text-amber-800 border-amber-200',
    'Electives': 'bg-gray-100 text-gray-800 border-gray-200'
  };
  return colorMap[subject] || 'bg-gray-100 text-gray-800 border-gray-200';
};

// Helper functions for localStorage
const loadDownloadedModules = (): DownloadedModule[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
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
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray" />
          </button>
        </div>

        <div className="p-6 border-b border-gray-100">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search your modules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {subjects.slice(0, 8).map(subject => (
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

        <div className="flex-1 overflow-y-auto p-6">
          {filteredModules.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Code2 className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-dark mb-2">Your library is empty</h3>
              <p className="text-gray text-sm">Download modules from the Learning Library to see them here</p>
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
                    <button onClick={() => onRemoveModule(module.id)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="font-semibold text-dark mb-1">{module.title}</h3>
                  <p className="text-gray text-xs mb-2 line-clamp-2">{module.description}</p>
                  {module.year && module.semester && (
                    <p className="text-xs text-gray-400 mb-2">Year {module.year}, Semester {module.semester}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{module.duration}</span>
                    <span className="flex items-center gap-1"><HardDrive className="w-3 h-3" />{module.size}</span>
                    <span>Downloaded: {module.downloadedAt.toLocaleDateString()}</span>
                  </div>
                  <button onClick={() => onOpenModule(module)} className="w-full py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20">
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
    <div className={`mt-3 p-3 rounded-lg text-sm ${percentage >= 90 ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'}`}>
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
  
  useEffect(() => {
    const saved = loadDownloadedModules();
    setDownloadedModules(saved);
  }, []);

  const filteredModules = useMemo(() => {
    let modules = sampleModules;
    if (showOfflineOnly) {
      const downloadedIds = new Set(downloadedModules.map(m => m.id));
      modules = modules.filter(m => downloadedIds.has(m.id));
    }
    return modules.filter((module) => {
      const matchesSearch = module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            module.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            module.subject.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSubject = activeSubject === 'All' || module.subject === activeSubject;
      return matchesSearch && matchesSubject;
    });
  }, [searchQuery, activeSubject, downloadedModules, showOfflineOnly]);

  const handleDownload = (module: Module) => {
    setDownloadingId(module.id);
    setTimeout(() => {
      if (!downloadedModules.find(m => m.id === module.id)) {
        const downloadedModule: DownloadedModule = {
          ...module,
          downloadedAt: new Date(),
          progress: 0,
          size: module.size
        };
        const updated = [...downloadedModules, downloadedModule];
        setDownloadedModules(updated);
        saveDownloadedModules(updated);
      }
      
      const content = `# ${module.title}\n\n## Course Information\n- Subject: ${module.subject}\n- Year: ${module.year || 'N/A'}, Semester: ${module.semester || 'N/A'}\n- Difficulty: ${module.difficulty}\n- Duration: ${module.duration}\n- Lessons: ${module.lessons}\n\n## Description\n${module.description}\n\n## Prerequisites\n${module.prerequisites?.join(', ') || 'None'}\n\n## Learning Objectives\n${module.learningObjectives?.map(obj => `- ${obj}`).join('\n') || 'Not specified'}\n\n---\nThis module is part of the Computer Science program curriculum.`;
      
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
    const updated = downloadedModules.map(m => m.id === module.id ? { ...m, lastAccessed: new Date() } : m);
    setDownloadedModules(updated);
    saveDownloadedModules(updated);
    alert(`Opening "${module.title}" - This would load the offline content in production.`);
  };

  const isModuleDownloaded = (id: string) => downloadedModules.some(m => m.id === id);
  const totalStorageUsed = downloadedModules.reduce((total, mod) => total + (parseFloat(mod.size?.split(' ')[0] || '0')), 0);

  return (
    <section className="py-16 bg-secondary/10 min-h-[calc(100vh-80px)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {!navigator.onLine && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
            <CloudOff className="w-5 h-5 text-blue-600" />
            <div className="flex-1"><p className="text-blue-800 font-medium">Offline Mode Active</p><p className="text-blue-600 text-sm">Access your downloaded modules from Your Library.</p></div>
            <button onClick={() => setShowLibrary(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Go to Library</button>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="mb-12">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="flex justify-center mb-4"><div className="bg-primary/10 p-3 rounded-full"><Terminal className="w-8 h-8 text-primary" /></div></div>
            <h2 className="text-3xl md:text-4xl font-bold text-dark mb-4">Computer Science Learning Library</h2>
            <p className="text-lg text-gray">Complete CS Program curriculum with 32 courses spanning all major areas of computer science.</p>
          </div>
          <div className="max-w-2xl mx-auto">
            <div className="relative flex items-center gap-3">
              <div className="relative flex-1"><Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" placeholder="Search for courses..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-4 rounded-full border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
              <button onClick={() => setShowLibrary(true)} className="px-5 py-4 bg-white border border-gray-200 rounded-full hover:shadow-md transition-all flex items-center gap-2 text-dark hover:text-primary"><Code2 className="w-5 h-5" /><span className="hidden sm:inline">My Library</span>{downloadedModules.length > 0 && <span className="ml-1 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{downloadedModules.length}</span>}</button>
              <button onClick={() => setShowFilters(!showFilters)} className={`px-5 py-4 rounded-full transition-all flex items-center gap-2 ${showFilters || showOfflineOnly ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-dark'}`}><Filter className="w-5 h-5" /><span className="hidden sm:inline">Filters</span></button>
            </div>
          </div>
          <AnimatePresence>{showFilters && (<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="max-w-2xl mx-auto mt-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm"><div className="flex flex-wrap gap-4 items-center"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={showOfflineOnly} onChange={(e) => setShowOfflineOnly(e.target.checked)} className="w-4 h-4 text-primary rounded" /><span className="text-sm text-dark">Show only downloaded modules</span></label><div className="h-6 w-px bg-gray-200" /><div className="flex items-center gap-2 text-sm text-gray"><HardDrive className="w-4 h-4" /><span>Storage: {totalStorageUsed.toFixed(1)} MB used</span></div>{downloadedModules.length > 0 && (<button onClick={() => { if (confirm('Remove all downloaded modules?')) { setDownloadedModules([]); saveDownloadedModules([]); } }} className="text-red-500 text-sm hover:text-red-700">Clear All</button>)}</div></motion.div>)}</AnimatePresence>
        </motion.div>

        <StorageWarning usedSpace={totalStorageUsed} totalSpace={100} />

        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }} className="mb-12 overflow-x-auto pb-4">
          <div className="flex space-x-3 min-w-max">
            {subjects.map((subject) => (<button key={subject} onClick={() => setActiveSubject(subject)} className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${activeSubject === subject ? 'bg-primary text-white shadow-md' : 'bg-secondary/50 text-gray hover:bg-secondary hover:text-primary'}`}>{subject === 'All' ? 'All Courses' : subject}</button>))}
          </div>
        </motion.div>

        {filteredModules.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredModules.map((module, index) => {
              const isDownloaded = isModuleDownloaded(module.id);
              return (
                <motion.div layout key={module.id} initial={{ opacity: 0, scale: 0.9, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.4, delay: index * 0.02 }} whileHover={{ y: -4 }} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all flex flex-col h-full relative">
                  {isDownloaded && (<div className="absolute top-4 right-4"><div className="bg-green-100 text-green-700 rounded-full p-1.5"><ArrowDown className="w-3 h-3" /></div></div>)}
                  <div className="mb-4"><span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getSubjectColor(module.subject)}`}>{module.subject}</span></div>
                  <h3 className="text-xl font-bold text-dark mb-2 line-clamp-2">{module.title}</h3>
                  <p className="text-gray text-sm mb-3 flex-grow line-clamp-3">{module.description}</p>
                  {module.year && module.semester && (<p className="text-xs text-gray-400 mb-3">Year {module.year}, Semester {module.semester}</p>)}
                  <div className="grid grid-cols-3 gap-2 mb-4 pt-3 border-t border-gray-50">
                    <div className="flex flex-col items-center text-center"><BookOpen className="w-4 h-4 text-primary mb-1" /><span className="text-xs font-medium text-dark">{module.lessons}</span><span className="text-[10px] text-gray-400">Lessons</span></div>
                    <div className="flex flex-col items-center text-center border-x border-gray-100"><Clock className="w-4 h-4 text-primary mb-1" /><span className="text-xs font-medium text-dark">{module.duration}</span><span className="text-[10px] text-gray-400">Duration</span></div>
                    <div className="flex flex-col items-center text-center"><BarChart3 className="w-4 h-4 text-primary mb-1" /><span className="text-xs font-medium text-dark">{module.difficulty}</span><span className="text-[10px] text-gray-400">Level</span></div>
                  </div>
                  <button onClick={() => isDownloaded ? handleOpenModule(downloadedModules.find(m => m.id === module.id)!) : handleDownload(module)} disabled={downloadingId === module.id && !isDownloaded} className={`w-full py-3 rounded-xl font-medium text-sm flex items-center justify-center transition-all duration-300 ${isDownloaded ? 'bg-green-500 text-white hover:bg-green-600' : downloadingId === module.id ? 'bg-green-500 text-white' : 'bg-primary text-white hover:bg-accent'}`}>
                    {isDownloaded ? <><BookOpen className="w-4 h-4 mr-2" />Open Module</> : downloadingId === module.id ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Downloading...</> : <><Download className="w-4 h-4 mr-2" />Download Module</>}
                  </button>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6"><Search className="w-10 h-10 text-primary/50" /></div>
            <h3 className="text-xl font-bold text-dark mb-2">No modules found</h3>
            <p className="text-gray max-w-md mx-auto">{showOfflineOnly ? "You haven't downloaded any modules yet." : `No modules matching "${searchQuery}" in ${activeSubject}.`}</p>
            {showOfflineOnly && downloadedModules.length === 0 && <button onClick={() => setShowOfflineOnly(false)} className="mt-6 text-primary font-medium hover:underline">Show all modules</button>}
            {!showOfflineOnly && <button onClick={() => { setSearchQuery(''); setActiveSubject('All'); }} className="mt-6 text-primary font-medium hover:underline">Clear all filters</button>}
          </motion.div>
        )}
      </div>
      <AnimatePresence>{showLibrary && <YourLibrary downloadedModules={downloadedModules} onRemoveModule={handleRemoveModule} onOpenModule={handleOpenModule} isOpen={showLibrary} onClose={() => setShowLibrary(false)} />}</AnimatePresence>
    </section>
  );
}
