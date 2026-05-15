import React, { useMemo, useState, useEffect } from 'react';
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
  Code2,
  GitBranch,
  FolderOpen,
  FileText,
  AlertCircle,
  File,
  Video,
  FileImage,
  FileCode,
  FileQuestion,
  ChevronDown,
  ChevronUp,
  Globe
} from 'lucide-react';

// Define file type
interface CourseFile {
  id: string;
  name: string;
  type: 'pdf' | 'video' | 'pptx' | 'docx' | 'code' | 'image' | 'quiz' | 'other';
  size: string;
  url: string;
  description?: string;
}

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
  files?: CourseFile[];
}

// Downloaded module type
interface DownloadedModule extends Module {
  downloadedAt: Date;
  lastAccessed?: Date;
  downloadedFiles?: string[];
}

// Storage keys
const STORAGE_KEY = 'learnsphere_downloaded_modules';
const DOWNLOADED_FILES_KEY = 'learnsphere_downloaded_files';

// Course files database - For each course, list available files
const courseFilesDatabase: { [key: string]: CourseFile[] } = {
  'CS101': [
    { id: 'CS101-1', name: 'Course Syllabus', type: 'pdf', size: '0.5 MB', url: '/modules/CS101/syllabus.pdf', description: 'Course overview and requirements' },
    { id: 'CS101-2', name: 'Chapter 1: Introduction to Computers', type: 'pdf', size: '2.1 MB', url: '/modules/CS101/chapter1.pdf', description: 'History and evolution of computers' },
    { id: 'CS101-3', name: 'Chapter 2: Number Systems', type: 'pdf', size: '1.8 MB', url: '/modules/CS101/chapter2.pdf', description: 'Binary, octal, hexadecimal systems' },
    { id: 'CS101-4', name: 'Lecture Video - Week 1', type: 'video', size: '45 MB', url: '/modules/CS101/video1.mp4', description: 'Introduction to Computing concepts' },
    { id: 'CS101-5', name: 'Practice Exercises', type: 'code', size: '0.3 MB', url: '/modules/CS101/exercises.zip', description: 'Hands-on practice problems' },
    { id: 'CS101-6', name: 'Quiz 1 - Number Systems', type: 'quiz', size: '0.2 MB', url: '/modules/CS101/quiz1.pdf', description: 'Test your understanding' }
  ],
  'CS102': [
    { id: 'CS102-1', name: 'C++ Programming Syllabus', type: 'pdf', size: '0.6 MB', url: '/modules/CS102/syllabus.pdf' },
    { id: 'CS102-2', name: 'Chapter 1: Variables and Data Types', type: 'pdf', size: '2.5 MB', url: '/modules/CS102/chapter1.pdf' },
    { id: 'CS102-3', name: 'Chapter 2: Control Structures', type: 'pdf', size: '2.8 MB', url: '/modules/CS102/chapter2.pdf' },
    { id: 'CS102-4', name: 'Chapter 3: Functions', type: 'pdf', size: '2.2 MB', url: '/modules/CS102/chapter3.pdf' },
    { id: 'CS102-5', name: 'Chapter 4: Arrays and Pointers', type: 'pdf', size: '3.1 MB', url: '/modules/CS102/chapter4.pdf' },
    { id: 'CS102-6', name: 'Code Examples', type: 'code', size: '1.2 MB', url: '/modules/CS102/examples.zip' },
    { id: 'CS102-7', name: 'Programming Exercises', type: 'code', size: '0.8 MB', url: '/modules/CS102/exercises.zip' }
  ],
  'CS103': [
    { id: 'CS103-1', name: 'Course Syllabus', type: 'pdf', size: '0.4 MB', url: '/modules/CS103/syllabus.pdf' },
    { id: 'CS103-2', name: 'Module 1: Digital Citizenship', type: 'pdf', size: '1.5 MB', url: '/modules/CS103/module1.pdf' },
    { id: 'CS103-3', name: 'Module 2: IT Ethics', type: 'pdf', size: '1.8 MB', url: '/modules/CS103/module2.pdf' },
    { id: 'CS103-4', name: 'Case Studies', type: 'pdf', size: '2.1 MB', url: '/modules/CS103/casestudies.pdf' }
  ],
  'CS104': [
    { id: 'CS104-1', name: 'Python Syllabus', type: 'pdf', size: '0.5 MB', url: '/modules/CS104/syllabus.pdf' },
    { id: 'CS104-2', name: 'Python Basics', type: 'pdf', size: '2.3 MB', url: '/modules/CS104/basics.pdf' },
    { id: 'CS104-3', name: 'OOP in Python', type: 'pdf', size: '2.8 MB', url: '/modules/CS104/oop.pdf' },
    { id: 'CS104-4', name: 'Python Code Labs', type: 'code', size: '1.5 MB', url: '/modules/CS104/codelabs.zip' }
  ],
  'CS105': [
    { id: 'CS105-1', name: 'Discrete Math Syllabus', type: 'pdf', size: '0.4 MB', url: '/modules/CS105/syllabus.pdf' },
    { id: 'CS105-2', name: 'Propositional Logic', type: 'pdf', size: '2.1 MB', url: '/modules/CS105/logic.pdf' },
    { id: 'CS105-3', name: 'Set Theory', type: 'pdf', size: '1.9 MB', url: '/modules/CS105/sets.pdf' },
    { id: 'CS105-4', name: 'Practice Problems', type: 'pdf', size: '1.2 MB', url: '/modules/CS105/problems.pdf' }
  ],
  'CS106': [
    { id: 'CS106-1', name: 'Multimedia Syllabus', type: 'pdf', size: '0.5 MB', url: '/modules/CS106/syllabus.pdf' },
    { id: 'CS106-2', name: 'Digital Image Processing', type: 'pdf', size: '3.2 MB', url: '/modules/CS106/images.pdf' },
    { id: 'CS106-3', name: 'Audio and Video Compression', type: 'pdf', size: '2.8 MB', url: '/modules/CS106/avcompression.pdf' },
    { id: 'CS106-4', name: 'Sample Media Files', type: 'image', size: '5.5 MB', url: '/modules/CS106/media.zip' }
  ],
  'CS201': [
    { id: 'CS201-1', name: 'Graph Theory', type: 'pdf', size: '2.5 MB', url: '/modules/CS201/graphs.pdf' },
    { id: 'CS201-2', name: 'Trees and Traversals', type: 'pdf', size: '2.2 MB', url: '/modules/CS201/trees.pdf' },
    { id: 'CS201-3', name: 'Combinatorics', type: 'pdf', size: '2.0 MB', url: '/modules/CS201/combinatorics.pdf' }
  ],
  'CS202': [
    { id: 'CS202-1', name: 'OOP Concepts', type: 'pdf', size: '2.5 MB', url: '/modules/CS202/oop_concepts.pdf' },
    { id: 'CS202-2', name: 'Inheritance and Polymorphism', type: 'pdf', size: '2.3 MB', url: '/modules/CS202/inheritance.pdf' },
    { id: 'CS202-3', name: 'Design Patterns', type: 'pdf', size: '3.1 MB', url: '/modules/CS202/patterns.pdf' },
    { id: 'CS202-4', name: 'OOP Projects', type: 'code', size: '2.5 MB', url: '/modules/CS202/projects.zip' }
  ],
  'CS203': [
    { id: 'CS203-1', name: 'Arrays and Linked Lists', type: 'pdf', size: '2.8 MB', url: '/modules/CS203/arrays_lists.pdf' },
    { id: 'CS203-2', name: 'Stacks and Queues', type: 'pdf', size: '2.1 MB', url: '/modules/CS203/stacks_queues.pdf' },
    { id: 'CS203-3', name: 'Trees and Binary Search Trees', type: 'pdf', size: '3.2 MB', url: '/modules/CS203/trees.pdf' },
    { id: 'CS203-4', name: 'Graphs and Traversals', type: 'pdf', size: '3.5 MB', url: '/modules/CS203/graphs.pdf' },
    { id: 'CS203-5', name: 'Sorting Algorithms', type: 'pdf', size: '2.6 MB', url: '/modules/CS203/sorting.pdf' },
    { id: 'CS203-6', name: 'DSA Implementation Code', type: 'code', size: '3.8 MB', url: '/modules/CS203/implementations.zip' }
  ],
  'CS204': [
    { id: 'CS204-1', name: 'Embedded Systems Intro', type: 'pdf', size: '2.5 MB', url: '/modules/CS204/intro.pdf' },
    { id: 'CS204-2', name: 'Microcontroller Programming', type: 'pdf', size: '3.1 MB', url: '/modules/CS204/microcontroller.pdf' },
    { id: 'CS204-3', name: 'Arduino Projects', type: 'code', size: '4.2 MB', url: '/modules/CS204/arduino.zip' }
  ],
  'CS205': [
    { id: 'CS205-1', name: 'Divide and Conquer', type: 'pdf', size: '2.3 MB', url: '/modules/CS205/dnc.pdf' },
    { id: 'CS205-2', name: 'Dynamic Programming', type: 'pdf', size: '2.8 MB', url: '/modules/CS205/dp.pdf' },
    { id: 'CS205-3', name: 'Greedy Algorithms', type: 'pdf', size: '2.1 MB', url: '/modules/CS205/greedy.pdf' },
    { id: 'CS205-4', name: 'NP-Completeness', type: 'pdf', size: '2.0 MB', url: '/modules/CS205/np.pdf' }
  ],
  'CS206': [
    { id: 'CS206-1', name: 'Database Design', type: 'pdf', size: '2.8 MB', url: '/modules/CS206/design.pdf' },
    { id: 'CS206-2', name: 'SQL Fundamentals', type: 'pdf', size: '2.5 MB', url: '/modules/CS206/sql.pdf' },
    { id: 'CS206-3', name: 'Normalization', type: 'pdf', size: '2.2 MB', url: '/modules/CS206/normalization.pdf' },
    { id: 'CS206-4', name: 'SQL Lab Exercises', type: 'code', size: '1.8 MB', url: '/modules/CS206/sqllab.sql' }
  ],
  'CS207': [
    { id: 'CS207-1', name: 'HTML5 and CSS3', type: 'pdf', size: '3.5 MB', url: '/modules/CS207/htmlcss.pdf' },
    { id: 'CS207-2', name: 'JavaScript Fundamentals', type: 'pdf', size: '2.8 MB', url: '/modules/CS207/javascript.pdf' },
    { id: 'CS207-3', name: 'React Basics', type: 'pdf', size: '3.2 MB', url: '/modules/CS207/react.pdf' },
    { id: 'CS207-4', name: 'Web Project Templates', type: 'code', size: '5.5 MB', url: '/modules/CS207/templates.zip' }
  ],
  'CS208': [
    { id: 'CS208-1', name: 'Numerical Methods', type: 'pdf', size: '2.8 MB', url: '/modules/CS208/numerical.pdf' },
    { id: 'CS208-2', name: 'Scientific Simulation', type: 'pdf', size: '2.5 MB', url: '/modules/CS208/simulation.pdf' },
    { id: 'CS208-3', name: 'Python for Science', type: 'code', size: '3.2 MB', url: '/modules/CS208/scipy.zip' }
  ]
};

// Helper function to get file icon
const getFileIcon = (type: string) => {
  switch (type) {
    case 'pdf': return <FileText className="w-4 h-4 text-red-500" />;
    case 'video': return <Video className="w-4 h-4 text-blue-500" />;
    case 'pptx': return <FileText className="w-4 h-4 text-orange-500" />;
    case 'docx': return <FileText className="w-4 h-4 text-blue-600" />;
    case 'code': return <FileCode className="w-4 h-4 text-green-600" />;
    case 'image': return <FileImage className="w-4 h-4 text-purple-500" />;
    case 'quiz': return <FileQuestion className="w-4 h-4 text-yellow-600" />;
    default: return <File className="w-4 h-4 text-gray-500" />;
  }
};

// Complete Computer Science Program Modules (32 Courses)
const sampleModules: Module[] = [
  // Year 1 - Semester 1
  {
    id: 'CS101',
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
    year: 1,
    files: courseFilesDatabase['CS101'] || []
  },
  {
    id: 'CS102',
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
    year: 1,
    files: courseFilesDatabase['CS102'] || []
  },
  {
    id: 'CS103',
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
    year: 1,
    files: courseFilesDatabase['CS103'] || []
  },
  {
    id: 'CS104',
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
    year: 1,
    files: courseFilesDatabase['CS104'] || []
  },
  {
    id: 'CS105',
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
    year: 1,
    files: courseFilesDatabase['CS105'] || []
  },
  {
    id: 'CS106',
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
    year: 1,
    files: courseFilesDatabase['CS106'] || []
  },
  // Year 2 - Semester 1
  {
    id: 'CS201',
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
    year: 2,
    files: courseFilesDatabase['CS201'] || []
  },
  {
    id: 'CS202',
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
    year: 2,
    files: courseFilesDatabase['CS202'] || []
  },
  {
    id: 'CS203',
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
    year: 2,
    files: courseFilesDatabase['CS203'] || []
  },
  {
    id: 'CS204',
    title: 'Embedded Systems',
    subject: 'Systems & Architecture',
    description: 'Introduction to embedded systems, microcontrollers, interfacing, and real-time programming concepts.',
    lessons: 12,
    duration: '6 hours',
    difficulty: 'Advanced',
    size: '4.5 MB',
    prerequisites: ['Architecture and Organization'],
    learningObjectives: ['Program microcontrollers', 'Interface with sensors', 'Real-time systems design'],
    semester: 1,
    year: 2,
    files: courseFilesDatabase['CS204'] || []
  },
  {
    id: 'CS205',
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
    year: 2,
    files: courseFilesDatabase['CS205'] || []
  },
  {
    id: 'CS206',
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
    year: 2,
    files: courseFilesDatabase['CS206'] || []
  },
  {
    id: 'CS207',
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
    year: 2,
    files: courseFilesDatabase['CS207'] || []
  },
  {
    id: 'CS208',
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
    year: 2,
    files: courseFilesDatabase['CS208'] || []
  },
  // Add remaining courses (CS301-CS410) with their respective files...
  // For brevity, I'll add placeholders. You can populate with actual data.
];

// Subjects/Categories
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

// File List Component
interface FileListProps {
  files: CourseFile[];
  moduleId: string;
  downloadedFiles: string[];
  onDownloadFile: (moduleId: string, file: CourseFile) => void;
}

function FileList({ files, moduleId, downloadedFiles, onDownloadFile }: FileListProps) {
  const [expanded, setExpanded] = useState(false);
  
  if (!files || files.length === 0) {
    return (
      <div className="mt-3 p-3 bg-gray-50 rounded-lg text-center">
        <p className="text-xs text-gray-500">No files available for this course yet.</p>
      </div>
    );
  }
  
  const displayFiles = expanded ? files : files.slice(0, 3);
  
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-gray-500 flex items-center gap-1">
          <FolderOpen className="w-3 h-3" />
          Course Materials ({files.length} files)
        </p>
        {files.length > 3 && (
          <button onClick={() => setExpanded(!expanded)} className="text-xs text-primary hover:underline flex items-center gap-1">
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? 'Show less' : `Show all (${files.length})`}
          </button>
        )}
      </div>
      <div className="space-y-2">
        {displayFiles.map((file) => {
          const isDownloaded = downloadedFiles.includes(file.id);
          return (
            <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {getFileIcon(file.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark truncate">{file.name}</p>
                  {file.description && <p className="text-xs text-gray-400 truncate">{file.description}</p>}
                </div>
                <span className="text-xs text-gray-400">{file.size}</span>
              </div>
              <button
                onClick={() => onDownloadFile(moduleId, file)}
                className={`ml-2 p-1.5 rounded-lg transition-colors ${isDownloaded ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
                title={isDownloaded ? 'Downloaded' : 'Download'}
              >
                {isDownloaded ? <CheckCircle2 className="w-3 h-3" /> : <Download className="w-3 h-3" />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// File Browser Modal Component
interface FileBrowserProps {
  module: Module;
  onClose: () => void;
  downloadedFiles: string[];
  onDownloadFile: (moduleId: string, file: CourseFile) => void;
}

function FileBrowser({ module, onClose, downloadedFiles, onDownloadFile }: FileBrowserProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const fileCategories = [
    { id: 'all', name: 'All Files', icon: <File className="w-4 h-4" /> },
    { id: 'pdf', name: 'PDFs', icon: <FileText className="w-4 h-4" /> },
    { id: 'video', name: 'Videos', icon: <Video className="w-4 h-4" /> },
    { id: 'code', name: 'Code', icon: <FileCode className="w-4 h-4" /> },
    { id: 'quiz', name: 'Quizzes', icon: <FileQuestion className="w-4 h-4" /> }
  ];
  
  const filteredFiles = selectedCategory === 'all' 
    ? module.files 
    : module.files?.filter(f => f.type === selectedCategory);
  
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
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold text-dark flex items-center gap-2">
              <FolderOpen className="w-6 h-6 text-primary" />
              {module.title}
            </h2>
            <p className="text-gray text-sm mt-1">Browse and download course materials</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray" />
          </button>
        </div>
        
        <div className="p-4 border-b border-gray-100">
          <div className="flex gap-2 overflow-x-auto">
            {fileCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.icon}
                {cat.name}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4">
            <h3 className="font-semibold text-dark mb-2">Course Description</h3>
            <p className="text-sm text-gray-600">{module.description}</p>
          </div>
          
          {module.prerequisites && module.prerequisites.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold text-dark mb-2">Prerequisites</h3>
              <div className="flex flex-wrap gap-1">
                {module.prerequisites.map((pre, idx) => (
                  <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{pre}</span>
                ))}
              </div>
            </div>
          )}
          
          <div>
            <h3 className="font-semibold text-dark mb-3 flex items-center gap-2">
              <Download className="w-4 h-4 text-primary" />
              Available Materials ({filteredFiles?.length || 0})
            </h3>
            {filteredFiles && filteredFiles.length > 0 ? (
              <div className="space-y-2">
                {filteredFiles.map((file) => {
                  const isDownloaded = downloadedFiles.includes(file.id);
                  return (
                    <div key={file.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:shadow-sm transition-shadow">
                      <div className="flex items-center gap-3 flex-1">
                        {getFileIcon(file.type)}
                        <div className="flex-1">
                          <p className="font-medium text-dark">{file.name}</p>
                          {file.description && <p className="text-xs text-gray-400">{file.description}</p>}
                        </div>
                        <span className="text-xs text-gray-400">{file.size}</span>
                      </div>
                      <button
                        onClick={() => onDownloadFile(module.id, file)}
                        className={`ml-3 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                          isDownloaded
                            ? 'bg-green-100 text-green-600 cursor-default'
                            : 'bg-primary text-white hover:bg-accent'
                        }`}
                        disabled={isDownloaded}
                      >
                        {isDownloaded ? <CheckCircle2 className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                        {isDownloaded ? 'Downloaded' : 'Download'}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-xl">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400">No files available in this category</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Main Component
export function LearningSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubject, setActiveSubject] = useState('All');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadedModules, setDownloadedModules] = useState<DownloadedModule[]>([]);
  const [downloadedFiles, setDownloadedFiles] = useState<string[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showOfflineOnly, setShowOfflineOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  
  useEffect(() => {
    const saved = loadDownloadedModules();
    setDownloadedModules(saved);
    
    const savedFiles = localStorage.getItem(DOWNLOADED_FILES_KEY);
    if (savedFiles) {
      setDownloadedFiles(JSON.parse(savedFiles));
    }
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

  const handleDownloadFile = async (moduleId: string, file: CourseFile) => {
    setDownloadingId(`${moduleId}-${file.id}`);
    setDownloadError(null);
    
    try {
      // In production, this would fetch the actual file
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create downloadable content
      const content = `File: ${file.name}\nCourse: ${sampleModules.find(m => m.id === moduleId)?.title}\nType: ${file.type}\nSize: ${file.size}\n\nThis is a sample file. In production, this would be the actual ${file.type} file content.`;
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name.replace(/\s+/g, '-').toLowerCase();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Track downloaded file
      if (!downloadedFiles.includes(file.id)) {
        const updated = [...downloadedFiles, file.id];
        setDownloadedFiles(updated);
        localStorage.setItem(DOWNLOADED_FILES_KEY, JSON.stringify(updated));
      }
      
      // Track module as downloaded if any file was downloaded
      if (!downloadedModules.find(m => m.id === moduleId)) {
        const module = sampleModules.find(m => m.id === moduleId);
        if (module) {
          const downloadedModule: DownloadedModule = {
            ...module,
            downloadedAt: new Date(),
            progress: 0,
            downloadedFiles: [file.id]
          };
          const updated = [...downloadedModules, downloadedModule];
          setDownloadedModules(updated);
          saveDownloadedModules(updated);
        }
      }
      
    } catch (error) {
      setDownloadError(`Failed to download ${file.name}`);
      setTimeout(() => setDownloadError(null), 3000);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleRemoveModule = (id: string) => {
    const updated = downloadedModules.filter(m => m.id !== id);
    setDownloadedModules(updated);
    saveDownloadedModules(updated);
  };

  const handleOpenModule = (module: DownloadedModule) => {
    setSelectedModule(module);
  };

  const handleViewFiles = (module: Module) => {
    setSelectedModule(module);
  };

  const isModuleDownloaded = (id: string) => downloadedModules.some(m => m.id === id);
  const getModuleFiles = (moduleId: string) => courseFilesDatabase[moduleId] || [];
  const totalStorageUsed = downloadedModules.reduce((total, mod) => total + (parseFloat(mod.size?.split(' ')[0] || '0')), 0);

  return (
    <section className="py-16 bg-secondary/10 min-h-[calc(100vh-80px)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Offline Mode Banner */}
        {!navigator.onLine && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
            <CloudOff className="w-5 h-5 text-blue-600" />
            <div className="flex-1">
              <p className="text-blue-800 font-medium">Offline Mode Active</p>
              <p className="text-blue-600 text-sm">You're offline. Access your downloaded modules from Your Library.</p>
            </div>
            <button onClick={() => setShowLibrary(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              Go to Library
            </button>
          </motion.div>
        )}

        {/* Error Banner */}
        {downloadError && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700 text-sm">{downloadError}</p>
          </motion.div>
        )}

        {/* Header & Search */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="mb-12">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="flex justify-center mb-4"><div className="bg-primary/10 p-3 rounded-full"><Terminal className="w-8 h-8 text-primary" /></div></div>
            <h2 className="text-3xl md:text-4xl font-bold text-dark mb-4">Computer Science Learning Library</h2>
            <p className="text-lg text-gray">Complete BS Computer Science curriculum with 32 courses covering all major areas of computing.</p>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <div className="relative flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="text" placeholder="Search by course title, subject, or keyword..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-4 rounded-full border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <button onClick={() => setShowLibrary(true)} className="px-5 py-4 bg-white border border-gray-200 rounded-full hover:shadow-md transition-all flex items-center gap-2 text-dark hover:text-primary">
                <Library className="w-5 h-5" />
                <span className="hidden sm:inline">My Library</span>
                {downloadedModules.length > 0 && <span className="ml-1 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{downloadedModules.length}</span>}
              </button>
              <button onClick={() => setShowFilters(!showFilters)} className={`px-5 py-4 rounded-full transition-all flex items-center gap-2 ${showFilters || showOfflineOnly ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-dark'}`}>
                <Filter className="w-5 h-5" />
                <span className="hidden sm:inline">Filters</span>
              </button>
            </div>
          </div>
          
          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="max-w-2xl mx-auto mt-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="flex flex-wrap gap-4 items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={showOfflineOnly} onChange={(e) => setShowOfflineOnly(e.target.checked)} className="w-4 h-4 text-primary rounded" />
                    <span className="text-sm text-dark">Show only downloaded modules</span>
                  </label>
                  <div className="h-6 w-px bg-gray-200" />
                  <div className="flex items-center gap-2 text-sm text-gray">
                    <HardDrive className="w-4 h-4" />
                    <span>Storage: {totalStorageUsed.toFixed(1)} MB used</span>
                  </div>
                  {downloadedModules.length > 0 && (
                    <button onClick={() => { if (confirm('Remove all downloaded modules?')) { setDownloadedModules([]); saveDownloadedModules([]); setDownloadedFiles([]); localStorage.removeItem(DOWNLOADED_FILES_KEY); } }} className="text-red-500 text-sm hover:text-red-700">
                      Clear All
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Subject Filters */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }} className="mb-12 overflow-x-auto pb-4">
          <div className="flex space-x-3 min-w-max">
            {subjects.map((subject) => (
              <button key={subject} onClick={() => setActiveSubject(subject)} className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${activeSubject === subject ? 'bg-primary text-white shadow-md' : 'bg-secondary/50 text-gray hover:bg-secondary hover:text-primary'}`}>
                {subject === 'All' ? 'All Courses' : subject}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Module Grid */}
        {filteredModules.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredModules.map((module, index) => {
              const isDownloaded = isModuleDownloaded(module.id);
              const moduleFiles = getModuleFiles(module.id);
              const hasFiles = moduleFiles.length > 0;
              
              return (
                <motion.div layout key={module.id} initial={{ opacity: 0, scale: 0.9, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.4, delay: Math.min(index * 0.03, 0.5) }} whileHover={{ y: -4 }} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all flex flex-col h-full relative">
                  
                  {/* Downloaded Badge */}
                  {isDownloaded && (
                    <div className="absolute top-4 right-4">
                      <div className="bg-green-100 text-green-700 rounded-full p-1.5" title="Downloaded for offline use">
                        <CheckCircle2 className="w-3 h-3" />
                      </div>
                    </div>
                  )}

                  {/* Course Code */}
                  <div className="mb-2">
                    <code className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">{module.id}</code>
                  </div>

                  {/* Subject Tag */}
                  <div className="mb-3">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getSubjectColor(module.subject)}`}>
                      {module.subject}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-dark mb-2 line-clamp-2">{module.title}</h3>
                  
                  {/* Description */}
                  <p className="text-gray text-sm mb-3 flex-grow line-clamp-3">{module.description}</p>
                  
                  {/* Year & Semester */}
                  {module.year && module.semester && (
                    <p className="text-xs text-gray-400 mb-3">Year {module.year}, Semester {module.semester}</p>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 mb-4 pt-3 border-t border-gray-50">
                    <div className="flex flex-col items-center text-center">
                      <BookOpen className="w-4 h-4 text-primary mb-1" />
                      <span className="text-xs font-medium text-dark">{module.lessons}</span>
                      <span className="text-[10px] text-gray-400">Lessons</span>
                    </div>
                    <div className="flex flex-col items-center text-center border-x border-gray-100">
                      <Clock className="w-4 h-4 text-primary mb-1" />
                      <span className="text-xs font-medium text-dark">{module.duration}</span>
                      <span className="text-[10px] text-gray-400">Duration</span>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <BarChart3 className="w-4 h-4 text-primary mb-1" />
                      <span className="text-xs font-medium text-dark">{module.difficulty}</span>
                      <span className="text-[10px] text-gray-400">Level</span>
                    </div>
                  </div>

                  {/* File Availability */}
                  <div className="mb-3 flex items-center justify-between text-xs">
                    <span className={`flex items-center gap-1 ${hasFiles ? 'text-green-600' : 'text-yellow-600'}`}>
                      {hasFiles ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      {hasFiles ? `${moduleFiles.length} file(s) available` : 'Files coming soon'}
                    </span>
                    {hasFiles && (
                      <button onClick={() => handleViewFiles(module)} className="text-primary hover:underline text-xs">
                        Browse files
                      </button>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewFiles(module)}
                      className="flex-1 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      <FolderOpen className="w-4 h-4" />
                      Browse Files
                    </button>
                    <button
                      onClick={() => isDownloaded ? handleOpenModule(downloadedModules.find(m => m.id === module.id)!) : handleViewFiles(module)}
                      className={`flex-1 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
                        isDownloaded 
                          ? 'bg-green-500 text-white hover:bg-green-600' 
                          : 'bg-primary text-white hover:bg-accent'
                      }`}
                    >
                      {isDownloaded ? <BookOpen className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                      {isDownloaded ? 'Open' : 'Download'}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6"><Search className="w-10 h-10 text-primary/50" /></div>
            <h3 className="text-xl font-bold text-dark mb-2">No modules found</h3>
            <p className="text-gray max-w-md mx-auto">{showOfflineOnly ? "You haven't downloaded any modules yet. Browse and download to get started!" : `No courses matching "${searchQuery}" in ${activeSubject}.`}</p>
            {showOfflineOnly && downloadedModules.length === 0 && <button onClick={() => setShowOfflineOnly(false)} className="mt-6 text-primary font-medium hover:underline">Browse all courses</button>}
            {!showOfflineOnly && searchQuery && <button onClick={() => { setSearchQuery(''); setActiveSubject('All'); }} className="mt-6 text-primary font-medium hover:underline">Clear all filters</button>}
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

      {/* File Browser Modal */}
      <AnimatePresence>
        {selectedModule && (
          <FileBrowser
            module={selectedModule}
            onClose={() => setSelectedModule(null)}
            downloadedFiles={downloadedFiles}
            onDownloadFile={handleDownloadFile}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

// YourLibrary Component (keep the same as before)
function YourLibrary({ downloadedModules, onRemoveModule, onOpenModule, isOpen, onClose }: {
  downloadedModules: DownloadedModule[];
  onRemoveModule: (id: string) => void;
  onOpenModule: (module: DownloadedModule) => void;
  isOpen: boolean;
  onClose: () => void;
}) {
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
            <p className="text-gray text-sm mt-1">{downloadedModules.length} modules downloaded • {totalStorage.toFixed(1)} MB total</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5 text-gray" /></button>
        </div>
        
        <div className="p-6 border-b border-gray-100">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search your modules..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {filteredModules.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><Code2 className="w-10 h-10 text-gray-400" /></div>
              <h3 className="text-lg font-semibold text-dark mb-2">Your library is empty</h3>
              <p className="text-gray text-sm">Download modules from the Learning Library to see them here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredModules.map((module) => (
                <div key={module.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getSubjectColor(module.subject)}`}>{module.subject}</span>
                    <button onClick={() => onRemoveModule(module.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <h3 className="font-semibold text-dark mb-1">{module.title}</h3>
                  <p className="text-gray text-xs mb-2 line-clamp-2">{module.description}</p>
                  {module.year && module.semester && <p className="text-xs text-gray-400 mb-2">Year {module.year}, Semester {module.semester}</p>}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{module.duration}</span>
                    <span className="flex items-center gap-1"><HardDrive className="w-3 h-3" />{module.size}</span>
                    <span>Downloaded: {module.downloadedAt.toLocaleDateString()}</span>
                  </div>
                  <button onClick={() => onOpenModule(module)} className="w-full py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20"><FolderOpen className="w-3 h-3 inline mr-1" />Open Module</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
