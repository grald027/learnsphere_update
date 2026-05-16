import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Download,
  Library,
  Trash2,
  HardDrive,
  CloudOff,
  RefreshCw,
  Filter,
  X,
  Terminal,
  Code2,
  FolderOpen,
  FileText,
  AlertCircle,
  CheckCircle2,
  Eye
} from 'lucide-react';

// Define file type
interface CourseFile {
  id: string;
  name: string;
  size: string;
  type: string;
  url: string;
}

// Define module data type
interface Module {
  id: string;
  code: string;
  title: string;
  subject: string;
  description: string;
  files: CourseFile[];
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

// The 8 Courses with Embedded Files
const sampleModules: Module[] = [
  {
    id: 'CS321',
    code: 'CS321',
    title: 'Programming Languages',
    subject: 'Programming Languages',
    description: 'Study of programming language paradigms, design principles, and implementation strategies.',
    files: [
      {
        id: 'CS321-1',
        name: 'Programming Languages Syllabus.pdf',
        size: '1.2 MB',
        type: 'pdf',
        url: '/modules/CS321/syllabus.pdf'
      },
      {
        id: 'CS321-2',
        name: 'Introduction to Programming Paradigms.pptx',
        size: '2.5 MB',
        type: 'pptx',
        url: '/modules/CS321/paradigms.pptx'
      },
      {
        id: 'CS321-3',
        name: 'Functional Programming Notes.pdf',
        size: '1.8 MB',
        type: 'pdf',
        url: '/modules/CS321/functional.pdf'
      },
      {
        id: 'CS321-4',
        name: 'Programming Languages Exercise Set.zip',
        size: '3.2 MB',
        type: 'zip',
        url: '/modules/CS321/exercises.zip'
      }
    ]
  },
  {
    id: 'CS322',
    code: 'CS322',
    title: 'Software Engineering 1',
    subject: 'Software Engineering',
    description: 'Software development lifecycle, requirements engineering, design patterns, project management.',
    files: [
      {
        id: 'CS322-1',
        name: 'Software Engineering Syllabus.pdf',
        size: '1.1 MB',
        type: 'pdf',
        url: '/modules/CS322/syllabus.pdf'
      },
      {
        id: 'CS322-2',
        name: 'Software Development Lifecycle.pptx',
        size: '2.8 MB',
        type: 'pptx',
        url: '/modules/CS322/sdlc.pptx'
      },
      {
        id: 'CS322-3',
        name: 'Design Patterns Reference.pdf',
        size: '3.5 MB',
        type: 'pdf',
        url: '/modules/CS322/design-patterns.pdf'
      },
      {
        id: 'CS322-4',
        name: 'Project Management Templates.docx',
        size: '1.5 MB',
        type: 'docx',
        url: '/modules/CS322/templates.docx'
      }
    ]
  },
  {
    id: 'CS323',
    code: 'CS323',
    title: 'Social Issues and Professional Practice',
    subject: 'Social & Professional',
    description: 'Ethical and social issues in computing, professional responsibilities, legal aspects.',
    files: [
      {
        id: 'CS323-1',
        name: 'Social Issues Syllabus.pdf',
        size: '1.0 MB',
        type: 'pdf',
        url: '/modules/CS323/syllabus.pdf'
      },
      {
        id: 'CS323-2',
        name: 'Computing Ethics Case Studies.pdf',
        size: '2.2 MB',
        type: 'pdf',
        url: '/modules/CS323/ethics.pdf'
      },
      {
        id: 'CS323-3',
        name: 'Professional Code of Conduct.pptx',
        size: '1.5 MB',
        type: 'pptx',
        url: '/modules/CS323/code-of-conduct.pptx'
      }
    ]
  },
  {
    id: 'CS324',
    code: 'CS324',
    title: 'CS Elective 2 (Graphics and Visual Computing)',
    subject: 'Graphics & Visual Computing',
    description: 'Computer graphics fundamentals, 2D/3D rendering, visual design, animation.',
    files: [
      {
        id: 'CS324-1',
        name: 'Graphics Computing Syllabus.pdf',
        size: '1.2 MB',
        type: 'pdf',
        url: '/modules/CS324/syllabus.pdf'
      },
      {
        id: 'CS324-2',
        name: 'Introduction to OpenGL.pdf',
        size: '3.5 MB',
        type: 'pdf',
        url: '/modules/CS324/opengl.pdf'
      },
      {
        id: 'CS324-3',
        name: '3D Rendering Techniques.pptx',
        size: '4.2 MB',
        type: 'pptx',
        url: '/modules/CS324/rendering.pptx'
      },
      {
        id: 'CS324-4',
        name: 'Graphics Sample Projects.zip',
        size: '5.5 MB',
        type: 'zip',
        url: '/modules/CS324/projects.zip'
      }
    ]
  },
  {
    id: 'CS325',
    code: 'CS325',
    title: 'Mobile Computing',
    subject: 'Mobile Development',
    description: 'Mobile app development for iOS and Android, UI/UX design, cross-platform solutions.',
    files: [
      {
        id: 'CS325-1',
        name: 'Mobile Computing Syllabus.pdf',
        size: '1.1 MB',
        type: 'pdf',
        url: '/modules/CS325/syllabus.pdf'
      },
      {
        id: 'CS325-2',
        name: 'iOS Development Fundamentals.pdf',
        size: '3.8 MB',
        type: 'pdf',
        url: '/modules/CS325/ios.pdf'
      },
      {
        id: 'CS325-3',
        name: 'Android Studio Setup Guide.docx',
        size: '1.8 MB',
        type: 'docx',
        url: '/modules/CS325/android-setup.docx'
      },
      {
        id: 'CS325-4',
        name: 'Cross-Platform Development.pptx',
        size: '2.5 MB',
        type: 'pptx',
        url: '/modules/CS325/cross-platform.pptx'
      },
      {
        id: 'CS325-5',
        name: 'Mobile App Sample Code.zip',
        size: '6.5 MB',
        type: 'zip',
        url: '/modules/CS325/sample-code.zip'
      }
    ]
  },
  {
    id: 'CS326',
    code: 'CS326',
    title: 'Modeling and Simulation',
    subject: 'Modeling & Simulation',
    description: 'System modeling, discrete and continuous simulation, statistical analysis.',
    files: [
      {
        id: 'CS326-1',
        name: 'Modeling and Simulation Syllabus.pdf',
        size: '1.0 MB',
        type: 'pdf',
        url: '/modules/CS326/syllabus.pdf'
      },
      {
        id: 'CS326-2',
        name: 'Introduction to Simulation Models.pdf',
        size: '2.5 MB',
        type: 'pdf',
        url: '/modules/CS326/simulation-models.pdf'
      },
      {
        id: 'CS326-3',
        name: 'Statistical Analysis for Simulation.pptx',
        size: '2.2 MB',
        type: 'pptx',
        url: '/modules/CS326/statistics.pptx'
      },
      {
        id: 'CS326-4',
        name: 'Simulation Lab Exercises.zip',
        size: '4.5 MB',
        type: 'zip',
        url: '/modules/CS326/lab-exercises.zip'
      }
    ]
  },
  {
    id: 'CS327',
    code: 'CS327',
    title: 'Data Mining Concepts and Techniques',
    subject: 'Data Science',
    description: 'Data preprocessing, classification, clustering, association rules, pattern discovery.',
    files: [
      {
        id: 'CS327-1',
        name: 'Data Mining Syllabus.pdf',
        size: '1.2 MB',
        type: 'pdf',
        url: '/modules/CS327/syllabus.pdf'
      },
      {
        id: 'CS327-2',
        name: 'Data Preprocessing Techniques.pdf',
        size: '2.8 MB',
        type: 'pdf',
        url: '/modules/CS327/preprocessing.pdf'
      },
      {
        id: 'CS327-3',
        name: 'Classification Algorithms.pptx',
        size: '3.2 MB',
        type: 'pptx',
        url: '/modules/CS327/classification.pptx'
      },
      {
        id: 'CS327-4',
        name: 'Clustering Methods Reference.pdf',
        size: '2.5 MB',
        type: 'pdf',
        url: '/modules/CS327/clustering.pdf'
      },
      {
        id: 'CS327-5',
        name: 'Data Mining Case Studies.zip',
        size: '7.5 MB',
        type: 'zip',
        url: '/modules/CS327/case-studies.zip'
      }
    ]
  },
  {
    id: 'CS328',
    code: 'CS328',
    title: 'Machine Learning',
    subject: 'Artificial Intelligence',
    description: 'Supervised and unsupervised learning, neural networks, deep learning, model evaluation.',
    files: [
      {
        id: 'CS328-1',
        name: 'Machine Learning Syllabus.pdf',
        size: '1.3 MB',
        type: 'pdf',
        url: '/modules/CS328/syllabus.pdf'
      },
      {
        id: 'CS328-2',
        name: 'Supervised Learning Algorithms.pdf',
        size: '3.5 MB',
        type: 'pdf',
        url: '/modules/CS328/supervised.pdf'
      },
      {
        id: 'CS328-3',
        name: 'Neural Networks and Deep Learning.pptx',
        size: '4.2 MB',
        type: 'pptx',
        url: '/modules/CS328/neural-networks.pptx'
      },
      {
        id: 'CS328-4',
        name: 'Model Evaluation Techniques.pdf',
        size: '2.2 MB',
        type: 'pdf',
        url: '/modules/CS328/evaluation.pdf'
      },
      {
        id: 'CS328-5',
        name: 'ML Practice Datasets.zip',
        size: '12.5 MB',
        type: 'zip',
        url: '/modules/CS328/datasets.zip'
      },
      {
        id: 'CS328-6',
        name: 'Python ML Code Examples.zip',
        size: '3.8 MB',
        type: 'zip',
        url: '/modules/CS328/code-examples.zip'
      }
    ]
  }
];

const subjects = [
  'All',
  'Programming Languages',
  'Software Engineering',
  'Social & Professional',
  'Graphics & Visual Computing',
  'Mobile Development',
  'Modeling & Simulation',
  'Data Science',
  'Artificial Intelligence'
];

const getSubjectColor = (subject: string) => {
  const colorMap: Record<string, string> = {
    'Programming Languages': 'bg-blue-100 text-blue-800 border-blue-200',
    'Software Engineering': 'bg-teal-100 text-teal-800 border-teal-200',
    'Social & Professional': 'bg-amber-100 text-amber-800 border-amber-200',
    'Graphics & Visual Computing': 'bg-purple-100 text-purple-800 border-purple-200',
    'Mobile Development': 'bg-green-100 text-green-800 border-green-200',
    'Modeling & Simulation': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'Data Science': 'bg-cyan-100 text-cyan-800 border-cyan-200',
    'Artificial Intelligence': 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200'
  };
  return colorMap[subject] || 'bg-gray-100 text-gray-800 border-gray-200';
};

const loadDownloadedModules = (): DownloadedModule[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      return [];
    }
  }
  return [];
};

const saveDownloadedModules = (modules: DownloadedModule[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(modules));
};

// File Browser Modal Component
const FileBrowser = ({
  module,
  onClose,
  downloadedFiles,
  onDownloadFile,
}: {
  module: Module;
  onClose: () => void;
  downloadedFiles: string[];
  onDownloadFile: (moduleId: string, file: CourseFile) => void;
}) => {
  const files = module.files || [];

  // Group files by type for better organization
  const pdfFiles = files.filter(f => f.type === 'pdf');
  const pptFiles = files.filter(f => f.type === 'pptx');
  const docFiles = files.filter(f => f.type === 'docx');
  const zipFiles = files.filter(f => f.type === 'zip');
  const otherFiles = files.filter(f => !['pdf', 'pptx', 'docx', 'zip'].includes(f.type));

  const FileSection = ({ title, files: sectionFiles, icon }: { title: string; files: CourseFile[]; icon: string }) => {
    if (sectionFiles.length === 0) return null;
    return (
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
          <span>{icon}</span>
          {title} ({sectionFiles.length})
        </h4>
        <div className="space-y-2">
          {sectionFiles.map((file) => {
            const isDownloaded = downloadedFiles.includes(file.id);
            return (
              <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-dark truncate">{file.name}</p>
                    <p className="text-xs text-gray-400">{file.size}</p>
                  </div>
                </div>
                <button
                  onClick={() => onDownloadFile(module.id, file)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors ${
                    isDownloaded
                      ? 'bg-green-100 text-green-600'
                      : 'bg-primary text-white hover:bg-accent'
                  }`}
                >
                  {isDownloaded ? <CheckCircle2 className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                  {isDownloaded ? 'Downloaded' : 'Download'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold text-dark flex items-center gap-2">
              <FolderOpen className="w-6 h-6 text-primary" />
              {module.code}: {module.title}
            </h2>
            <p className="text-gray text-sm mt-1">{files.length} material(s) available</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray" />
          </button>
        </div>

        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <p className="text-sm text-gray-600">{module.description}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <FileSection title="Lecture Notes & Documents" files={pdfFiles} icon="📄" />
          <FileSection title="Presentations" files={pptFiles} icon="📊" />
          <FileSection title="Guides & Templates" files={docFiles} icon="📝" />
          <FileSection title="Resources & Downloads" files={zipFiles} icon="📦" />
          <FileSection title="Other Materials" files={otherFiles} icon="📎" />
        </div>
      </div>
    </div>
  );
};

// Main Component
export function LearningSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubject, setActiveSubject] = useState('All');
  const [downloadedModules, setDownloadedModules] = useState<DownloadedModule[]>([]);
  const [downloadedFiles, setDownloadedFiles] = useState<string[]>([]);
  const [modules] = useState<Module[]>(sampleModules);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showOfflineOnly, setShowOfflineOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = loadDownloadedModules();
    setDownloadedModules(saved);

    const savedDownloadedFiles = localStorage.getItem(DOWNLOADED_FILES_KEY);
    if (savedDownloadedFiles) {
      setDownloadedFiles(JSON.parse(savedDownloadedFiles));
    }
    setLoading(false);
  }, []);

  const filteredModules = useMemo(() => {
    let modulesList = modules;
    if (showOfflineOnly) {
      const downloadedIds = new Set(downloadedModules.map((m) => m.id));
      modulesList = modulesList.filter((m) => downloadedIds.has(m.id));
    }
    return modulesList.filter((module) => {
      const matchesSearch =
        module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        module.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        module.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSubject = activeSubject === 'All' || module.subject === activeSubject;
      return matchesSearch && matchesSubject;
    });
  }, [searchQuery, activeSubject, downloadedModules, showOfflineOnly, modules]);

  const handleDownloadFile = async (moduleId: string, file: CourseFile) => {
    try {
      // For embedded files, we need to fetch them from the public directory
      const response = await fetch(file.url);
      const blob = await response.blob();

      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      if (!downloadedFiles.includes(file.id)) {
        const updatedFiles = [...downloadedFiles, file.id];
        setDownloadedFiles(updatedFiles);
        localStorage.setItem(DOWNLOADED_FILES_KEY, JSON.stringify(updatedFiles));
      }

      if (!downloadedModules.find((m) => m.id === moduleId)) {
        const module = modules.find((m) => m.id === moduleId);
        if (module) {
          const downloadedModule: DownloadedModule = {
            ...module,
            downloadedAt: new Date(),
            downloadedFiles: [file.id],
          };
          const updated = [...downloadedModules, downloadedModule];
          setDownloadedModules(updated);
          saveDownloadedModules(updated);
        }
      }
    } catch (error) {
      setDownloadError(`Failed to download ${file.name}`);
      setTimeout(() => setDownloadError(null), 3000);
    }
  };

  const handleRemoveModule = (id: string) => {
    const updated = downloadedModules.filter((m) => m.id !== id);
    setDownloadedModules(updated);
    saveDownloadedModules(updated);
  };

  const handleViewFiles = (module: Module) => {
    setSelectedModule(module);
  };

  const isModuleDownloaded = (id: string) => downloadedModules.some((m) => m.id === id);

  if (loading) {
    return (
      <div className="py-16 bg-secondary/10 min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray">Loading course materials...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="py-16 bg-secondary/10 min-h-[calc(100vh-80px)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {!navigator.onLine && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
            <CloudOff className="w-5 h-5 text-blue-600" />
            <div className="flex-1">
              <p className="text-blue-800 font-medium">Offline Mode Active</p>
              <p className="text-blue-600 text-sm">
                You need internet to access course materials.
              </p>
            </div>
          </div>
        )}

        {downloadError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700 text-sm">{downloadError}</p>
          </div>
        )}

        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <Terminal className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-dark mb-4">Learning Library</h2>
          <p className="text-lg text-gray">Access course materials for your Computer Science program</p>
        </div>

        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by course code or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-full border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <button
              onClick={() => setShowLibrary(true)}
              className="px-5 py-4 bg-white border border-gray-200 rounded-full hover:shadow-md flex items-center gap-2 text-dark hover:text-primary"
            >
              <Library className="w-5 h-5" />
              <span className="hidden sm:inline">My Library</span>
              {downloadedModules.length > 0 && (
                <span className="ml-1 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {downloadedModules.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-5 py-4 rounded-full flex items-center gap-2 ${
                showFilters || showOfflineOnly
                  ? 'bg-primary text-white'
                  : 'bg-white border border-gray-200 text-dark'
              }`}
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="max-w-2xl mx-auto mb-8 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex flex-wrap gap-4 items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOfflineOnly}
                  onChange={(e) => setShowOfflineOnly(e.target.checked)}
                  className="w-4 h-4 text-primary rounded"
                />
                <span className="text-sm text-dark">Show only downloaded modules</span>
              </label>
              <div className="h-6 w-px bg-gray-200" />
              <div className="flex items-center gap-2 text-sm text-gray">
                <HardDrive className="w-4 h-4" />
                <span>{downloadedModules.length} module(s) downloaded</span>
              </div>
              {downloadedModules.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('Remove all downloaded modules?')) {
                      setDownloadedModules([]);
                      saveDownloadedModules([]);
                      setDownloadedFiles([]);
                      localStorage.removeItem(DOWNLOADED_FILES_KEY);
                    }
                  }}
                  className="text-red-500 text-sm"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mb-8 overflow-x-auto pb-4">
          <div className="flex space-x-3 min-w-max">
            {subjects.map((subject) => (
              <button
                key={subject}
                onClick={() => setActiveSubject(subject)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  activeSubject === subject
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-secondary/50 text-gray hover:bg-secondary hover:text-primary'
                }`}
              >
                {subject === 'All' ? 'All Courses' : subject}
              </button>
            ))}
          </div>
        </div>

        {filteredModules.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModules.map((module) => {
              const isDownloaded = isModuleDownloaded(module.id);
              const hasFiles = module.files && module.files.length > 0;

              return (
                <div
                  key={module.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all overflow-hidden"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <code className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded">
                        {module.code}
                      </code>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${getSubjectColor(module.subject)}`}
                      >
                        {module.subject}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-dark mb-2">{module.title}</h3>
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">{module.description}</p>

                    <div className="flex items-center justify-between mb-4 text-xs">
                      <div className="flex items-center gap-1 text-gray-400">
                        <FileText className="w-3 h-3" />
                        <span>{hasFiles ? `${module.files.length} file(s)` : 'No materials'}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleViewFiles(module)}
                      className="w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 bg-primary text-white hover:bg-accent"
                    >
                      <FolderOpen className="w-4 h-4" />
                      Browse Files
                    </button>

                    {isDownloaded && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-center gap-1 text-xs text-green-600">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Downloaded to library</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-primary/50" />
            </div>
            <h3 className="text-xl font-bold text-dark mb-2">No modules found</h3>
            <p className="text-gray max-w-md mx-auto">
              {showOfflineOnly
                ? "You haven't downloaded any modules yet."
                : `No courses matching "${searchQuery}".`}
            </p>
          </div>
        )}
      </div>

      {/* My Library Modal */}
      <AnimatePresence>
        {showLibrary && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowLibrary(false)}
          >
            <div
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] flex flex-col shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-dark flex items-center gap-2">
                    <Library className="w-6 h-6 text-primary" />
                    Your Library
                  </h2>
                  <p className="text-gray text-sm mt-1">
                    {downloadedModules.length} modules downloaded
                  </p>
                </div>
                <button
                  onClick={() => setShowLibrary(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5 text-gray" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {downloadedModules.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Code2 className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-dark mb-2">Your library is empty</h3>
                    <p className="text-gray text-sm">Download modules to see them here</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {downloadedModules.map((module) => (
                      <div key={module.id} className="border border-gray-200 rounded-xl p-4">
                        <div className="flex justify-between items-start mb-2">
                          <code className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded">
                            {module.code}
                          </code>
                          <button
                            onClick={() => handleRemoveModule(module.id)}
                            className="text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <h3 className="font-semibold text-dark mb-1">{module.title}</h3>
                        <p className="text-gray text-xs mb-3 line-clamp-2">{module.description}</p>
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                          <span>
                            Downloaded: {new Date(module.downloadedAt).toLocaleDateString()}
                          </span>
                          <span>{module.downloadedFiles?.length || 0} file(s)</span>
                        </div>
                        <button
                          onClick={() => handleViewFiles(module)}
                          className="w-full py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20"
                        >
                          Open Module
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
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
