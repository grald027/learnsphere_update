import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { upload } from '@vercel/blob/client';
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
  Upload,
  Plus,
  Trash,
  Cloud
} from 'lucide-react';

// Define file type
interface CourseFile {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadDate: string;
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

// The 8 Courses
const sampleModules: Module[] = [
  {
    id: 'CS321',
    code: 'CS321',
    title: 'Programming Languages',
    subject: 'Programming Languages',
    description: 'Study of programming language paradigms, design principles, and implementation strategies.',
    files: []
  },
  {
    id: 'CS322',
    code: 'CS322',
    title: 'Software Engineering 1',
    subject: 'Software Engineering',
    description: 'Software development lifecycle, requirements engineering, design patterns, project management.',
    files: []
  },
  {
    id: 'CS323',
    code: 'CS323',
    title: 'Social Issues and Professional Practice',
    subject: 'Social & Professional',
    description: 'Ethical and social issues in computing, professional responsibilities, legal aspects.',
    files: []
  },
  {
    id: 'CS324',
    code: 'CS324',
    title: 'CS Elective 2 (Graphics and Visual Computing)',
    subject: 'Graphics & Visual Computing',
    description: 'Computer graphics fundamentals, 2D/3D rendering, visual design, animation.',
    files: []
  },
  {
    id: 'CS325',
    code: 'CS325',
    title: 'Mobile Computing',
    subject: 'Mobile Development',
    description: 'Mobile app development for iOS and Android, UI/UX design, cross-platform solutions.',
    files: []
  },
  {
    id: 'CS326',
    code: 'CS326',
    title: 'Modeling and Simulation',
    subject: 'Modeling & Simulation',
    description: 'System modeling, discrete and continuous simulation, statistical analysis.',
    files: []
  },
  {
    id: 'CS327',
    code: 'CS327',
    title: 'Data Mining Concepts and Techniques',
    subject: 'Data Science',
    description: 'Data preprocessing, classification, clustering, association rules, pattern discovery.',
    files: []
  },
  {
    id: 'CS328',
    code: 'CS328',
    title: 'Machine Learning',
    subject: 'Artificial Intelligence',
    description: 'Supervised and unsupervised learning, neural networks, deep learning, model evaluation.',
    files: []
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

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * Client-side upload: file goes DIRECTLY from the browser to Vercel Blob.
 * The serverless function (/api/upload) only issues a short-lived token.
 * This completely bypasses Vercel's 4.5 MB serverless body limit.
 */
const uploadFileToServer = async (moduleId: string, file: File): Promise<CourseFile> => {
  const blobPath = `${moduleId}/${Date.now()}-${file.name}`;

  const blob = await upload(blobPath, file, {
    access: 'public',
    handleUploadUrl: '/api/upload',   // token-exchange endpoint
    clientPayload: moduleId,          // passed through to onBeforeGenerateToken
  });

  return {
    id: blob.url,
    name: file.name,
    size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
    type: file.type,
    uploadDate: new Date().toLocaleDateString(),
    url: blob.url,
  };
};

const deleteFileFromServer = async (fileUrl: string): Promise<void> => {
  const response = await fetch(`/api/delete?url=${encodeURIComponent(fileUrl)}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Delete failed');
  }
};

const loadFilesFromServer = async (moduleId: string): Promise<CourseFile[]> => {
  const response = await fetch(`/api/list-files?moduleId=${moduleId}`);

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return data.files || [];
};

// ─── File Upload Modal ────────────────────────────────────────────────────────

const FileUploadModal = ({
  module,
  onClose,
  onUploadComplete,
}: {
  module: Module;
  onClose: () => void;
  onUploadComplete: (moduleId: string, file: CourseFile) => void;
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 100 * 1024 * 1024) {
        setError('File size exceeds 100 MB limit');
        return;
      }
      setError(null);
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);

    // Fake progress bar — real progress comes from the blob SDK internally
    const interval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 8, 90));
    }, 200);

    try {
      const uploadedFile = await uploadFileToServer(module.id, selectedFile);

      clearInterval(interval);
      setUploadProgress(100);

      await new Promise((resolve) => setTimeout(resolve, 300));

      onUploadComplete(module.id, uploadedFile);
      setSelectedFile(null);
      onClose();
    } catch (err) {
      clearInterval(interval);
      console.error('Upload error:', err);
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-dark flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Upload to {module.code}
          </h2>
          <p className="text-gray text-sm mt-1">Files will be available to all users</p>
        </div>

        <div className="p-6">
          <label className="block w-full cursor-pointer">
            <input
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.docx,.pptx,.txt,.md,.zip,.jpg,.png"
            />
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
              {selectedFile ? (
                <>
                  <FileText className="w-10 h-10 text-primary mx-auto mb-2" />
                  <p className="text-sm font-medium text-dark">{selectedFile.name}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                    }}
                    className="mt-2 text-xs text-red-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                </>
              ) : (
                <>
                  <Plus className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Click to select a file</p>
                  <p className="text-xs text-gray-400 mt-1">
                    PDF, DOCX, PPTX, ZIP, Images (Max 100 MB)
                  </p>
                  <p className="text-xs text-blue-500 mt-2">
                    Shared cloud storage — visible to all users
                  </p>
                </>
              )}
            </div>
          </label>

          {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}

          {uploading && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Uploading to cloud…</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary rounded-full h-2 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-accent disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {uploading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Cloud className="w-4 h-4" />
            )}
            Upload to Cloud
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── File Browser Modal ───────────────────────────────────────────────────────

const FileBrowser = ({
  module,
  onClose,
  downloadedFiles,
  onDownloadFile,
  onUploadFile,
  onDeleteFile,
}: {
  module: Module;
  onClose: () => void;
  downloadedFiles: string[];
  onDownloadFile: (moduleId: string, file: CourseFile) => void;
  onUploadFile: (module: Module) => void;
  onDeleteFile: (moduleId: string, fileId: string, fileUrl: string) => void;
}) => {
  const files = module.files || [];
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (file: CourseFile) => {
    if (
      confirm(
        'Are you sure you want to delete this file? This action cannot be undone and will affect all users.'
      )
    ) {
      setDeleting(file.id);
      await onDeleteFile(module.id, file.id, file.url);
      setDeleting(null);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold text-dark flex items-center gap-2">
              <FolderOpen className="w-6 h-6 text-primary" />
              {module.code}: {module.title}
            </h2>
            <p className="text-gray text-sm mt-1">
              Shared cloud storage — visible to all users
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray" />
          </button>
        </div>

        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <p className="text-sm text-gray-600">{module.description}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-dark">Course Materials ({files.length})</h3>
            <button
              onClick={() => onUploadFile(module)}
              className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 flex items-center gap-1"
            >
              <Upload className="w-3 h-3" />
              Upload File
            </button>
          </div>

          {files.length > 0 ? (
            <div className="space-y-2">
              {files.map((file) => {
                const isDownloaded = downloadedFiles.includes(file.id);
                return (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:shadow-sm"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-dark truncate">{file.name}</p>
                        <p className="text-xs text-gray-400">
                          {file.size} • Uploaded: {file.uploadDate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => onDownloadFile(module.id, file)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 ${
                          isDownloaded
                            ? 'bg-green-100 text-green-600'
                            : 'bg-primary text-white hover:bg-accent'
                        }`}
                      >
                        {isDownloaded ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        {isDownloaded ? 'Downloaded' : 'Download'}
                      </button>
                      <button
                        onClick={() => handleDelete(file)}
                        disabled={deleting === file.id}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                        title="Delete file (affects all users)"
                      >
                        {deleting === file.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No materials uploaded yet</p>
              <button
                onClick={() => onUploadFile(module)}
                className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload First Material
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export function LearningSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubject, setActiveSubject] = useState('All');
  const [downloadedModules, setDownloadedModules] = useState<DownloadedModule[]>([]);
  const [downloadedFiles, setDownloadedFiles] = useState<string[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showOfflineOnly, setShowOfflineOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        const modulesWithFiles = await Promise.all(
          sampleModules.map(async (module) => {
            const serverFiles = await loadFilesFromServer(module.id);
            return { ...module, files: serverFiles };
          })
        );
        setModules(modulesWithFiles);

        const saved = loadDownloadedModules();
        setDownloadedModules(saved);

        const savedDownloadedFiles = localStorage.getItem(DOWNLOADED_FILES_KEY);
        if (savedDownloadedFiles) {
          setDownloadedFiles(JSON.parse(savedDownloadedFiles));
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
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

  // Called after a successful upload — refreshes the file list from Vercel Blob
  const handleUploadFile = async (moduleId: string, _file: CourseFile) => {
    const updatedFiles = await loadFilesFromServer(moduleId);
    setModules((prev) =>
      prev.map((m) => (m.id === moduleId ? { ...m, files: updatedFiles } : m))
    );
  };

  const handleDeleteFile = async (moduleId: string, _fileId: string, fileUrl: string) => {
    try {
      await deleteFileFromServer(fileUrl);
      const updatedFiles = await loadFilesFromServer(moduleId);
      setModules((prev) =>
        prev.map((m) => (m.id === moduleId ? { ...m, files: updatedFiles } : m))
      );
    } catch (error) {
      setDownloadError('Failed to delete file');
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

  const handleOpenUploadModal = (module: Module) => {
    setSelectedModule(module);
    setShowUploadModal(true);
  };

  const isModuleDownloaded = (id: string) => downloadedModules.some((m) => m.id === id);

  if (loading) {
    return (
      <div className="py-16 bg-secondary/10 min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray">Loading course materials…</p>
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
                You need internet to access shared cloud files.
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
          <p className="text-lg text-gray">Shared cloud storage — Files visible to all users</p>
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
              <div className="flex items-center gap-2 text-sm text-gray">
                <Cloud className="w-4 h-4" />
                <span>Vercel Blob Storage (Shared)</span>
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

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewFiles(module)}
                        className="flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 bg-primary text-white hover:bg-accent"
                      >
                        <FolderOpen className="w-4 h-4" />
                        Browse Files
                      </button>
                      <button
                        onClick={() => handleOpenUploadModal(module)}
                        className="py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center bg-gray-100 text-gray-700 hover:bg-gray-200"
                        title="Upload materials"
                      >
                        <Upload className="w-4 h-4" />
                      </button>
                    </div>

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

      {/* ── My Library Modal ── */}
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

      {/* ── File Browser ── */}
      <AnimatePresence>
        {selectedModule && !showUploadModal && (
          <FileBrowser
            module={selectedModule}
            onClose={() => setSelectedModule(null)}
            downloadedFiles={downloadedFiles}
            onDownloadFile={handleDownloadFile}
            onUploadFile={handleOpenUploadModal}
            onDeleteFile={handleDeleteFile}
          />
        )}
      </AnimatePresence>

      {/* ── Upload Modal ── */}
      <AnimatePresence>
        {showUploadModal && selectedModule && (
          <FileUploadModal
            module={selectedModule}
            onClose={() => {
              setShowUploadModal(false);
              setSelectedModule(null);
            }}
            onUploadComplete={handleUploadFile}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
