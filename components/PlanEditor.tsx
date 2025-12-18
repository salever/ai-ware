import React, { useState } from 'react';
import { ResearchPlan, ResearchSection, ResearchPoint } from '../types';
import { Check, X, ChevronDown, ChevronRight, Edit3, Play, Plus, Trash2 } from 'lucide-react';

interface PlanEditorProps {
  plan: ResearchPlan;
  onPlanUpdate: (newPlan: ResearchPlan) => void;
  onModifyRequest: (instruction: string) => void;
  onStartResearch: () => void;
}

const PlanEditor: React.FC<PlanEditorProps> = ({ plan, onPlanUpdate, onModifyRequest, onStartResearch }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(plan.sections.map(s => s.id)));
  const [showModifyInput, setShowModifyInput] = useState(false);
  const [modifyInstruction, setModifyInstruction] = useState('');

  // States for adding new content
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [addingPointToSectionId, setAddingPointToSectionId] = useState<string | null>(null);
  const [newPointContent, setNewPointContent] = useState('');

  const toggleSection = (id: string) => {
    const newSet = new Set(expandedSections);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedSections(newSet);
  };

  const toggleSectionEnabled = (sectionId: string) => {
    const newSections = plan.sections.map(s => {
      if (s.id === sectionId) {
        return { ...s, isEnabled: !s.isEnabled };
      }
      return s;
    });
    onPlanUpdate({ ...plan, sections: newSections });
  };

  const togglePointEnabled = (sectionId: string, pointId: string) => {
    const newSections = plan.sections.map(s => {
      if (s.id === sectionId) {
        const newPoints = s.points.map(p => {
          if (p.id === pointId) {
            return { ...p, isEnabled: !p.isEnabled };
          }
          return p;
        });
        return { ...s, points: newPoints };
      }
      return s;
    });
    onPlanUpdate({ ...plan, sections: newSections });
  };

  const deletePoint = (sectionId: string, pointId: string) => {
     const newSections = plan.sections.map(s => {
      if (s.id === sectionId) {
        const newPoints = s.points.filter(p => p.id !== pointId);
        return { ...s, points: newPoints };
      }
      return s;
    });
    onPlanUpdate({ ...plan, sections: newSections });
  };

  const deleteSection = (sectionId: string) => {
    if (confirm('确定要删除这个章节吗？')) {
      const newSections = plan.sections.filter(s => s.id !== sectionId);
      onPlanUpdate({ ...plan, sections: newSections });
    }
  };

  // --- Add Handlers ---

  const handleAddSection = () => {
    if (!newSectionTitle.trim()) {
      setIsAddingSection(false);
      return;
    }
    
    const newSection: ResearchSection = {
      id: crypto.randomUUID(),
      title: newSectionTitle,
      description: "用户新增章节",
      isEnabled: true,
      points: []
    };

    onPlanUpdate({ ...plan, sections: [...plan.sections, newSection] });
    setNewSectionTitle('');
    setIsAddingSection(false);
    // Auto expand the new section
    setExpandedSections(prev => new Set(prev).add(newSection.id));
  };

  const handleAddPoint = () => {
    if (!newPointContent.trim() || !addingPointToSectionId) {
      setAddingPointToSectionId(null);
      return;
    }

    const newSections = plan.sections.map(s => {
      if (s.id === addingPointToSectionId) {
        const newPoint: ResearchPoint = {
          id: crypto.randomUUID(),
          content: newPointContent,
          isEnabled: true
        };
        return { ...s, points: [...s.points, newPoint] };
      }
      return s;
    });

    onPlanUpdate({ ...plan, sections: newSections });
    setNewPointContent('');
    setAddingPointToSectionId(null);
  };

  const handleModifySubmit = () => {
    if (modifyInstruction.trim()) {
      onModifyRequest(modifyInstruction);
      setShowModifyInput(false);
      setModifyInstruction('');
    }
  };

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto w-full relative">
      <div className="flex-1 overflow-y-auto pb-48 px-4 scroll-smooth">
        <header className="py-6">
          <h2 className="text-sm font-semibold text-gemini-500 uppercase tracking-wider mb-2">研究框架</h2>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{plan.title}</h1>
          <p className="text-slate-400 text-sm md:text-base">{plan.objective}</p>
        </header>

        <div className="space-y-4">
          {plan.sections.map((section) => (
            <div 
              key={section.id} 
              className={`border border-slate-700 rounded-xl bg-slate-800/50 overflow-hidden transition-all duration-300 ${!section.isEnabled ? 'opacity-60 border-dashed' : ''}`}
            >
              {/* Section Header */}
              <div className="flex items-center p-4 gap-3 bg-slate-800/80 group">
                <button 
                  onClick={() => toggleSection(section.id)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  {expandedSections.has(section.id) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </button>
                
                <div 
                  className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-colors ${section.isEnabled ? 'bg-gemini-600 border-gemini-500' : 'border-slate-500 bg-transparent'}`}
                  onClick={() => toggleSectionEnabled(section.id)}
                >
                  {section.isEnabled && <Check size={14} className="text-white" />}
                </div>

                <div className="flex-1 cursor-pointer" onClick={() => toggleSection(section.id)}>
                  <h3 className={`font-semibold text-base md:text-lg select-none ${section.isEnabled ? 'text-white' : 'text-slate-500 line-through'}`}>
                    {section.title}
                  </h3>
                </div>

                <button 
                  onClick={() => deleteSection(section.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-1 transition-opacity"
                  title="删除章节"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Section Content (Points) */}
              {expandedSections.has(section.id) && section.isEnabled && (
                <div className="px-4 pb-4 pt-0 pl-12 space-y-2">
                    {section.points.length === 0 && !addingPointToSectionId && <p className="text-slate-500 text-sm italic mt-2">暂无关键点，请添加。</p>}
                    
                    {section.points.map((point) => (
                      <div key={point.id} className="group flex items-start justify-between gap-3 py-2 border-b border-slate-700/50 last:border-0 hover:bg-slate-700/20 rounded px-2 -ml-2 transition-colors">
                         <div 
                          className={`mt-1 w-4 h-4 rounded border flex items-center justify-center cursor-pointer shrink-0 transition-colors ${point.isEnabled ? 'bg-purple-600/50 border-purple-500/50' : 'border-slate-600 bg-transparent'}`}
                          onClick={() => togglePointEnabled(section.id, point.id)}
                        >
                          {point.isEnabled && <Check size={10} className="text-white" />}
                        </div>
                        <span className={`text-sm md:text-base leading-relaxed flex-1 ${point.isEnabled ? 'text-slate-300' : 'text-slate-600 line-through'}`}>
                          {point.content}
                        </span>
                        <button
                          onClick={() => deletePoint(section.id, point.id)}
                          className="text-slate-500 hover:text-red-400 p-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all shrink-0"
                          aria-label="删除关键点"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}

                    {/* Add Point Input Area */}
                    {addingPointToSectionId === section.id ? (
                      <div className="flex items-center gap-2 mt-2 animate-in fade-in slide-in-from-top-1">
                        <input 
                          autoFocus
                          type="text"
                          className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-sm text-white focus:border-purple-500 outline-none"
                          placeholder="输入新的研究点..."
                          value={newPointContent}
                          onChange={(e) => setNewPointContent(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddPoint();
                            if (e.key === 'Escape') setAddingPointToSectionId(null);
                          }}
                        />
                        <button onClick={handleAddPoint} className="p-1.5 bg-purple-600 rounded text-white hover:bg-purple-500"><Check size={16} /></button>
                        <button onClick={() => setAddingPointToSectionId(null)} className="p-1.5 text-slate-400 hover:text-white"><X size={16} /></button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => {
                           setAddingPointToSectionId(section.id);
                           setNewPointContent('');
                        }}
                        className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-purple-400 mt-2 px-2 py-1 rounded hover:bg-slate-700/30 transition-colors w-full"
                      >
                        <Plus size={14} /> 添加关键点
                      </button>
                    )}
                </div>
              )}
            </div>
          ))}

          {/* Add Section Input Area */}
          {isAddingSection ? (
            <div className="border border-gemini-500/50 rounded-xl bg-slate-800 p-4 animate-in fade-in slide-in-from-top-2 shadow-lg shadow-gemini-900/20">
               <h4 className="text-xs font-bold text-gemini-400 uppercase mb-2">新章节标题</h4>
               <div className="flex gap-2">
                 <input 
                    autoFocus
                    type="text"
                    className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-gemini-500 outline-none placeholder:text-slate-600"
                    placeholder="输入章节名称..."
                    value={newSectionTitle}
                    onChange={(e) => setNewSectionTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddSection();
                      if (e.key === 'Escape') setIsAddingSection(false);
                    }}
                 />
                 <button 
                    onClick={handleAddSection} 
                    className="bg-gemini-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gemini-500 transition-colors"
                 >
                    确认
                 </button>
                 <button 
                    onClick={() => setIsAddingSection(false)} 
                    className="text-slate-400 px-3 py-2 hover:text-white transition-colors"
                 >
                    取消
                 </button>
               </div>
            </div>
          ) : (
            <button 
              onClick={() => {
                setIsAddingSection(true);
                setNewSectionTitle('');
              }}
              className="w-full py-4 border-2 border-dashed border-slate-700 rounded-xl text-slate-500 hover:text-gemini-400 hover:border-gemini-500/50 hover:bg-slate-800/50 transition-all flex items-center justify-center gap-2 font-medium"
            >
              <Plus size={20} /> 添加新章节
            </button>
          )}
        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-900 via-slate-900 to-transparent z-20">
        <div className="max-w-3xl mx-auto flex flex-col gap-3">
            {showModifyInput ? (
                <div className="bg-slate-800 p-3 rounded-xl shadow-lg border border-slate-700 animate-in slide-in-from-bottom-5">
                    <textarea 
                        className="w-full bg-slate-900 text-white p-3 rounded-lg border border-slate-600 focus:border-gemini-500 focus:ring-1 focus:ring-gemini-500 outline-none resize-none text-sm"
                        rows={3}
                        placeholder="例如：增加关于市场竞争对手的章节..."
                        value={modifyInstruction}
                        onChange={(e) => setModifyInstruction(e.target.value)}
                        autoFocus
                    />
                    <div className="flex justify-end gap-2 mt-2">
                        <button 
                            onClick={() => setShowModifyInput(false)}
                            className="px-4 py-2 text-sm text-slate-300 hover:text-white"
                        >
                            取消
                        </button>
                        <button 
                            onClick={handleModifySubmit}
                            className="px-4 py-2 text-sm bg-gemini-600 hover:bg-gemini-500 text-white rounded-lg font-medium transition-colors"
                        >
                            AI 更新方案
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex gap-3">
                    <button 
                        onClick={() => setShowModifyInput(true)}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors shadow-lg"
                    >
                        <Edit3 size={18} />
                        AI 修改方案
                    </button>
                    <button 
                        onClick={onStartResearch}
                        className="flex-1 bg-gradient-to-r from-gemini-600 to-gemini-500 hover:from-gemini-500 hover:to-gemini-400 text-white py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-gemini-900/50"
                    >
                        <Play size={18} fill="currentColor" />
                        开始研究
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default PlanEditor;