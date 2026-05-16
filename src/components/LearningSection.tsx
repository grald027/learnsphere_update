import React, { useMemo, useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
  Eye,
  BookOpen,
  ChevronRight,
  Layers,
  Cpu,
  Globe,
  BarChart2,
  Smartphone,
  Activity,
  Database,
  Users,
  ExternalLink,
  Clock,
  Package,
  SlidersHorizontal,
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface CourseFile {
  id: string;
  name: string;
  size: string;
  type: string;
  url: string;
}

interface Module {
  id: string;
  code: string;
  title: string;
  subject: string;
  description: string;
  files: CourseFile[];
}

interface DownloadedModule extends Module {
  downloadedAt: Date;
  lastAccessed?: Date;
  downloadedFiles?: string[];
}

/* ─── Storage ────────────────────────────────────────────────────────────── */
const STORAGE_KEY = 'learnsphere_downloaded_modules';
const DOWNLOADED_FILES_KEY = 'learnsphere_downloaded_files';

const loadDownloadedModules = (): DownloadedModule[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveDownloadedModules = (modules: DownloadedModule[]) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(modules));

/* ─── Data ───────────────────────────────────────────────────────────────── */
const sampleModules: Module[] = [
  {
    id: 'CS321', code: 'CS321', title: 'Programming Languages',
    subject: 'Programming Languages',
    description: 'Study of programming language paradigms, design principles, and implementation strategies.',
    files: [
      { id: 'CS321-1', name: 'Concepts of Programming Languages by Robert W. Sebesta.pdf', size: '3.9 MB', type: 'pdf', url: '/modules/CS321/Concepts of Programming Languages by Robert W. Sebesta.pdf' },
      { id: 'CS321-2', name: 'Introduction to Programming Paradigms.pptx', size: '2.5 MB', type: 'pptx', url: '/modules/CS321/paradigms.pptx' },
      { id: 'CS321-3', name: 'Functional Programming Notes.pdf', size: '1.8 MB', type: 'pdf', url: '/modules/CS321/functional.pdf' },
      { id: 'CS321-4', name: 'Programming Languages Exercise Set.zip', size: '3.2 MB', type: 'zip', url: '/modules/CS321/exercises.zip' },
    ],
  },
  {
    id: 'CS322', code: 'CS322', title: 'Software Engineering 1',
    subject: 'Software Engineering',
    description: 'Software development lifecycle, requirements engineering, design patterns, project management.',
    files: [
      { id: 'CS322-1', name: 'Software Engineering Syllabus.pdf', size: '1.1 MB', type: 'pdf', url: '/modules/CS322/syllabus.pdf' },
      { id: 'CS322-2', name: 'Software Development Lifecycle.pptx', size: '2.8 MB', type: 'pptx', url: '/modules/CS322/sdlc.pptx' },
      { id: 'CS322-3', name: 'Design Patterns Reference.pdf', size: '3.5 MB', type: 'pdf', url: '/modules/CS322/design-patterns.pdf' },
      { id: 'CS322-4', name: 'Project Management Templates.docx', size: '1.5 MB', type: 'docx', url: '/modules/CS322/templates.docx' },
    ],
  },
  {
    id: 'CS323', code: 'CS323', title: 'Social Issues & Professional Practice',
    subject: 'Social & Professional',
    description: 'Ethical and social issues in computing, professional responsibilities, legal aspects.',
    files: [
      { id: 'CS323-1', name: 'Social Issues Syllabus.pdf', size: '1.0 MB', type: 'pdf', url: '/modules/CS323/syllabus.pdf' },
      { id: 'CS323-2', name: 'Computing Ethics Case Studies.pdf', size: '2.2 MB', type: 'pdf', url: '/modules/CS323/ethics.pdf' },
      { id: 'CS323-3', name: 'Professional Code of Conduct.pptx', size: '1.5 MB', type: 'pptx', url: '/modules/CS323/code-of-conduct.pptx' },
    ],
  },
  {
    id: 'CS324', code: 'CS324', title: 'CS Elective 2 — Graphics & Visual Computing',
    subject: 'Graphics & Visual Computing',
    description: 'Computer graphics fundamentals, 2D/3D rendering, visual design, animation.',
    files: [
      { id: 'CS324-1', name: 'Graphics Computing Syllabus.pdf', size: '1.2 MB', type: 'pdf', url: '/modules/CS324/syllabus.pdf' },
      { id: 'CS324-2', name: 'Introduction to OpenGL.pdf', size: '3.5 MB', type: 'pdf', url: '/modules/CS324/opengl.pdf' },
      { id: 'CS324-3', name: '3D Rendering Techniques.pptx', size: '4.2 MB', type: 'pptx', url: '/modules/CS324/rendering.pptx' },
      { id: 'CS324-4', name: 'Graphics Sample Projects.zip', size: '5.5 MB', type: 'zip', url: '/modules/CS324/projects.zip' },
    ],
  },
  {
    id: 'CS325', code: 'CS325', title: 'Mobile Computing',
    subject: 'Mobile Development',
    description: 'Mobile app development for iOS and Android, UI/UX design, cross-platform solutions.',
    files: [
      { id: 'CS325-1', name: 'Mobile Computing Syllabus.pdf', size: '1.1 MB', type: 'pdf', url: '/modules/CS325/syllabus.pdf' },
      { id: 'CS325-2', name: 'iOS Development Fundamentals.pdf', size: '3.8 MB', type: 'pdf', url: '/modules/CS325/ios.pdf' },
      { id: 'CS325-3', name: 'Android Studio Setup Guide.docx', size: '1.8 MB', type: 'docx', url: '/modules/CS325/android-setup.docx' },
      { id: 'CS325-4', name: 'Cross-Platform Development.pptx', size: '2.5 MB', type: 'pptx', url: '/modules/CS325/cross-platform.pptx' },
      { id: 'CS325-5', name: 'Mobile App Sample Code.zip', size: '6.5 MB', type: 'zip', url: '/modules/CS325/sample-code.zip' },
    ],
  },
  {
    id: 'CS326', code: 'CS326', title: 'Modeling and Simulation',
    subject: 'Modeling & Simulation',
    description: 'System modeling, discrete and continuous simulation, statistical analysis.',
    files: [
      { id: 'CS326-1', name: 'Modeling and Simulation Syllabus.pdf', size: '1.0 MB', type: 'pdf', url: '/modules/CS326/syllabus.pdf' },
      { id: 'CS326-2', name: 'Introduction to Simulation Models.pdf', size: '2.5 MB', type: 'pdf', url: '/modules/CS326/simulation-models.pdf' },
      { id: 'CS326-3', name: 'Statistical Analysis for Simulation.pptx', size: '2.2 MB', type: 'pptx', url: '/modules/CS326/statistics.pptx' },
      { id: 'CS326-4', name: 'Simulation Lab Exercises.zip', size: '4.5 MB', type: 'zip', url: '/modules/CS326/lab-exercises.zip' },
    ],
  },
  {
    id: 'CS327', code: 'CS327', title: 'Data Mining Concepts & Techniques',
    subject: 'Data Science',
    description: 'Data preprocessing, classification, clustering, association rules, pattern discovery.',
    files: [
      { id: 'CS327-1', name: 'Data Mining Syllabus.pdf', size: '1.2 MB', type: 'pdf', url: '/modules/CS327/syllabus.pdf' },
      { id: 'CS327-2', name: 'Data Preprocessing Techniques.pdf', size: '2.8 MB', type: 'pdf', url: '/modules/CS327/preprocessing.pdf' },
      { id: 'CS327-3', name: 'Classification Algorithms.pptx', size: '3.2 MB', type: 'pptx', url: '/modules/CS327/classification.pptx' },
      { id: 'CS327-4', name: 'Clustering Methods Reference.pdf', size: '2.5 MB', type: 'pdf', url: '/modules/CS327/clustering.pdf' },
      { id: 'CS327-5', name: 'Data Mining Case Studies.zip', size: '7.5 MB', type: 'zip', url: '/modules/CS327/case-studies.zip' },
    ],
  },
  {
    id: 'CS328', code: 'CS328', title: 'Machine Learning',
    subject: 'Artificial Intelligence',
    description: 'Supervised and unsupervised learning, neural networks, deep learning, model evaluation.',
    files: [
      { id: 'CS328-1', name: 'Machine Learning Syllabus.pdf', size: '1.3 MB', type: 'pdf', url: '/modules/CS328/syllabus.pdf' },
      { id: 'CS328-2', name: 'Supervised Learning Algorithms.pdf', size: '3.5 MB', type: 'pdf', url: '/modules/CS328/supervised.pdf' },
      { id: 'CS328-3', name: 'Neural Networks and Deep Learning.pptx', size: '4.2 MB', type: 'pptx', url: '/modules/CS328/neural-networks.pptx' },
      { id: 'CS328-4', name: 'Model Evaluation Techniques.pdf', size: '2.2 MB', type: 'pdf', url: '/modules/CS328/evaluation.pdf' },
      { id: 'CS328-5', name: 'ML Practice Datasets.zip', size: '12.5 MB', type: 'zip', url: '/modules/CS328/datasets.zip' },
      { id: 'CS328-6', name: 'Python ML Code Examples.zip', size: '3.8 MB', type: 'zip', url: '/modules/CS328/code-examples.zip' },
    ],
  },
];

/* ─── Subject metadata ───────────────────────────────────────────────────── */
const subjectMeta: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
  'Programming Languages':    { color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200',   icon: <Code2 className="w-3.5 h-3.5" /> },
  'Software Engineering':     { color: 'text-teal-700',    bg: 'bg-teal-50',    border: 'border-teal-200',   icon: <Layers className="w-3.5 h-3.5" /> },
  'Social & Professional':    { color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',  icon: <Users className="w-3.5 h-3.5" /> },
  'Graphics & Visual Computing': { color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', icon: <Cpu className="w-3.5 h-3.5" /> },
  'Mobile Development':       { color: 'text-green-700',   bg: 'bg-green-50',   border: 'border-green-200',  icon: <Smartphone className="w-3.5 h-3.5" /> },
  'Modeling & Simulation':    { color: 'text-indigo-700',  bg: 'bg-indigo-50',  border: 'border-indigo-200', icon: <Activity className="w-3.5 h-3.5" /> },
  'Data Science':             { color: 'text-cyan-700',    bg: 'bg-cyan-50',    border: 'border-cyan-200',   icon: <Database className="w-3.5 h-3.5" /> },
  'Artificial Intelligence':  { color: 'text-fuchsia-700', bg: 'bg-fuchsia-50', border: 'border-fuchsia-200',icon: <BarChart2 className="w-3.5 h-3.5" /> },
};

const subjects = ['All', ...Object.keys(subjectMeta)];

const getFileMeta = (type: string) => {
  switch (type) {
    case 'pdf':  return { label: 'PDF',  color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200',   canPreview: true };
    case 'pptx': return { label: 'PPTX', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', canPreview: false };
    case 'docx': return { label: 'DOCX', color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200',   canPreview: false };
    case 'zip':  return { label: 'ZIP',  color: 'text-gray-600',   bg: 'bg-gray-50',   border: 'border-gray-200',   canPreview: false };
    default:     return { label: type.toUpperCase(), color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', canPreview: false };
  }
};

/* ─── File Browser ───────────────────────────────────────────────────────── */
const FileBrowser: React.FC<{
  module: Module;
  onClose: () => void;
  downloadedFiles: string[];
  onDownloadFile: (moduleId: string, file: CourseFile) => void;
  onPreviewFile: (file: CourseFile) => void;
}> = ({ module, onClose, downloadedFiles, onDownloadFile, onPreviewFile }) => {
  const groups = [
    { label: 'Documents & Notes', icon: '📄', files: module.files.filter(f => f.type === 'pdf') },
    { label: 'Presentations',     icon: '📊', files: module.files.filter(f => f.type === 'pptx') },
    { label: 'Guides & Templates',icon: '📝', files: module.files.filter(f => f.type === 'docx') },
    { label: 'Packages & Archives',icon: '📦', files: module.files.filter(f => f.type === 'zip') },
    { label: 'Other',             icon: '📎', files: module.files.filter(f => !['pdf','pptx','docx','zip'].includes(f.type)) },
  ].filter(g => g.files.length > 0);

  const meta = subjectMeta[module.subject];

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="bg-white w-full sm:rounded-2xl sm:max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-mono text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
                  {module.code}
                </span>
                {meta && (
                  <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded border ${meta.color} ${meta.bg} ${meta.border}`}>
                    {meta.icon} {module.subject}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-dark leading-tight">{module.title}</h2>
              <p className="text-gray-500 text-xs mt-1 line-clamp-2">{module.description}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full mt-0.5 flex-shrink-0">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Package className="w-3 h-3" /> {module.files.length} files</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-green-500" />
              {module.files.filter(f => downloadedFiles.includes(f.id)).length} downloaded
            </span>
          </div>
        </div>

        {/* File list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {groups.map(group => (
            <div key={group.label}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>{group.icon}</span> {group.label}
              </p>
              <div className="space-y-2">
                {group.files.map(file => {
                  const isDownloaded = downloadedFiles.includes(file.id);
                  const fm = getFileMeta(file.type);
                  return (
                    <div
                      key={file.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                        isDownloaded ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {/* Type badge */}
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${fm.color} ${fm.bg} ${fm.border} flex-shrink-0`}>
                        {fm.label}
                      </span>

                      {/* Name + size */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-dark truncate">{file.name}</p>
                        <p className="text-xs text-gray-400">{file.size}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* Preview — only for previewable types */}
                        {fm.canPreview && (
                          <button
                            onClick={() => onPreviewFile(file)}
                            title="Preview"
                            className="p-2 rounded-lg text-gray-500 hover:bg-white hover:text-primary hover:shadow-sm border border-transparent hover:border-gray-200 transition-all"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}

                        {/* Download / Downloaded */}
                        <button
                          onClick={() => onDownloadFile(module.id, file)}
                          title={isDownloaded ? 'Downloaded' : 'Download'}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            isDownloaded
                              ? 'bg-green-100 text-green-700 cursor-default'
                              : 'bg-primary text-white hover:bg-accent'
                          }`}
                        >
                          {isDownloaded
                            ? <><CheckCircle2 className="w-3.5 h-3.5" /> Saved</>
                            : <><Download className="w-3.5 h-3.5" /> Save</>}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

/* ─── File Preview Modal ─────────────────────────────────────────────────── */
const FilePreview: React.FC<{ file: CourseFile; onClose: () => void }> = ({ file, onClose }) => {
  const isPreviewable = getFileMeta(file.type).canPreview;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex flex-col"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className="flex flex-col h-full"
        onClick={e => e.stopPropagation()}
      >
        {/* Preview toolbar */}
        <div className="flex items-center justify-between bg-gray-900 text-white px-4 py-3 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Eye className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm font-medium truncate">{file.name}</span>
            <span className="text-xs text-gray-400">{file.size}</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={file.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Open in Tab
            </a>
            <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Preview area */}
        <div className="flex-1 bg-gray-800 overflow-hidden">
          {isPreviewable ? (
            <iframe
              src={file.url}
              className="w-full h-full border-0"
              title={file.name}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-white gap-4">
              <Package className="w-16 h-16 text-gray-500" />
              <p className="text-gray-300 text-sm">Preview not available for this file type.</p>
              <a
                href={file.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-accent"
              >
                <ExternalLink className="w-4 h-4" /> Open File
              </a>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

/* ─── Library Modal ──────────────────────────────────────────────────────── */
const LibraryModal: React.FC<{
  downloadedModules: DownloadedModule[];
  downloadedFiles: string[];
  onClose: () => void;
  onRemove: (id: string) => void;
  onOpenFile: (file: CourseFile) => void;
}> = ({ downloadedModules, downloadedFiles, onClose, onRemove, onOpenFile }) => {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="bg-white w-full sm:rounded-2xl sm:max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-dark flex items-center gap-2">
              <Library className="w-5 h-5 text-primary" />
              My Library
            </h2>
            <p className="text-gray-400 text-xs mt-0.5">
              {downloadedModules.length} module{downloadedModules.length !== 1 ? 's' : ''} · {downloadedFiles.length} file{downloadedFiles.length !== 1 ? 's' : ''} saved
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {downloadedModules.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-gray-300" />
              </div>
              <p className="font-semibold text-dark">Your library is empty</p>
              <p className="text-gray-400 text-sm mt-1">Download files from courses to save them here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {downloadedModules.map(module => {
                const isOpen = expanded === module.id;
                const savedFiles = module.files.filter(f => downloadedFiles.includes(f.id));
                const meta = subjectMeta[module.subject];

                return (
                  <div key={module.id} className="border border-gray-200 rounded-xl overflow-hidden">
                    {/* Module row */}
                    <div className="flex items-center gap-3 p-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-mono text-xs font-semibold text-primary">{module.code}</span>
                          {meta && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${meta.color} ${meta.bg} ${meta.border}`}>
                              {module.subject}
                            </span>
                          )}
                        </div>
                        <p className="font-semibold text-dark text-sm truncate">{module.title}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(module.downloadedAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                            {savedFiles.length} file{savedFiles.length !== 1 ? 's' : ''} saved
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setExpanded(isOpen ? null : module.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          {isOpen ? 'Hide' : 'Files'}
                        </button>
                        <button
                          onClick={() => onRemove(module.id)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Expandable file list */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden border-t border-gray-100"
                        >
                          <div className="px-4 py-3 bg-gray-50 space-y-2">
                            {savedFiles.length === 0 ? (
                              <p className="text-xs text-gray-400 text-center py-2">No files saved for this module.</p>
                            ) : (
                              savedFiles.map(file => {
                                const fm = getFileMeta(file.type);
                                return (
                                  <div key={file.id} className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 p-2.5">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border flex-shrink-0 ${fm.color} ${fm.bg} ${fm.border}`}>
                                      {fm.label}
                                    </span>
                                    <p className="text-xs font-medium text-dark flex-1 min-w-0 truncate">{file.name}</p>
                                    <p className="text-xs text-gray-400 flex-shrink-0">{file.size}</p>
                                    <button
                                      onClick={() => onOpenFile(file)}
                                      title="Open / Preview"
                                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-accent transition-colors"
                                    >
                                      {fm.canPreview ? <><Eye className="w-3 h-3" /> Preview</> : <><ExternalLink className="w-3 h-3" /> Open</>}
                                    </button>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

/* ─── Module Card ────────────────────────────────────────────────────────── */
const ModuleCard: React.FC<{
  module: Module;
  isDownloaded: boolean;
  downloadedCount: number;
  onBrowse: (m: Module) => void;
}> = ({ module, isDownloaded, downloadedCount, onBrowse }) => {
  const meta = subjectMeta[module.subject];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 hover:border-primary/40 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col"
    >
      {/* Top color strip */}
      <div className={`h-1 w-full ${meta?.bg ?? 'bg-gray-100'}`} />

      <div className="p-4 flex flex-col flex-1">
        {/* Code + subject */}
        <div className="flex items-center justify-between mb-3">
          <code className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
            {module.code}
          </code>
          {meta && (
            <span className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${meta.color} ${meta.bg} ${meta.border}`}>
              {meta.icon}
              <span className="hidden sm:inline">{module.subject}</span>
            </span>
          )}
        </div>

        {/* Title + desc */}
        <h3 className="font-bold text-dark text-base mb-1 leading-tight">{module.title}</h3>
        <p className="text-gray-500 text-xs flex-1 line-clamp-2 mb-4">{module.description}</p>

        {/* Stats row */}
        <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
          <span className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            {module.files.length} file{module.files.length !== 1 ? 's' : ''}
          </span>
          {isDownloaded && (
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle2 className="w-3 h-3" />
              {downloadedCount} saved
            </span>
          )}
        </div>

        {/* Action */}
        <button
          onClick={() => onBrowse(module)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-accent transition-colors"
        >
          <FolderOpen className="w-4 h-4" />
          Browse Files
          <ChevronRight className="w-3.5 h-3.5 ml-auto" />
        </button>
      </div>
    </motion.div>
  );
};

/* ─── Main Component ─────────────────────────────────────────────────────── */
export function LearningSection() {
  const [searchQuery, setSearchQuery]     = useState('');
  const [activeSubject, setActiveSubject] = useState('All');
  const [downloadedModules, setDownloadedModules] = useState<DownloadedModule[]>([]);
  const [downloadedFiles, setDownloadedFiles]     = useState<string[]>([]);
  const [showLibrary, setShowLibrary]   = useState(false);
  const [showFilters, setShowFilters]   = useState(false);
  const [showOfflineOnly, setShowOfflineOnly] = useState(false);
  const [selectedModule, setSelectedModule]   = useState<Module | null>(null);
  const [previewFile, setPreviewFile]         = useState<CourseFile | null>(null);
  const [downloadError, setDownloadError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setDownloadedModules(loadDownloadedModules());
    try {
      const saved = localStorage.getItem(DOWNLOADED_FILES_KEY);
      if (saved) setDownloadedFiles(JSON.parse(saved));
    } catch {}
    setLoading(false);
  }, []);

  const filteredModules = useMemo(() => {
    const downloadedIds = new Set(downloadedModules.map(m => m.id));
    return sampleModules.filter(m => {
      if (showOfflineOnly && !downloadedIds.has(m.id)) return false;
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || m.title.toLowerCase().includes(q) || m.code.toLowerCase().includes(q) || m.description.toLowerCase().includes(q);
      const matchSubject = activeSubject === 'All' || m.subject === activeSubject;
      return matchSearch && matchSubject;
    });
  }, [searchQuery, activeSubject, downloadedModules, showOfflineOnly]);

  const handleDownloadFile = async (moduleId: string, file: CourseFile) => {
    try {
      const res = await fetch(file.url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = file.name;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const updatedFiles = downloadedFiles.includes(file.id) ? downloadedFiles : [...downloadedFiles, file.id];
      setDownloadedFiles(updatedFiles);
      localStorage.setItem(DOWNLOADED_FILES_KEY, JSON.stringify(updatedFiles));

      if (!downloadedModules.find(m => m.id === moduleId)) {
        const module = sampleModules.find(m => m.id === moduleId);
        if (module) {
          const dm: DownloadedModule = { ...module, downloadedAt: new Date(), downloadedFiles: [file.id] };
          const updated = [...downloadedModules, dm];
          setDownloadedModules(updated);
          saveDownloadedModules(updated);
        }
      } else {
        // Update downloadedFiles list on existing module entry
        const updated = downloadedModules.map(m =>
          m.id === moduleId
            ? { ...m, downloadedFiles: Array.from(new Set([...(m.downloadedFiles || []), file.id])) }
            : m
        );
        setDownloadedModules(updated);
        saveDownloadedModules(updated);
      }
    } catch {
      setDownloadError(`Failed to save "${file.name}"`);
      setTimeout(() => setDownloadError(null), 3000);
    }
  };

  const handleRemoveModule = (id: string) => {
    if (!confirm('Remove this module from your library?')) return;
    const updated = downloadedModules.filter(m => m.id !== id);
    setDownloadedModules(updated);
    saveDownloadedModules(updated);
  };

  const handleClearAll = () => {
    if (!confirm('Clear all downloaded modules?')) return;
    setDownloadedModules([]);
    setDownloadedFiles([]);
    saveDownloadedModules([]);
    localStorage.removeItem(DOWNLOADED_FILES_KEY);
  };

  const handleOpenFile = (file: CourseFile) => {
    const fm = getFileMeta(file.type);
    if (fm.canPreview) {
      setShowLibrary(false);
      setPreviewFile(file);
    } else {
      window.open(file.url, '_blank', 'noreferrer');
    }
  };

  const downloadedCount = (moduleId: string) =>
    sampleModules.find(m => m.id === moduleId)?.files.filter(f => downloadedFiles.includes(f.id)).length ?? 0;

  if (loading) {
    return (
      <section className="py-16 bg-secondary/10 min-h-[calc(100vh-80px)] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </section>
    );
  }

  return (
    <section className="py-12 bg-secondary/10 min-h-[calc(100vh-80px)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Offline banner */}
        {!navigator.onLine && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
            <CloudOff className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div>
              <p className="text-blue-800 font-semibold text-sm">Offline Mode</p>
              <p className="text-blue-600 text-xs">You need internet to access new materials.</p>
            </div>
          </div>
        )}

        {/* Error toast */}
        <AnimatePresence>
          {downloadError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-3"
            >
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-sm">{downloadError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-dark flex items-center gap-2">
                <Terminal className="w-6 h-6 text-primary" />
                Learning Library
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                {sampleModules.length} courses · Computer Science Program
              </p>
            </div>
            {/* Library button */}
            <button
              onClick={() => setShowLibrary(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-dark hover:shadow-md hover:border-primary/30 transition-all"
            >
              <Library className="w-4 h-4 text-primary" />
              <span className="hidden sm:inline">My Library</span>
              {downloadedModules.length > 0 && (
                <span className="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {downloadedModules.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search + filter row */}
        <div className="flex items-center gap-2 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by code or title…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all ${
              showFilters || showOfflineOnly
                ? 'bg-primary text-white border-primary'
                : 'bg-white border-gray-200 text-dark hover:border-primary/40'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>

        {/* Filter panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-5"
            >
              <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOfflineOnly}
                    onChange={e => setShowOfflineOnly(e.target.checked)}
                    className="w-4 h-4 accent-primary rounded"
                  />
                  <span className="text-sm text-dark">Downloaded only</span>
                </label>
                <div className="w-px h-5 bg-gray-200" />
                <span className="text-sm text-gray-400 flex items-center gap-1">
                  <HardDrive className="w-3.5 h-3.5" />
                  {downloadedModules.length} downloaded
                </span>
                {downloadedModules.length > 0 && (
                  <button onClick={handleClearAll} className="text-sm text-red-500 hover:text-red-700 ml-auto">
                    Clear all
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Subject pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {subjects.map(subject => (
            <button
              key={subject}
              onClick={() => setActiveSubject(subject)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeSubject === subject
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-primary/40 hover:text-primary'
              }`}
            >
              {subject === 'All' ? 'All Courses' : subject}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className="text-xs text-gray-400 mb-4">
          {filteredModules.length} course{filteredModules.length !== 1 ? 's' : ''}
          {searchQuery ? ` matching "${searchQuery}"` : ''}
        </p>

        {/* Module grid */}
        {filteredModules.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredModules.map(module => (
              <ModuleCard
                key={module.id}
                module={module}
                isDownloaded={downloadedModules.some(m => m.id === module.id)}
                downloadedCount={downloadedCount(module.id)}
                onBrowse={setSelectedModule}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search className="w-7 h-7 text-gray-300" />
            </div>
            <p className="font-semibold text-dark">No courses found</p>
            <p className="text-gray-400 text-sm mt-1">
              {showOfflineOnly ? "No downloaded modules yet." : `Try a different search or filter.`}
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showLibrary && (
          <LibraryModal
            downloadedModules={downloadedModules}
            downloadedFiles={downloadedFiles}
            onClose={() => setShowLibrary(false)}
            onRemove={handleRemoveModule}
            onOpenFile={handleOpenFile}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedModule && (
          <FileBrowser
            module={selectedModule}
            onClose={() => setSelectedModule(null)}
            downloadedFiles={downloadedFiles}
            onDownloadFile={handleDownloadFile}
            onPreviewFile={file => { setSelectedModule(null); setPreviewFile(file); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {previewFile && (
          <FilePreview
            file={previewFile}
            onClose={() => setPreviewFile(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
