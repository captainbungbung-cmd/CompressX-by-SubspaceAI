/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Link as LinkIcon, 
  FileUp, 
  Sparkles, 
  Loader2, 
  Copy, 
  Check, 
  ArrowRight,
  X,
  FileText,
  RefreshCcw,
  Zap,
  BookOpen,
  Info,
  Languages,
  ChevronDown,
  Search
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { summarizeContent, summarizeFile, summarizeBook, translateText, researchTopic } from './services/geminiService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const LANGUAGES = [
  { label: 'English', value: 'English' },
  { label: 'Spanish', value: 'Spanish' },
  { label: 'French', value: 'French' },
  { label: 'German', value: 'German' },
  { label: 'Chinese', value: 'Chinese' },
  { label: 'Japanese', value: 'Japanese' },
  { label: 'Korean', value: 'Korean' },
  { label: 'Russian', value: 'Russian' },
  { label: 'Portuguese', value: 'Portuguese' },
  { label: 'Arabic', value: 'Arabic' },
];

export default function App() {
  const [url, setUrl] = useState('');
  const [bookTitle, setBookTitle] = useState('');
  const [researchQuery, setResearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [originalSummary, setOriginalSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'url' | 'file' | 'book' | 'research'>('url');
  const [copied, setCopied] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedLang, setSelectedLang] = useState('English');
  const [showLangMenu, setShowLangMenu] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      setError(null);
      setSummary(null);
      setOriginalSummary(null);
      
      // Simulate upload progress
      setUploadProgress(0);
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          setUploadProgress(100);
          clearInterval(interval);
        } else {
          setUploadProgress(progress);
        }
      }, 200);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    multiple: false
  });

  const handleTranslate = async (lang: string) => {
    if (!originalSummary || lang === selectedLang) return;
    
    setTranslating(true);
    setSelectedLang(lang);
    setShowLangMenu(false);
    
    try {
      if (lang === 'English') {
        setSummary(originalSummary);
      } else {
        const translated = await translateText(originalSummary, lang);
        setSummary(translated);
      }
    } catch (err: any) {
      setError("Translation failed. Please try again.");
    } finally {
      setTranslating(false);
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError(null);
    setSummary(null);
    setOriginalSummary(null);

    try {
      const response = await fetch('/api/fetch-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) throw new Error('Failed to fetch URL content');
      
      const { content } = await response.json();
      const result = await summarizeContent(content, 'url');
      setOriginalSummary(result);
      setSummary(result);
      setSelectedLang('English');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookTitle) return;

    setLoading(true);
    setError(null);
    setSummary(null);
    setOriginalSummary(null);

    try {
      const result = await summarizeBook(bookTitle);
      setOriginalSummary(result);
      setSummary(result);
      setSelectedLang('English');
    } catch (err: any) {
      setError(err.message || 'Book search failed');
    } finally {
      setLoading(false);
    }
  };
  
  const handleResearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!researchQuery) return;

    setLoading(true);
    setError(null);
    setSummary(null);
    setOriginalSummary(null);

    try {
      const result = await researchTopic(researchQuery);
      setOriginalSummary(result);
      setSummary(result);
      setSelectedLang('English');
    } catch (err: any) {
      setError(err.message || 'Research failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSubmit = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setSummary(null);
    setOriginalSummary(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        try {
          const result = await summarizeFile(base64Data, file.type);
          setOriginalSummary(result);
          setSummary(result);
          setSelectedLang('English');
        } catch (err: any) {
          setError(err.message || 'AI processing failed');
        } finally {
          setLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (summary) {
      navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const resetAll = () => {
    setSummary(null);
    setOriginalSummary(null);
    setError(null);
    setUrl('');
    setBookTitle('');
    setResearchQuery('');
    setFile(null);
    setLoading(false);
    setUploadProgress(0);
  };

  return (
    <div className="min-h-screen bg-violet-50 flex flex-col font-sans text-violet-900">
      {/* Navigation */}
      <nav className="px-6 sm:px-12 py-8 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0 z-10 border-b border-violet-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-violet-900 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight uppercase">CompressX</span>
        </div>
        <div className="flex items-center gap-4">
          {/* Language Selector */}
          <div className="relative">
            <button 
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-violet-100 rounded-xl text-sm font-medium hover:border-violet-300 transition-all text-violet-600"
            >
              <Languages className="w-4 h-4" />
              <span className="hidden sm:inline">{selectedLang}</span>
              <ChevronDown className={cn("w-3 h-3 transition-transform", showLangMenu ? "rotate-180" : "")} />
            </button>
            
            <AnimatePresence>
              {showLangMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute right-0 mt-2 w-48 bg-white border border-violet-100 rounded-2xl shadow-xl overflow-hidden z-50 p-1"
                >
                  <div className="max-h-64 overflow-y-auto">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.value}
                        onClick={() => handleTranslate(lang.value)}
                        className={cn(
                          "w-full text-left px-4 py-2.5 text-sm rounded-xl transition-colors",
                          selectedLang === lang.value 
                            ? "bg-violet-50 text-violet-900 font-semibold" 
                            : "text-violet-600 hover:bg-violet-50/50 hover:text-violet-900"
                        )}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="hidden sm:flex gap-8 text-sm font-medium text-violet-500 ml-4">
            <button onClick={resetAll} className="hover:text-violet-900 transition-colors">New Summary</button>
            <a href="#" className="hover:text-violet-900 transition-colors">History</a>
          </div>
        </div>
      </nav>

      <main className="flex-1 px-6 sm:px-12 pb-12 flex flex-col gap-12 mt-8">
        
        {/* Promotional Banner (Ad) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto w-full"
        >
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl shadow-violet-200 flex flex-col sm:row items-center gap-6 border border-violet-400/20">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-lg font-bold mb-1">Experience Ultimate Efficiency</h3>
              <p className="text-violet-100 text-sm leading-relaxed">
                Our AI engine is designed to distill massive amounts of information into pure knowledge. 
                Why read for hours when you can understand in minutes?
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap">
              <Zap className="w-3 h-3" /> 10x Faster
            </div>
          </div>
        </motion.div>

        {/* Hero & Input Section */}
        <div className="max-w-3xl mx-auto w-full text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h1 className="text-5xl font-light mb-4 tracking-tight text-violet-900">Information, distilled.</h1>
            <p className="text-violet-500 mb-8 text-lg">Scan any web link, deep search books, or summarize documents instantly.</p>
          </motion.div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-violet-200 p-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4">
            <div className="flex items-center px-2 py-1 bg-violet-50 rounded-xl">
              <button 
                onClick={() => { setActiveTab('url'); setSummary(null); setOriginalSummary(null); }}
                className={cn("p-3 rounded-lg transition-all", activeTab === 'url' ? "bg-white shadow-sm text-violet-900" : "text-violet-400 hover:text-violet-600")}
              >
                <LinkIcon className="w-5 h-5" />
              </button>
              <button 
                onClick={() => { setActiveTab('book'); setSummary(null); setOriginalSummary(null); }}
                className={cn("p-3 rounded-lg transition-all", activeTab === 'book' ? "bg-white shadow-sm text-violet-900" : "text-violet-400 hover:text-violet-600")}
              >
                <BookOpen className="w-5 h-5" />
              </button>
              <button 
                onClick={() => { setActiveTab('research'); setSummary(null); setOriginalSummary(null); }}
                className={cn("p-3 rounded-lg transition-all", activeTab === 'research' ? "bg-white shadow-sm text-violet-900" : "text-violet-400 hover:text-violet-600")}
              >
                <Search className="w-5 h-5" />
              </button>
              <button 
                onClick={() => { setActiveTab('file'); setSummary(null); setOriginalSummary(null); }}
                className={cn("p-3 rounded-lg transition-all", activeTab === 'file' ? "bg-white shadow-sm text-violet-900" : "text-violet-400 hover:text-violet-600")}
              >
                <FileUp className="w-5 h-5" />
              </button>
            </div>

            <div className="h-8 w-[1px] bg-violet-100 hidden sm:block mx-2"></div>

            {activeTab === 'url' ? (
              <input
                id="url-input"
                type="url"
                placeholder="Paste website link..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 px-4 py-4 bg-transparent outline-none text-violet-700 placeholder:text-violet-300 min-w-0"
              />
            ) : activeTab === 'book' ? (
              <input
                id="book-input"
                type="text"
                placeholder="Enter book title for deep search..."
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                className="flex-1 px-4 py-4 bg-transparent outline-none text-violet-700 placeholder:text-violet-300 min-w-0"
              />
            ) : activeTab === 'research' ? (
              <input
                id="research-input"
                type="text"
                placeholder="Enter any complex topic for deep research..."
                value={researchQuery}
                onChange={(e) => setResearchQuery(e.target.value)}
                className="flex-1 px-4 py-4 bg-transparent outline-none text-violet-700 placeholder:text-violet-300 min-w-0"
              />
            ) : (
              <div 
                {...getRootProps()}
                className="flex-1 flex flex-col items-start px-4 py-2 min-w-0 cursor-pointer"
              >
                <input {...getInputProps()} />
                {file ? (
                  <div className="w-full">
                    <span className="text-violet-900 font-medium truncate flex items-center mb-1">
                      <FileText className="w-4 h-4 mr-2 text-violet-400" />
                      {file.name}
                    </span>
                    {uploadProgress < 100 && (
                      <div className="w-full h-1 bg-violet-100 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-violet-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-violet-300 py-3">Click to upload document...</span>
                )}
              </div>
            )}
            
            <button 
              id="main-action-btn"
              onClick={activeTab === 'url' ? handleUrlSubmit : activeTab === 'book' ? handleBookSubmit : activeTab === 'research' ? handleResearchSubmit : handleFileSubmit}
              disabled={loading || (activeTab === 'url' ? !url : activeTab === 'book' ? !bookTitle : activeTab === 'research' ? !researchQuery : !file) || (activeTab === 'file' && uploadProgress < 100)}
              className="bg-violet-900 text-white px-8 py-4 rounded-xl font-medium hover:bg-violet-800 transition-colors disabled:bg-violet-200 flex items-center justify-center whitespace-nowrap shadow-lg shadow-violet-200/50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Distilling...
                </>
              ) : (
                'Generate Summary'
              )}
            </button>
          </div>

          <div className="flex items-center justify-center gap-6 text-[10px] font-bold uppercase tracking-widest text-violet-300 mt-4">
             <span className="flex items-center"><Info className="w-3 h-3 mr-1" /> Deep Search Grounding Active</span>
          </div>
        </div>

        {/* Error Handling */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-2xl mx-auto w-full bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-2xl text-sm flex items-center gap-3"
            >
              <X className="w-4 h-4" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Preview Result Section */}
        <AnimatePresence mode="wait">
          {summary && (
            <motion.div 
              key={`${activeTab}-${selectedLang}`}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Main Content Area */}
              <div className="lg:col-span-2 glass-card p-8 sm:p-12 flex flex-col min-h-[500px] relative">
                {translating && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-20 flex items-center justify-center rounded-3xl">
                    <div className="text-center">
                      <Loader2 className="w-10 h-10 text-violet-900 animate-spin mx-auto mb-4" />
                      <p className="text-sm font-semibold text-violet-900">Translating to {selectedLang}...</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-start mb-10">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-purple-500 font-bold bg-purple-50 px-3 py-1.5 rounded-lg mb-4 inline-block">Analysis Complete</span>
                    <h2 className="text-3xl font-semibold leading-tight">
                      {activeTab === 'book' ? `Deep Search: ${bookTitle}` : activeTab === 'research' ? `Research: ${researchQuery}` : 'Summary Insight'}
                    </h2>
                    <p className="text-xs text-violet-400 mt-2 uppercase tracking-wider">
                      {activeTab === 'url' ? `Source: ${new URL(url).hostname}` : activeTab === 'book' ? 'High-Precision Grounding' : activeTab === 'research' ? 'Deep Info Synthesis' : `File: ${file?.name}`} • {selectedLang}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={copyToClipboard}
                      className="p-3 rounded-xl border border-violet-100 hover:bg-violet-900 hover:text-white transition-all text-violet-400 shadow-sm"
                    >
                      {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                    </button>
                    <button 
                      onClick={resetAll}
                      className="p-3 rounded-xl border border-violet-100 hover:bg-violet-50 transition-all text-violet-400 shadow-sm"
                    >
                      <RefreshCcw className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 markdown-body mb-12 prose-lg">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                  >
                    <ReactMarkdown>{summary}</ReactMarkdown>
                  </motion.div>
                </div>

                <div className="mt-auto pt-8 flex items-center justify-between border-t border-violet-100">
                  <div className="flex gap-2">
                    <span className="px-4 py-1.5 bg-violet-100 rounded-full text-[10px] font-bold text-violet-600 uppercase tracking-widest flex items-center shadow-sm">
                      AI Abstract
                    </span>
                    <span className="px-4 py-1.5 bg-violet-900 rounded-full text-[10px] font-bold text-white uppercase tracking-widest leading-none flex items-center shadow-lg shadow-violet-200">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Gemini 3 Pro
                    </span>
                  </div>
                  <div className="text-[10px] text-violet-400 font-bold uppercase tracking-widest flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Language: {selectedLang}
                  </div>
                </div>
              </div>

              {/* Side Cards */}
              <div className="flex flex-col gap-6">
                <div className="bg-violet-900 text-white rounded-[32px] p-10 flex-custom flex flex-col justify-between shadow-xl shadow-violet-200">
                  <h3 className="text-sm font-bold uppercase tracking-widest opacity-40">Efficiency Pulse</h3>
                  <div className="text-3xl font-light italic leading-relaxed py-8">
                    "Information density is the key to mastering any subject today."
                  </div>
                  <div className="space-y-4">
                    <div className="text-[10px] uppercase tracking-widest text-violet-400 font-bold">Compression Quality</div>
                    <div className="w-full h-1.5 bg-violet-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "95%" }}
                        transition={{ delay: 0.5, duration: 1 }}
                        className="h-full bg-purple-400"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-[32px] border border-violet-100 p-8 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-4 h-4 text-purple-500 fill-purple-500" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-violet-400">Deep Insights</h3>
                  </div>
                  <p className="text-sm text-violet-600 leading-relaxed font-medium">
                    Our AI cross-references information from multiple sources to provide the most factual and concise summary possible.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State placeholder handled within layout or simply hidden when summary exists */}
        {!summary && !loading && (
          <div className="flex-1 max-w-5xl mx-auto w-full opacity-20 pointer-events-none grayscale grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 glass-card p-12 h-[400px] border-dashed border-violet-200"></div>
            <div className="flex flex-col gap-6">
              <div className="bg-violet-100 rounded-[32px] flex-1"></div>
              <div className="bg-white border border-violet-100 rounded-[32px] h-32"></div>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-auto px-6 sm:px-12 py-8 border-t border-violet-100 flex flex-col sm:flex-row justify-between items-center text-[10px] text-violet-400 font-bold uppercase tracking-widest bg-white/80 backdrop-blur-sm">
        <div>CompressX &copy; {new Date().getFullYear()} • Powered by Gemini AI</div>
        <div className="flex gap-8 mt-4 sm:mt-0">
          <span className="hover:text-violet-600 cursor-pointer transition-colors">Privacy</span>
          <span className="hover:text-violet-600 cursor-pointer transition-colors">Terms</span>
          <span className="text-violet-900 flex items-center">
            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2 animate-pulse"></span>
            Intelligence Active
          </span>
        </div>
      </footer>
    </div>
  );
}
