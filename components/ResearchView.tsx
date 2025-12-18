import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { ResearchReport, Flashcard, ChatMessage } from '../types';
import * as geminiService from '../services/geminiService';
import { 
  ExternalLink, 
  RefreshCw, 
  Clock, 
  AlignLeft, 
  BookOpen, 
  MessageSquare, 
  Edit3, 
  Layers, 
  X, 
  Send, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  MoreHorizontal,
  Loader2
} from 'lucide-react';
import ResearchProgress from './ResearchProgress';

interface ResearchViewProps {
  isLoading: boolean;
  report: ResearchReport | null;
  onReset: () => void;
}

interface ParsedSection {
  id: string;
  title: string;
  content: string;
}

const ResearchView: React.FC<ResearchViewProps> = ({ isLoading, report, onReset }) => {
  const [showFullReport, setShowFullReport] = useState(false);
  const [sections, setSections] = useState<ParsedSection[]>([]);
  
  // Interaction States
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  const [flashcardsOpen, setFlashcardsOpen] = useState(false);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [isFlashcardsLoading, setIsFlashcardsLoading] = useState(false);

  const [refineOpen, setRefineOpen] = useState(false);
  const [refineInstruction, setRefineInstruction] = useState("");
  const [isRefining, setIsRefining] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Parse Markdown into Sections
  useEffect(() => {
    if (report?.markdown) {
      // Split by H2 (## )
      const parts = report.markdown.split(/\n(?=## )/);
      const parsed: ParsedSection[] = parts.map((part, idx) => {
        const titleMatch = part.match(/^##\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1] : (idx === 0 ? "前言 / 摘要" : "未命名章节");
        // Remove title from content to avoid duplicate display
        const content = part.replace(/^##\s+.+$/m, '').trim();
        return {
          id: `sec-${idx}`,
          title,
          content
        };
      });
      setSections(parsed);
    }
  }, [report]);

  // Scroll Chat to bottom
  useEffect(() => {
    if (chatOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, chatOpen]);

  // Handlers
  const handleOpenChat = (sectionId: string) => {
    setActiveSectionId(sectionId);
    setChatHistory([]); // Reset history for new section
    setChatOpen(true);
    setFlashcardsOpen(false);
    setRefineOpen(false);
  };

  const handleOpenFlashcards = async (sectionId: string) => {
    setActiveSectionId(sectionId);
    setFlashcardsOpen(true);
    setChatOpen(false);
    setRefineOpen(false);
    setIsFlashcardsLoading(true);
    setCurrentCardIndex(0);
    setIsCardFlipped(false);

    const section = sections.find(s => s.id === sectionId);
    if (section) {
      try {
        const cards = await geminiService.generateFlashcards(section.content);
        setFlashcards(cards);
      } catch (e) {
        console.error(e);
      } finally {
        setIsFlashcardsLoading(false);
      }
    }
  };

  const handleOpenRefine = (sectionId: string) => {
    setActiveSectionId(sectionId);
    setRefineOpen(true);
    setChatOpen(false);
    setFlashcardsOpen(false);
    setRefineInstruction("");
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || !activeSectionId) return;
    
    const userMsg = chatInput;
    setChatInput("");
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsChatLoading(true);

    const section = sections.find(s => s.id === activeSectionId);
    if (section) {
      try {
        const response = await geminiService.chatWithSection(section.content, chatHistory, userMsg);
        setChatHistory(prev => [...prev, { role: 'model', content: response }]);
      } catch (e) {
        setChatHistory(prev => [...prev, { role: 'model', content: "抱歉，出错了，请稍后再试。" }]);
      } finally {
        setIsChatLoading(false);
      }
    }
  };

  const handleRefineSubmit = async () => {
    if (!refineInstruction.trim() || !activeSectionId) return;
    
    setIsRefining(true);
    const sectionIndex = sections.findIndex(s => s.id === activeSectionId);
    const section = sections[sectionIndex];

    if (section) {
      try {
        const newContent = await geminiService.refineSectionContent(section.content, refineInstruction);
        // Update local state
        const newSections = [...sections];
        newSections[sectionIndex] = { ...section, content: newContent };
        setSections(newSections);
        setRefineOpen(false);
      } catch (e) {
        console.error(e);
      } finally {
        setIsRefining(false);
      }
    }
  };

  if (isLoading) {
    return <ResearchProgress />;
  }

  if (!report) return null;

  // 1. Summary Card View
  if (!showFullReport) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[70vh] px-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="w-full max-w-md bg-slate-800 rounded-3xl overflow-hidden shadow-2xl border border-slate-700/50 group hover:border-gemini-500/30 transition-all">
          <div className="h-48 w-full bg-slate-900 relative overflow-hidden">
            {report.imageUrl ? (
              <img src={report.imageUrl} alt="Cover" className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gemini-900 to-slate-900 flex items-center justify-center">
                <BookOpen size={48} className="text-gemini-500/50" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
            <div className="absolute bottom-4 left-4 right-4">
              <h1 className="text-xl md:text-2xl font-bold text-white leading-tight shadow-black drop-shadow-lg">
                {report.title}
              </h1>
            </div>
          </div>
          <div className="grid grid-cols-2 divide-x divide-slate-700/50 border-b border-slate-700/50">
            <div className="p-4 flex flex-col items-center justify-center gap-1">
              <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                <AlignLeft size={14} />
                字数
              </div>
              <span className="text-lg font-mono text-white">{report.wordCount.toLocaleString()}</span>
            </div>
            <div className="p-4 flex flex-col items-center justify-center gap-1">
              <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                <Clock size={14} />
                耗时
              </div>
              <span className="text-lg font-mono text-white">{report.timeElapsed}</span>
            </div>
          </div>
          <div className="p-6">
            <button 
              onClick={() => setShowFullReport(true)}
              className="w-full bg-white hover:bg-slate-200 text-slate-900 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-white/10"
            >
              <BookOpen size={18} />
              阅读完整报告
            </button>
            <button 
              onClick={onReset}
              className="w-full mt-3 py-2 text-sm text-slate-500 hover:text-slate-300 font-medium transition-colors"
            >
              重新开始
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Interactive Full Report View
  return (
    <div className="h-full flex flex-col relative">
      
      {/* Scrollable Content Container */}
      <div className="flex-1 overflow-y-auto scroll-smooth">
        <div className="max-w-4xl mx-auto pb-24">
          
          {/* Header Image */}
          {report.imageUrl && (
            <div className="w-full h-48 md:h-72 rounded-b-3xl md:rounded-3xl overflow-hidden mb-8 relative shrink-0 md:mx-0 shadow-2xl">
              <img src={report.imageUrl} alt="Cover" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-90"></div>
              <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full">
                <div className="flex justify-between items-end">
                    <h1 className="text-2xl md:text-4xl font-bold text-white shadow-black drop-shadow-md flex-1">{report.title}</h1>
                    <button onClick={() => setShowFullReport(false)} className="bg-slate-800/80 p-2 rounded-full text-white backdrop-blur hover:bg-slate-700 transition-colors">
                      <X size={20} />
                    </button>
                </div>
              </div>
            </div>
          )}

          {/* Sections List */}
          <div className="px-4 md:px-0 space-y-6">
            {sections.map((section, index) => (
              <div key={section.id} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden hover:border-slate-600 transition-all group">
                <div className="p-5 md:p-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl md:text-2xl font-bold text-gemini-100 flex items-center gap-3">
                        <span className="text-gemini-500/50 text-lg font-mono">0{index + 1}</span>
                        {section.title}
                    </h2>
                  </div>
                  
                  <div className="prose prose-invert prose-slate max-w-none prose-lg prose-headings:text-white prose-p:leading-relaxed prose-a:text-gemini-400">
                    <ReactMarkdown>{section.content}</ReactMarkdown>
                  </div>
                </div>

                {/* Interaction Bar */}
                <div className="bg-slate-900/50 border-t border-slate-800 p-2 flex gap-2 justify-end backdrop-blur-sm">
                    <button 
                      onClick={() => handleOpenRefine(section.id)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <Edit3 size={16} />
                      修改内容
                    </button>
                    <button 
                      onClick={() => handleOpenFlashcards(section.id)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-400 hover:text-gemini-300 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <Layers size={16} />
                      生成闪卡
                    </button>
                    <button 
                      onClick={() => handleOpenChat(section.id)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gemini-400 hover:text-gemini-300 bg-gemini-900/20 hover:bg-gemini-900/40 rounded-lg transition-colors border border-gemini-500/20"
                    >
                      <MessageSquare size={16} />
                      @{index+1} 提问
                    </button>
                </div>
              </div>
            ))}

            {/* Sources Footer */}
            {report.sources.length > 0 && (
              <div className="mt-12 p-6 rounded-2xl bg-slate-900 border border-slate-800">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <ExternalLink size={16} />
                    参考来源
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                      {report.sources.map((source, idx) => (
                          <a key={idx} href={source.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-lg bg-slate-800 hover:bg-slate-750 transition-colors group">
                              <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center shrink-0 text-xs font-mono text-slate-400">{idx + 1}</div>
                              <span className="text-sm text-slate-300 truncate group-hover:text-gemini-400 transition-colors">{source.title}</span>
                          </a>
                      ))}
                  </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- DRAWERS / MODALS --- */}

      {/* 1. Chat Drawer */}
      {chatOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end pointer-events-none">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={() => setChatOpen(false)} />
           <div className="pointer-events-auto bg-slate-900 w-full sm:w-[400px] h-[80vh] sm:h-full border-t sm:border-l border-slate-700 shadow-2xl flex flex-col animate-in slide-in-from-right-full sm:slide-in-from-right duration-300 rounded-t-2xl sm:rounded-none">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                 <div>
                   <h3 className="font-bold text-white">针对性对话</h3>
                   <p className="text-xs text-slate-400">正在讨论: {sections.find(s => s.id === activeSectionId)?.title}</p>
                 </div>
                 <button onClick={() => setChatOpen(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white"><X size={20} /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                 <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gemini-600 flex items-center justify-center shrink-0"><Sparkles size={16} className="text-white" /></div>
                    <div className="bg-slate-800 rounded-2xl rounded-tl-none p-3 text-sm text-slate-200 border border-slate-700">
                       您好！我是您的研究助手。关于这个章节，您有什么想深入了解或探讨的吗？
                    </div>
                 </div>
                 {chatHistory.map((msg, idx) => (
                   <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-purple-600' : 'bg-gemini-600'}`}>
                         {msg.role === 'user' ? <div className="text-xs font-bold text-white">ME</div> : <Sparkles size={16} className="text-white" />}
                      </div>
                      <div className={`rounded-2xl p-3 text-sm border max-w-[85%] ${msg.role === 'user' ? 'bg-purple-900/30 border-purple-500/30 text-white rounded-tr-none' : 'bg-slate-800 border-slate-700 text-slate-200 rounded-tl-none'}`}>
                         <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                   </div>
                 ))}
                 {isChatLoading && (
                    <div className="flex gap-3">
                       <div className="w-8 h-8 rounded-full bg-gemini-600 flex items-center justify-center shrink-0"><Sparkles size={16} className="text-white" /></div>
                       <div className="bg-slate-800 rounded-2xl rounded-tl-none p-3 border border-slate-700 flex items-center gap-2">
                          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75" />
                          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150" />
                       </div>
                    </div>
                 )}
                 <div ref={chatEndRef} />
              </div>

              <div className="p-4 border-t border-slate-800 bg-slate-900">
                 <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-xl border border-slate-700 focus-within:border-gemini-500 transition-colors">
                    <input 
                      type="text" 
                      className="flex-1 bg-transparent outline-none text-white placeholder:text-slate-500 text-sm"
                      placeholder="输入您的问题..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                    />
                    <button 
                      onClick={handleSendChat}
                      disabled={!chatInput.trim() || isChatLoading}
                      className="p-2 bg-gemini-600 rounded-lg text-white hover:bg-gemini-500 disabled:opacity-50 disabled:hover:bg-gemini-600 transition-colors"
                    >
                       <Send size={16} />
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* 2. Flashcards Modal */}
      {flashcardsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setFlashcardsOpen(false)} />
           <div className="relative bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-700 shadow-2xl p-6 md:p-8 animate-in zoom-in duration-300 flex flex-col items-center min-h-[400px]">
              <div className="absolute top-4 right-4">
                 <button onClick={() => setFlashcardsOpen(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white"><X size={24} /></button>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                 <Layers className="text-gemini-400" />
                 智能闪卡
              </h3>

              {isFlashcardsLoading ? (
                 <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4">
                    <div className="w-12 h-12 border-4 border-slate-700 border-t-gemini-500 rounded-full animate-spin"></div>
                    <p>正在提炼关键知识点...</p>
                 </div>
              ) : flashcards.length > 0 ? (
                 <div className="w-full flex-1 flex flex-col items-center perspective-1000">
                    <div 
                       className={`relative w-full aspect-[4/3] cursor-pointer transition-transform duration-500 transform-style-3d ${isCardFlipped ? 'rotate-y-180' : ''}`}
                       onClick={() => setIsCardFlipped(!isCardFlipped)}
                       style={{ transformStyle: 'preserve-3d' }}
                    >
                       {/* Front */}
                       <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center backface-hidden shadow-xl group hover:border-gemini-500/50 transition-colors">
                          <span className="text-xs font-bold text-gemini-500 uppercase tracking-widest mb-4">问题 / 术语</span>
                          <p className="text-xl md:text-2xl font-medium text-white">{flashcards[currentCardIndex].front}</p>
                          <p className="absolute bottom-6 text-xs text-slate-500 flex items-center gap-1 group-hover:text-gemini-400 transition-colors">
                             <RotateCw size={12} /> 点击翻转
                          </p>
                       </div>
                       
                       {/* Back */}
                       <div className="absolute inset-0 bg-gradient-to-br from-gemini-900 to-slate-900 border border-gemini-700/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center backface-hidden rotate-y-180 shadow-xl">
                          <span className="text-xs font-bold text-gemini-300 uppercase tracking-widest mb-4">答案 / 定义</span>
                          <p className="text-lg md:text-xl text-white leading-relaxed">{flashcards[currentCardIndex].back}</p>
                       </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-6 mt-8">
                       <button 
                          onClick={() => {
                             setCurrentCardIndex(prev => Math.max(0, prev - 1));
                             setIsCardFlipped(false);
                          }}
                          disabled={currentCardIndex === 0}
                          className="p-3 rounded-full bg-slate-800 text-white disabled:opacity-30 hover:bg-slate-700 transition-colors"
                       >
                          <ChevronLeft size={24} />
                       </button>
                       <span className="font-mono text-slate-400">{currentCardIndex + 1} / {flashcards.length}</span>
                       <button 
                          onClick={() => {
                             setCurrentCardIndex(prev => Math.min(flashcards.length - 1, prev + 1));
                             setIsCardFlipped(false);
                          }}
                          disabled={currentCardIndex === flashcards.length - 1}
                          className="p-3 rounded-full bg-slate-800 text-white disabled:opacity-30 hover:bg-slate-700 transition-colors"
                       >
                          <ChevronRight size={24} />
                       </button>
                    </div>
                 </div>
              ) : (
                 <div className="text-slate-400">无法生成闪卡。</div>
              )}
           </div>
        </div>
      )}

      {/* 3. Refine Modal */}
      {refineOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setRefineOpen(false)} />
            <div className="relative bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl p-6 animate-in zoom-in duration-200">
               <h3 className="text-lg font-bold text-white mb-2">修改章节内容</h3>
               <p className="text-sm text-slate-400 mb-4">请输入您的修改建议，AI 将为您重写本章节。</p>
               
               <textarea 
                  className="w-full h-32 bg-slate-800 border border-slate-700 rounded-xl p-3 text-white placeholder:text-slate-500 outline-none focus:border-gemini-500 focus:ring-1 focus:ring-gemini-500 resize-none"
                  placeholder="例如：请增加更多关于2024年的市场数据..."
                  value={refineInstruction}
                  onChange={(e) => setRefineInstruction(e.target.value)}
               />

               <div className="flex justify-end gap-3 mt-4">
                  <button 
                     onClick={() => setRefineOpen(false)}
                     className="px-4 py-2 text-slate-300 hover:text-white text-sm"
                  >
                     取消
                  </button>
                  <button 
                     onClick={handleRefineSubmit}
                     disabled={isRefining || !refineInstruction.trim()}
                     className="px-4 py-2 bg-gemini-600 hover:bg-gemini-500 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                  >
                     {isRefining ? <Loader2 size={14} className="animate-spin" /> : <Edit3 size={14} />}
                     开始重写
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default ResearchView;