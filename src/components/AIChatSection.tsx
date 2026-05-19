import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist';
import {
  Send,
  Bot,
  User,
  Loader2,
  Wifi,
  WifiOff,
  AlertCircle,
  Trash2,
  Download,
  Sparkles,
  Menu,
  Paperclip,
  FileText,
  X,
  Plus,
  ChevronLeft,
  Clock,
  MessageSquare,
  Zap,
  BookOpen,
  ExternalLink,
  Search,
  CheckCircle,
  File,
  FileUp,
  Database,
  Copy,
  Check,
} from 'lucide-react';

// ─── PDF.js worker ──────────────────────────────────────────────────────────
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface Source {
  name: string;
  url: string;
  courseCode: string;
  type: string;
  verified: boolean;
}

interface Message {
  id: string;
  type: 'user' | 'ai';
  text: string;
  time: string;
  timestamp?: number;
  sources?: Source[];
  fileAnalysis?: {
    fileName: string;
    fileType: string;
    summary: string;
    keyPoints: string[];
    pageCount?: number;
    slideCount?: number;
  };
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  lastModified: number;
}

interface PendingFile {
  file: File;
  name: string;
  size: number;
  type: string;
}

interface FileAnalysisResult {
  fileName: string;
  fileType: string;
  fullText: string;
  summary: string;
  keyPoints: string[];
  pageCount?: number;
  slideCount?: number;
}

/* ─── Config ─────────────────────────────────────────────────────────────── */
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = (import.meta as any).env?.VITE_GROQ_API_KEY || '';
const isAPIKeyConfigured = GROQ_API_KEY && GROQ_API_KEY !== 'undefined' && GROQ_API_KEY !== '';

/* ─── Course keyword map ─────────────────────────────────────────────────── */
const COURSE_KEYWORDS: Record<string, string[]> = {
  CS321: ['programming language', 'paradigm', 'functional', 'prolog', 'haskell', 'lambda', 'type system', 'syntax', 'semantics', 'compiler', 'interpreter'],
  CS322: ['software engineering', 'sdlc', 'agile', 'scrum', 'design pattern', 'uml', 'requirements', 'testing', 'waterfall', 'project management'],
  CS323: ['ethics', 'social issue', 'professional practice', 'intellectual property', 'privacy', 'copyright', 'cybercrime', 'legal', 'acm code'],
  CS324: ['graphics', 'visual computing', 'rendering', 'opengl', '3d', 'animation', 'rasterization', 'shading', 'texture', 'polygon', 'ray tracing'],
  CS325: ['mobile', 'android', 'ios', 'flutter', 'react native', 'mobile development', 'mobile app', 'smartphone', 'tablet'],
  CS326: ['modeling', 'simulation', 'discrete event', 'monte carlo', 'queuing', 'stochastic', 'continuous simulation', 'system dynamics'],
  CS327: ['data mining', 'clustering', 'classification', 'association rule', 'apriori', 'decision tree', 'naive bayes', 'k-means', 'pattern discovery'],
  CS328: ['machine learning', 'neural network', 'deep learning', 'gradient descent', 'backpropagation', 'supervised', 'unsupervised', 'reinforcement learning', 'cnn', 'rnn', 'transformer'],
};

/* ─── Verified academic sources ─────────────────────────────────────────── */
const VERIFIED_ACADEMIC_SOURCES: Record<string, Source[]> = {
  'data mining': [
    { name: 'Data Mining: Concepts and Techniques', url: 'https://www.sciencedirect.com/book/9780123814791', courseCode: 'CS327', type: 'book', verified: true },
    { name: 'Introduction to Data Mining', url: 'https://www-users.cse.umn.edu/~kumar001/dmbook', courseCode: 'CS327', type: 'textbook', verified: true },
    { name: 'UC Irvine ML Repository', url: 'https://archive.ics.uci.edu', courseCode: 'CS327', type: 'dataset', verified: true },
  ],
  'machine learning': [
    { name: 'Stanford CS229', url: 'https://cs229.stanford.edu', courseCode: 'CS328', type: 'course', verified: true },
    { name: 'Deep Learning Book', url: 'https://www.deeplearningbook.org', courseCode: 'CS328', type: 'book', verified: true },
    { name: 'Google ML Crash Course', url: 'https://developers.google.com/machine-learning/crash-course', courseCode: 'CS328', type: 'tutorial', verified: true },
  ],
  general: [
    { name: 'MIT OpenCourseWare', url: 'https://ocw.mit.edu', courseCode: 'CS', type: 'course', verified: true },
    { name: 'arXiv CS', url: 'https://arxiv.org/archive/cs', courseCode: 'CS', type: 'papers', verified: true },
  ],
};

/* ─── Helper Functions ───────────────────────────────────────────────────── */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function detectRelevantCourses(message: string): string[] {
  const lower = message.toLowerCase();
  const detected: string[] = [];
  for (const [code, keywords] of Object.entries(COURSE_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
      detected.push(code);
    }
  }
  return detected.length > 0 ? detected : Object.keys(COURSE_KEYWORDS);
}

function getVerifiedSourcesForTopic(userMessage: string, detectedCourses: string[]): Source[] {
  const lowerMessage = userMessage.toLowerCase();
  const sources: Source[] = [];

  for (const [topic, topicSources] of Object.entries(VERIFIED_ACADEMIC_SOURCES)) {
    if (lowerMessage.includes(topic)) {
      sources.push(...topicSources);
    }
  }

  if (sources.length < 2) {
    sources.push(...VERIFIED_ACADEMIC_SOURCES.general);
  }

  const unique = Array.from(new Map(sources.map((s) => [s.url, s])).values());
  return unique.slice(0, 5);
}

// Clean and format AI response text
function formatAIResponse(text: string): string {
  // First, ensure proper spacing after periods
  let formatted = text.replace(/\.([A-Z])/g, '. $1');
  
  // Fix numbered lists - ensure proper spacing after numbers
  formatted = formatted.replace(/(\d+)\.([A-Z])/g, '$1. $2');
  formatted = formatted.replace(/(\d+)\.\s*/g, '\n$1. ');
  
  // Ensure bullet points have proper spacing
  formatted = formatted.replace(/[•\-]\s*/g, '\n• ');
  
  // Add line breaks before numbered items for better readability
  formatted = formatted.replace(/(\d+\.\s+[A-Z])/g, '\n\n$1');
  
  // Add line breaks before section headers
  formatted = formatted.replace(/([A-Z][a-z]+:)/g, '\n\n$1');
  
  // Remove excessive line breaks
  formatted = formatted.replace(/\n{3,}/g, '\n\n');
  
  // Add spacing after sections
  formatted = formatted.replace(/(\d+\.\s+[^\n]+\n)/g, '$1\n');
  
  // Ensure proper spacing between list items
  formatted = formatted.replace(/\n•/g, '\n  •');
  
  // Clean up spaces
  formatted = formatted.trim();
  
  return formatted;
}

/* ─── File Analysis Functions ────────────────────────────────────────────── */
async function generateFileSummary(
  content: string,
  fileName: string,
  fileType: string
): Promise<{ summary: string; keyPoints: string[] }> {
  if (!isAPIKeyConfigured || content.length < 100) {
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 20);
    const summary = sentences.slice(0, 2).join('. ') + (sentences.length > 2 ? '.' : '');
    const keyPoints = sentences.slice(0, 4).map((s) => s.trim().substring(0, 100));
    return {
      summary: summary || `This ${fileType.toUpperCase()} file contains information.`,
      keyPoints: keyPoints.length ? keyPoints : ['Content analysis requires API configuration.'],
    };
  }

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are a file analysis assistant. Analyze the provided ${fileType.toUpperCase()} file content and return a JSON object with:
1. "summary": A concise 2-3 sentence summary
2. "keyPoints": An array of 3-5 key points

Format your response as valid JSON only.`,
          },
          {
            role: 'user',
            content: `File: ${fileName}\n\nContent:\n${content.substring(0, 6000)}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) throw new Error('API request failed');

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    let parsed;
    try {
      parsed = JSON.parse(aiResponse);
    } catch {
      const lines = aiResponse.split('\n').filter((l) => l.trim());
      return {
        summary: lines[0] || 'Unable to generate summary.',
        keyPoints: lines.slice(1, 5).map((l) => l.replace(/^\d+\.\s*/, '').substring(0, 100)),
      };
    }

    return {
      summary: parsed.summary || 'Unable to generate summary.',
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.slice(0, 5) : ['No key points extracted.'],
    };
  } catch (error) {
    console.error('Summary generation error:', error);
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 20);
    const summary = sentences.slice(0, 2).join('. ') + (sentences.length > 2 ? '.' : '');
    const keyPoints = sentences.slice(0, 4).map((s) => s.trim().substring(0, 100));
    return {
      summary: summary || 'Content analysis temporarily unavailable.',
      keyPoints: keyPoints.length ? keyPoints : ['Please try again.'],
    };
  }
}

async function analyzePDF(file: File): Promise<FileAnalysisResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pageCount = pdf.numPages;
    const maxPages = Math.min(pageCount, 10);
    const fullTexts: string[] = [];

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      if (pageText.trim()) {
        fullTexts.push(pageText);
      }
    }

    const fullText = fullTexts.join('\n\n').substring(0, 8000);
    const analysis = await generateFileSummary(fullText, file.name, 'pdf');

    return {
      fileName: file.name,
      fileType: 'pdf',
      fullText,
      summary: analysis.summary,
      keyPoints: analysis.keyPoints,
      pageCount,
    };
  } catch (error) {
    throw new Error(`Failed to analyze PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function analyzeTXT(file: File): Promise<FileAnalysisResult> {
  try {
    const text = await file.text();
    const fullText = text.substring(0, 8000);
    const analysis = await generateFileSummary(fullText, file.name, 'txt');

    return {
      fileName: file.name,
      fileType: 'txt',
      fullText,
      summary: analysis.summary,
      keyPoints: analysis.keyPoints,
    };
  } catch (error) {
    throw new Error(`Failed to analyze text file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function analyzePPTX(file: File): Promise<FileAnalysisResult> {
  try {
    const fileName = file.name;
    const fileSize = file.size;

    let extractedText = '';
    try {
      const text = await file.text();
      const textMatches = text.match(/>([^<]{20,})</g);
      if (textMatches) {
        extractedText = textMatches.map((m) => m.slice(1, -1)).join(' ').substring(0, 4000);
      }
    } catch {
      extractedText = '';
    }

    const fullText = extractedText || `[PowerPoint file: ${fileName}] - Size: ${formatFileSize(fileSize)}.`;
    const analysis = await generateFileSummary(fullText, file.name, 'pptx');
    const estimatedSlides = Math.max(1, Math.floor(fileSize / 50000));

    return {
      fileName: file.name,
      fileType: 'pptx',
      fullText,
      summary: analysis.summary,
      keyPoints: analysis.keyPoints,
      slideCount: estimatedSlides,
    };
  } catch (error) {
    throw new Error(`Failed to analyze PowerPoint file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function analyzeFile(file: File): Promise<FileAnalysisResult> {
  const fileType = file.name.split('.').pop()?.toLowerCase() || '';

  switch (fileType) {
    case 'pdf':
      return await analyzePDF(file);
    case 'txt':
      return await analyzeTXT(file);
    case 'pptx':
    case 'ppt':
      return await analyzePPTX(file);
    default:
      throw new Error(`Unsupported file type: ${fileType}. Please upload PDF, TXT, or PPTX files.`);
  }
}

async function buildRAGContext(userMessage: string): Promise<{ contextBlock: string; sources: Source[] }> {
  const relevantCourses = detectRelevantCourses(userMessage);
  const sources = getVerifiedSourcesForTopic(userMessage, relevantCourses);
  return { contextBlock: '', sources };
}

/* ─── API Call ───────────────────────────────────────────────────────────── */
async function callGroqAPI(
  userMessage: string,
  chatHistory: Message[],
  ragContext: string,
  ragSources: Source[],
  fileAnalysis?: FileAnalysisResult
): Promise<{ text: string; sources: Source[] }> {
  const sourcesList = ragSources.map((s, i) => `${i + 1}. [${s.name}](${s.url})`).join('\n');

  let fileContext = '';
  let hasFile = false;
  
  if (fileAnalysis) {
    hasFile = true;
    fileContext = `
**UPLOADED FILE CONTENT:**
- File: ${fileAnalysis.fileName}
- Type: ${fileAnalysis.fileType.toUpperCase()}
${fileAnalysis.pageCount ? `- Pages: ${fileAnalysis.pageCount}` : ''}
${fileAnalysis.slideCount ? `- Slides: ${fileAnalysis.slideCount}` : ''}
- Key Points: ${fileAnalysis.keyPoints.join(', ')}
- Full Text Content:
${fileAnalysis.fullText.substring(0, 3000)}`;
  }

  // Determine if this is a casual conversation
  const isCasualQuestion = (msg: string): boolean => {
    const casualPatterns = ['hello', 'hi', 'hey', 'thanks', 'thank you', 'how are you', 'what can you do', 'help'];
    return casualPatterns.some(p => msg.toLowerCase().includes(p));
  };

  const needsSources = !isCasualQuestion(userMessage) && !hasFile;
  const isFileOnlyQuestion = hasFile && (userMessage.length < 30 || userMessage.includes('analyze') || userMessage.includes('summarize') || !userMessage.trim());

  let systemPrompt = '';

  if (hasFile) {
    if (isFileOnlyQuestion) {
      // STRICT: Only analyze the file, no external sources - with clean formatting
      systemPrompt = `You are Sphere, an academic assistant.

**FILE TO ANALYZE:**
${fileContext}

**CRITICAL RULES:**
1. DO NOT cite any external sources - ONLY use the file content above
2. DO NOT add references or bibliographies
3. DO NOT use phrases like "As seen in the file", "According to the presentation"
4. Format your response with clear structure:
   - Use numbered sections for different topics
   - Use bullet points for lists
   - Add line breaks between sections
   - Keep paragraphs concise
5. Be specific and reference actual content from the file
6. Use clean, professional formatting with proper spacing

**FORMAT EXAMPLE:**
1. Introduction
   The presentation covers three main topics in computer vision.

2. Key Topics
   • Image classification using CNNs (94% accuracy)
   • Natural language processing for sentiment analysis
   • Predictive modeling for healthcare applications

3. Conclusion
   The document emphasizes practical applications and real-world implementations.

**DO NOT USE:** "As seen in", "According to", "The file shows" - just state facts directly.`;
    } else {
      // File + specific question - prioritize file with clean formatting
      systemPrompt = `You are Sphere, an academic assistant.

**UPLOADED FILE (Primary source):**
${fileContext}

**INSTRUCTIONS:**
1. Answer primarily using the uploaded file content
2. Keep responses direct and factual
3. Format your response with clean structure:
   - Use numbered sections when listing multiple points
   - Use bullet points for features or lists
   - Add line breaks between different topics
   - Keep paragraphs short (2-3 sentences)
4. No citations or references unless absolutely necessary

**FORMAT:** Clear, well-structured answers focusing on the file's actual content.`;
    }
  } else if (needsSources) {
    // Academic question with sources and clean formatting
    systemPrompt = `You are Sphere, an academic CS assistant.

**VERIFIED SOURCES:**
${sourcesList || 'No specific sources provided'}

**RULES:**
1. Include 1-2 inline citations where relevant
2. Use format: [Source Name](URL)
3. Format your response with:
   - Numbered sections for main topics
   - Bullet points for lists
   - Proper line breaks between sections
   - Clean, professional spacing
4. DO NOT add a "References" section
5. Write naturally without repetitive phrases

**FORMAT EXAMPLE:**
1. Introduction
   Context about the topic.

2. Key Concepts
   • First concept with explanation
   • Second concept with [citation](url)

3. Summary
   Concluding thoughts.`;
  } else {
    // Casual conversation with clean formatting
    systemPrompt = `You are Sphere, an academic CS assistant.

**RULES:**
1. Do NOT include any citations or references
2. Be conversational and helpful
3. Format responses cleanly:
   - Use bullet points for lists when appropriate
   - Keep paragraphs short
   - Add line breaks for readability
4. Answer naturally without markdown or special formatting`;
  }

  const conversationMessages = [
    { role: 'system', content: systemPrompt },
    ...chatHistory.slice(-6).map((m) => ({
      role: m.type === 'user' ? 'user' : 'assistant',
      content: m.text,
    })),
  ];

  const finalUserMessage = userMessage || (fileAnalysis ? 'Please analyze this file.' : 'What would you like to know?');
  conversationMessages.push({ role: 'user', content: finalUserMessage });

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: conversationMessages,
        temperature: hasFile ? 0.2 : 0.3,
        max_tokens: hasFile ? 800 : 1000,
      }),
    });

    if (!response.ok) throw new Error('API Error');

    const data = await response.json();
    let rawText = data.choices[0].message.content;
    
    // Clean up repetitive phrases
    const cleanupPatterns = [
      /As seen in the uploaded file[,:]?\s*/gi,
      /As seen in the file[,:]?\s*/gi,
      /According to the (file|presentation|document|uploaded file)[,:]?\s*/gi,
      /The (file|presentation|document) (shows|indicates|states|mentions|provides)[,:]?\s*/gi,
      /As noted in the (file|presentation)[,:]?\s*/gi,
      /As discussed in the (file|presentation)[,:]?\s*/gi,
      /Looking at the (file|presentation)[,:]?\s*/gi,
      /From the (file|presentation)[,:]?\s*/gi,
    ];
    
    for (const pattern of cleanupPatterns) {
      rawText = rawText.replace(pattern, '');
    }
    
    // Apply clean formatting
    rawText = formatAIResponse(rawText);
    
    // Remove markdown bold/italic
    rawText = rawText.replace(/\*\*/g, '');
    rawText = rawText.replace(/\n{3,}/g, '\n\n');
    rawText = rawText.trim();

    // Only extract sources for non-casual, non-file responses
    let finalSources: Source[] = [];
    
    if (needsSources && !hasFile) {
      const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
      const citedSources: Source[] = [];
      let match;

      while ((match = linkRegex.exec(rawText)) !== null) {
        const matchingSource = ragSources.find((s) => s.url === match[2] || s.name === match[1]);
        if (matchingSource && matchingSource.verified) {
          if (!citedSources.find((s) => s.url === matchingSource.url)) {
            citedSources.push(matchingSource);
          }
        }
      }

      finalSources = citedSources.slice(0, 3);
      
      // Clean references section
      rawText = rawText.replace(/##\s*References[\s\S]*$/i, '').replace(/References:[\s\S]*$/i, '').trim();
    }

    return { text: rawText, sources: finalSources };
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
}

/* ─── Components ─────────────────────────────────────────────────────────── */
const RenderTextWithLinks: React.FC<{ text: string }> = ({ text }) => {
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  // Split text into paragraphs and format with proper spacing
  const paragraphs = text.split('\n\n');
  
  const formattedParagraphs = paragraphs.map((paragraph, pIdx) => {
    // Handle bullet points
    if (paragraph.includes('•') || paragraph.match(/^\d+\./)) {
      const lines = paragraph.split('\n');
      return (
        <div key={pIdx} className="space-y-1">
          {lines.map((line, lIdx) => {
            if (line.trim().startsWith('•')) {
              return <div key={lIdx} className="flex gap-2 ml-2">{line}</div>;
            }
            if (line.match(/^\d+\./)) {
              return <div key={lIdx} className="mt-2 font-medium">{line}</div>;
            }
            return <div key={lIdx}>{line}</div>;
          })}
        </div>
      );
    }
    
    // Regular paragraph
    if (paragraph.trim()) {
      return <p key={pIdx} className="mb-3">{paragraph}</p>;
    }
    return null;
  });

  // Process links within the formatted content
  const processLinks = (content: string) => {
    const linkParts: React.ReactNode[] = [];
    let lastIdx = 0;
    let linkMatch;
    const linkRegexLocal = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
    
    while ((linkMatch = linkRegexLocal.exec(content)) !== null) {
      if (linkMatch.index > lastIdx) {
        linkParts.push(<span key={lastIdx}>{content.slice(lastIdx, linkMatch.index)}</span>);
      }
      linkParts.push(
        <a
          key={linkMatch.index}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 text-primary underline underline-offset-2 hover:text-accent font-medium"
        >
          {linkMatch[1]}
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      );
      lastIdx = linkMatch.index + linkMatch[0].length;
    }
    
    if (lastIdx < content.length) {
      linkParts.push(<span key={lastIdx}>{content.slice(lastIdx)}</span>);
    }
    
    return linkParts;
  };

  // Rebuild the content with proper spacing
  return (
    <div className="space-y-2 leading-relaxed">
      {paragraphs.map((paragraph, idx) => {
        if (!paragraph.trim()) return null;
        
        // Check if it's a numbered section
        if (paragraph.match(/^\d+\./)) {
          const lines = paragraph.split('\n');
          return (
            <div key={idx} className="mt-3 first:mt-0">
              {lines.map((line, lineIdx) => {
                if (line.match(/^\d+\./)) {
                  return (
                    <div key={lineIdx} className="font-semibold text-gray-800 mt-2 first:mt-0">
                      {processLinks(line)}
                    </div>
                  );
                }
                if (line.trim().startsWith('•')) {
                  return (
                    <div key={lineIdx} className="flex gap-2 ml-4 text-gray-700">
                      <span className="text-primary">•</span>
                      <span>{processLinks(line.substring(1))}</span>
                    </div>
                  );
                }
                if (line.trim()) {
                  return (
                    <div key={lineIdx} className="ml-2 text-gray-700">
                      {processLinks(line)}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          );
        }
        
        // Regular paragraph with link processing
        return (
          <p key={idx} className="text-gray-700">
            {processLinks(paragraph)}
          </p>
        );
      })}
    </div>
  );
};

const FileAnalysisDisplay: React.FC<{ analysis: FileAnalysisResult }> = ({ analysis }) => {
  const [expanded, setExpanded] = React.useState(false);

  const getFileIcon = () => {
    switch (analysis.fileType) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-600" />;
      case 'txt':
        return <File className="w-4 h-4 text-blue-600" />;
      case 'pptx':
        return <File className="w-4 h-4 text-orange-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {getFileIcon()}
        <span className="text-xs font-semibold text-blue-900">File Analysis: {analysis.fileName}</span>
        <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 rounded text-blue-700">{analysis.fileType.toUpperCase()}</span>
        {analysis.pageCount && (
          <span className="text-[10px] text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">{analysis.pageCount} pages</span>
        )}
        {analysis.slideCount && (
          <span className="text-[10px] text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">~{analysis.slideCount} slides</span>
        )}
      </div>

      <div className="space-y-2">
        <div>
          <span className="text-xs font-medium text-blue-800">Summary:</span>
          <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">{analysis.summary}</p>
        </div>

        {analysis.keyPoints.length > 0 && (
          <div>
            <span className="text-xs font-medium text-blue-800">Key Points:</span>
            <ul className="mt-0.5 space-y-0.5">
              {analysis.keyPoints.slice(0, expanded ? undefined : 3).map((point, idx) => (
                <li key={idx} className="text-xs text-blue-700 flex items-start gap-1">
                  <span className="text-blue-500">•</span>
                  <span className="flex-1">{point}</span>
                </li>
              ))}
            </ul>
            {analysis.keyPoints.length > 3 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-[10px] text-blue-500 hover:text-blue-700 mt-1 font-medium"
              >
                {expanded ? 'Show less' : `Show ${analysis.keyPoints.length - 3} more points`}
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

const SourceCard: React.FC<{ source: Source; index: number }> = ({ source, index }) => (
  <a
    href={source.url}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-green-50 border-green-200 text-green-700 text-xs font-medium hover:shadow-md transition-all group"
  >
    <CheckCircle className="w-3 h-3 text-green-600" />
    <span className="font-mono text-green-600 font-bold">[{index}]</span>
    <span className="truncate max-w-[200px]">{source.name}</span>
    {source.courseCode && source.courseCode !== 'CS' && (
      <span className="font-mono text-green-500 text-[10px] px-1 py-0.5 bg-green-100 rounded">{source.courseCode}</span>
    )}
    <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
  </a>
);

const TypingDots: React.FC<{ label?: string }> = ({ label = '' }) => (
  <div className="flex items-center gap-2">
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-primary/60"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
    {label && <span className="text-xs text-gray-400">{label}</span>}
  </div>
);

// New component for copy button
const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
};

const MessageBubble: React.FC<{ msg: Message }> = ({ msg }) => {
  const isUser = msg.type === 'user';
  const hasSources = !isUser && msg.sources && msg.sources.length > 0;
  const hasFileAnalysis = !isUser && msg.fileAnalysis;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser ? 'bg-primary/15' : 'bg-primary/10'
        }`}
      >
        {isUser ? <User className="w-4 h-4 text-primary" /> : <Bot className="w-4 h-4 text-primary" />}
      </div>

      <div className={`flex flex-col gap-2 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className="group relative">
          <div
            className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              isUser
                ? 'bg-primary text-white rounded-br-sm'
                : 'bg-white text-gray-700 rounded-bl-sm border shadow-sm'
            }`}
          >
            {isUser ? msg.text : <RenderTextWithLinks text={msg.text} />}
          </div>
          {!isUser && (
            <div className="absolute -top-2 -right-2">
              <CopyButton text={msg.text} />
            </div>
          )}
        </div>

        {hasFileAnalysis && msg.fileAnalysis && <FileAnalysisDisplay analysis={msg.fileAnalysis} />}

        {hasSources && (
          <div className="mt-2 pt-2 border-t border-gray-200 w-full">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-3.5 h-3.5 text-green-600" />
              <span className="text-xs font-semibold text-gray-700">REFERENCES</span>
              <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                {msg.sources!.length} {msg.sources!.length === 1 ? 'source' : 'sources'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {msg.sources!.map((src, idx) => (
                <SourceCard key={idx} source={src} index={idx + 1} />
              ))}
            </div>
          </div>
        )}

        <span className="text-[10px] text-gray-400 px-1">{msg.time}</span>
      </div>
    </motion.div>
  );
};

const SessionItem: React.FC<{
  session: ChatSession;
  isActive: boolean;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}> = ({ session, isActive, onClick, onDelete }) => (
  <div
    onClick={onClick}
    className={`group flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${
      isActive ? 'bg-primary/10 border border-primary/20' : 'hover:bg-gray-50'
    }`}
  >
    <MessageSquare className={`w-4 h-4 mt-0.5 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium truncate">{session.title}</p>
      <div className="flex gap-2 mt-0.5">
        <span className="text-xs text-gray-400">{new Date(session.lastModified).toLocaleDateString()}</span>
        <span className="text-xs text-gray-400">•</span>
        <span className="text-xs text-gray-400">{session.messages.length} msgs</span>
      </div>
    </div>
    <button
      onClick={onDelete}
      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  </div>
);

/* ─── Main Component ─────────────────────────────────────────────────────── */
export function AIChatSection() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analyzingFile, setAnalyzingFile] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, isSearching, isProcessingFile]);

  const loadAllData = () => {
    try {
      const savedSessions = localStorage.getItem('sphere_sessions_v7');
      if (savedSessions) setSessions(JSON.parse(savedSessions));
      const savedCurrent = localStorage.getItem('sphere_current_v7');
      if (savedCurrent) {
        const current = JSON.parse(savedCurrent);
        setMessages(current.messages);
        setCurrentSessionId(current.id);
      } else {
        createNewSession();
      }
    } catch {
      createNewSession();
    }
  };

  const createNewSession = () => {
    const welcome: Message = {
      id: Date.now().toString(),
      type: 'ai',
      text: "Hello! I'm Sphere, your academic CS assistant.\n\nI can analyze **PDF, TXT, and PPTX files** and provide detailed insights.\n\n**Features:**\n• Upload PDF, TXT, or PPTX files for analysis\n• Get summaries and key points from documents\n• Ask questions about file content\n• Receive citations from verified academic sources\n\n**Try uploading a file** or ask me about:\n• Data Mining (CS327)\n• Machine Learning (CS328)\n• Programming Languages (CS321)\n• Software Engineering (CS322)\n\nWhat would you like to learn today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: `Chat ${new Date().toLocaleDateString()}`,
      messages: [welcome],
      createdAt: Date.now(),
      lastModified: Date.now(),
    };
    setMessages([welcome]);
    setCurrentSessionId(newId);
    setSessions((prev) => {
      const updated = [newSession, ...prev];
      localStorage.setItem('sphere_sessions_v7', JSON.stringify(updated));
      return updated;
    });
    localStorage.setItem('sphere_current_v7', JSON.stringify({ id: newId, messages: [welcome] }));
  };

  const saveCurrentMessages = (updatedMessages: Message[], sessionId = currentSessionId) => {
    if (!sessionId) return;
    setSessions((prev) => {
      const idx = prev.findIndex((s) => s.id === sessionId);
      const updated = [...prev];
      if (idx !== -1) {
        updated[idx] = { ...updated[idx], messages: updatedMessages, lastModified: Date.now() };
      }
      localStorage.setItem('sphere_sessions_v7', JSON.stringify(updated));
      return updated;
    });
    localStorage.setItem('sphere_current_v7', JSON.stringify({ id: sessionId, messages: updatedMessages }));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const validFiles: PendingFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileType = file.name.split('.').pop()?.toLowerCase() || '';

      if (!['pdf', 'txt', 'pptx', 'ppt'].includes(fileType)) {
        setError(`"${file.name}" is not supported. Please upload PDF, TXT, or PPTX files.`);
        setTimeout(() => setError(null), 4000);
        continue;
      }

      if (file.size > 20 * 1024 * 1024) {
        setError(`"${file.name}" exceeds 20 MB limit.`);
        setTimeout(() => setError(null), 4000);
        continue;
      }

      validFiles.push({ file, name: file.name, size: file.size, type: fileType });
    }

    if (validFiles.length > 0) {
      setPendingFiles((prev) => [...prev, ...validFiles]);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
    setShowFileUpload(false);
  };

  const processFiles = async (files: PendingFile[]): Promise<FileAnalysisResult | null> => {
    if (files.length === 0) return null;

    const file = files[0];
    setAnalyzingFile(file.name);
    setUploadProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const analysis = await analyzeFile(file.file);

      clearInterval(progressInterval);
      setUploadProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 300));

      return analysis;
    } catch (error) {
      console.error('File processing error:', error);
      throw error;
    } finally {
      setAnalyzingFile(null);
      setUploadProgress(0);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!inputValue.trim() && pendingFiles.length === 0) || isTyping) return;

    const userCaption = inputValue.trim();
    const hasFiles = pendingFiles.length > 0;

    let messageText = userCaption;
    if (hasFiles) {
      const fileNames = pendingFiles.map((f) => f.name).join(', ');
      messageText = userCaption ? `[Uploaded: ${fileNames}]\n\n${userCaption}` : `Please analyze this file: ${fileNames}`;
    }

    const newUserMsg: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    saveCurrentMessages(updatedMessages);

    const filesToProcess = [...pendingFiles];
    setInputValue('');
    setPendingFiles([]);
    setError(null);

    if (!isOnline || !isAPIKeyConfigured) {
      const offlineMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: !isOnline
          ? "I'm offline. Please connect to the internet for file analysis."
          : "API key not configured. Please add VITE_GROQ_API_KEY to your .env file.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const final = [...updatedMessages, offlineMsg];
      setMessages(final);
      saveCurrentMessages(final);
      return;
    }

    try {
      setIsSearching(true);
      const { contextBlock, sources: ragSources } = await buildRAGContext(userCaption);
      setIsSearching(false);
      setIsTyping(true);

      let fileAnalysis: FileAnalysisResult | null = null;
      if (filesToProcess.length > 0) {
        setIsProcessingFile(true);
        fileAnalysis = await processFiles(filesToProcess);
        setIsProcessingFile(false);
      }

      const { text: aiText, sources: finalSources } = await callGroqAPI(
        userCaption,
        updatedMessages,
        contextBlock,
        ragSources,
        fileAnalysis || undefined
      );

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: aiText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: finalSources.length > 0 ? finalSources : undefined,
        fileAnalysis: fileAnalysis || undefined,
      };

      const final = [...updatedMessages, aiMsg];
      setMessages(final);
      saveCurrentMessages(final);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process your request. Please try again.');
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: `I encountered an error: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const final = [...updatedMessages, errMsg];
      setMessages(final);
      saveCurrentMessages(final);
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsTyping(false);
      setIsProcessingFile(false);
    }
  };

  const clearChat = () => {
    if (confirm('Start a new chat?')) createNewSession();
  };

  const switchSession = (id: string) => {
    const session = sessions.find((s) => s.id === id);
    if (session) {
      setMessages(session.messages);
      setCurrentSessionId(id);
      setShowHistory(false);
    }
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this chat?')) return;
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (currentSessionId === id) createNewSession();
  };

  const exportChat = () => {
    const session = sessions.find((s) => s.id === currentSessionId);
    if (!session) return;
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sphere-chat-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusOnline = isOnline && isAPIKeyConfigured;

  return (
    <section className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl flex gap-4 h-[85vh]">
        <AnimatePresence>
          {showHistory && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-white rounded-2xl border shadow-sm overflow-hidden flex-shrink-0"
            >
              <div className="p-4 border-b">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold">Chat History</h3>
                  <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => {
                    createNewSession();
                    setShowHistory(false);
                  }}
                  className="w-full py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-accent transition-colors"
                >
                  + New Chat
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-1 max-h-[calc(85vh-120px)]">
                {sessions.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-8">No previous chats</p>
                ) : (
                  sessions.map((session) => (
                    <SessionItem
                      key={session.id}
                      session={session}
                      isActive={currentSessionId === session.id}
                      onClick={() => switchSession(session.id)}
                      onDelete={(e) => deleteSession(session.id, e)}
                    />
                  ))
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        <div className="flex-1 flex flex-col bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b bg-white flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                    statusOnline ? 'bg-green-400' : 'bg-gray-300'
                  }`}
                />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold">Sphere</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-200">
                    Verified Sources
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                    PDF/TXT/PPTX
                  </span>
                </div>
                <p className="text-xs text-gray-400">Upload files · Direct answers · Clean responses</p>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setShowHistory((v) => !v)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Menu className="w-4 h-4" />
              </button>
              <button onClick={exportChat} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Download className="w-4 h-4" />
              </button>
              <button onClick={clearChat} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden flex-shrink-0"
              >
                <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border-b border-red-100">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/30">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <FileUp className="w-8 h-8 text-primary/60" />
                </div>
                <p className="text-gray-500 text-sm max-w-md">Upload PDF, TXT, or PPTX files for analysis, or ask about CS topics.</p>
                <div className="flex gap-2 mt-4 flex-wrap justify-center">
                  <button
                    onClick={() => setInputValue('What is data mining?')}
                    className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs hover:bg-gray-200 transition-colors"
                  >
                    What is data mining?
                  </button>
                  <button
                    onClick={() => setShowFileUpload(true)}
                    className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs hover:bg-primary/20 transition-colors"
                  >
                    Upload a file
                  </button>
                </div>
              </div>
            ) : (
              messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
            )}

            {isSearching && !isTyping && !isProcessingFile && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Search className="w-4 h-4 text-primary animate-pulse" />
                </div>
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border">
                  <TypingDots label="Searching for sources..." />
                </div>
              </div>
            )}

            {isProcessingFile && analyzingFile && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Database className="w-4 h-4 text-blue-600 animate-pulse" />
                </div>
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border min-w-[250px]">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-3 h-3 text-blue-600 animate-spin" />
                      <span className="text-xs text-gray-600">Analyzing {analyzingFile}...</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isTyping && !isProcessingFile && !isSearching && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border">
                  <TypingDots label="Generating response..." />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t bg-white flex-shrink-0">
            <AnimatePresence>
              {pendingFiles.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mb-3"
                >
                  <div className="flex flex-wrap gap-2 pb-2 border-b border-gray-100">
                    {pendingFiles.map((file, i) => (
                      <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 rounded-lg text-xs">
                        {file.type === 'pdf' && <FileText className="w-3 h-3" />}
                        {file.type === 'txt' && <File className="w-3 h-3" />}
                        {file.type === 'pptx' && <File className="w-3 h-3" />}
                        <span className="max-w-[150px] truncate">{file.name}</span>
                        <span className="text-gray-400 text-[10px]">({formatFileSize(file.size)})</span>
                        <button onClick={() => setPendingFiles((prev) => prev.filter((_, idx) => idx !== i))} className="ml-1">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSendMessage} className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowFileUpload(!showFileUpload)}
                className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
                title="Upload PDF, TXT, or PPTX file"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about your file or CS topic..."
                className="flex-1 px-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                disabled={isTyping || isSearching || isProcessingFile}
              />
              <button
                type="submit"
                disabled={(!inputValue.trim() && pendingFiles.length === 0) || isTyping || isSearching || isProcessingFile}
                className="p-2.5 bg-primary text-white rounded-xl hover:bg-accent transition-colors disabled:opacity-50"
              >
                {isTyping || isProcessingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>

            <AnimatePresence>
              {showFileUpload && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mt-3"
                >
                  <div className="p-4 bg-gray-50 rounded-xl border">
                    <div className="flex items-center gap-2 mb-3">
                      <FileUp className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Upload File for Analysis</span>
                    </div>
                    <label className="block cursor-pointer">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.txt,.pptx,.ppt"
                        onChange={handleFileSelect}
                        multiple
                        className="hidden"
                      />
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
                        <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Click to select files</p>
                        <p className="text-xs text-gray-400 mt-1">PDF, TXT, PPTX up to 20MB each</p>
                      </div>
                    </label>
                    <div className="flex gap-3 mt-3 text-[10px] text-gray-400 justify-center">
                      <span>✓ PDF text extraction</span>
                      <span>✓ TXT full text</span>
                      <span>✓ PPTX slide analysis</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <p className="text-[10px] text-gray-400 text-center mt-3 flex items-center justify-center gap-2">
              <CheckCircle className="w-3 h-3 text-green-500" />
              {statusOnline
                ? 'Upload files for analysis - AI gives direct, clean answers without repetitive phrases'
                : 'Configure API key for file analysis'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
