import React, { useState, useEffect } from 'react';
import { AppState, ResearchPlan, ResearchReport } from './types';
import * as geminiService from './services/geminiService';
import PlanEditor from './components/PlanEditor';
import ResearchView from './components/ResearchView';
import { Sparkles, ArrowRight, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [query, setQuery] = useState('');
  const [plan, setPlan] = useState<ResearchPlan | null>(null);
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initial greeting animation or simple input focus could go here
  
  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setAppState(AppState.GENERATING_PLAN);
    setError(null);

    try {
      const generatedPlan = await geminiService.generateResearchPlan(query);
      setPlan(generatedPlan);
      setAppState(AppState.REVIEWING_PLAN);
    } catch (err: any) {
      console.error(err);
      setError("生成研究计划失败，请重试。");
      setAppState(AppState.IDLE);
    }
  };

  const handleModifyPlan = async (instruction: string) => {
    if (!plan) return;
    setAppState(AppState.GENERATING_PLAN); // Re-use loading state
    
    try {
      const updatedPlan = await geminiService.generateResearchPlan(query, plan, instruction);
      setPlan(updatedPlan);
      setAppState(AppState.REVIEWING_PLAN);
    } catch (err: any) {
      console.error(err);
      setError("修改计划失败。");
      setAppState(AppState.REVIEWING_PLAN); // Go back to review on error
    }
  };

  const handleStartResearch = async () => {
    if (!plan) return;
    setAppState(AppState.RESEARCHING);
    
    try {
      const result = await geminiService.executeResearch(plan);
      setReport(result);
      setAppState(AppState.COMPLETED);
    } catch (err: any) {
      console.error(err);
      setError("研究执行失败，请重试。");
      setAppState(AppState.REVIEWING_PLAN);
    }
  };

  const handleReset = () => {
    setQuery('');
    setPlan(null);
    setReport(null);
    setError(null);
    setAppState(AppState.IDLE);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-gemini-500/30">
      
      {/* Top Bar (Simple) */}
      <div className="h-14 border-b border-slate-800 flex items-center px-4 justify-between bg-slate-900/80 backdrop-blur sticky top-0 z-30">
         <div className="flex items-center gap-2 text-gemini-400 font-bold tracking-tight">
            <Sparkles size={20} />
            <span>深度研究</span>
         </div>
         {appState !== AppState.IDLE && (
           <button onClick={handleReset} className="text-xs font-medium text-slate-500 hover:text-slate-300">
             重新开始
           </button>
         )}
      </div>

      <main className="h-[calc(100vh-3.5rem)] relative overflow-hidden">
        {/* Error Toast */}
        {error && (
            <div className="absolute top-4 left-4 right-4 z-50 flex justify-center">
                <div className="bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg flex items-center gap-3 shadow-xl max-w-md w-full backdrop-blur-md">
                    <AlertCircle size={20} className="shrink-0" />
                    <span className="text-sm font-medium">{error}</span>
                    <button onClick={() => setError(null)} className="ml-auto text-red-200/50 hover:text-red-100"><ArrowRight size={16}/></button>
                </div>
            </div>
        )}

        {/* State: IDLE - Input Screen */}
        {appState === AppState.IDLE && (
          <div className="h-full flex flex-col items-center justify-center px-4 -mt-10">
            <div className="w-full max-w-2xl space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="text-center space-y-3">
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 text-transparent bg-clip-text pb-1">
                        您想了解什么？
                    </h1>
                    <p className="text-slate-400 text-lg">
                        在开始之前，我将为您构建一个全面的研究框架以供审核。
                    </p>
                </div>

                <form onSubmit={handleInitialSubmit} className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-gemini-600 to-purple-600 rounded-2xl blur opacity-25 group-focus-within:opacity-75 transition duration-500"></div>
                    <div className="relative flex bg-slate-800 rounded-xl overflow-hidden shadow-2xl border border-slate-700">
                        <input 
                            type="text" 
                            className="w-full bg-transparent text-white px-6 py-5 text-lg outline-none placeholder:text-slate-500"
                            placeholder="例如：电动汽车固态电池的未来..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            autoFocus
                        />
                        <button 
                            type="submit" 
                            disabled={!query.trim()}
                            className="px-6 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                        >
                            <ArrowRight size={28} />
                        </button>
                    </div>
                </form>

                <div className="flex flex-wrap justify-center gap-2 text-sm text-slate-500">
                    <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700">详细规划</span>
                    <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700">深度网络搜索</span>
                    <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700">报告合成</span>
                </div>
            </div>
          </div>
        )}

        {/* State: GENERATING_PLAN */}
        {appState === AppState.GENERATING_PLAN && (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
                <div className="relative mb-8">
                    <div className="w-16 h-16 border-4 border-slate-700 border-t-gemini-500 rounded-full animate-spin"></div>
                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gemini-400 animate-pulse" size={24} />
                </div>
                <h2 className="text-2xl font-semibold text-white mb-2">正在构建研究结构</h2>
                <p className="text-slate-400 max-w-sm">
                    正在分析“{query}”，并识别关键主题、问题和数据点...
                </p>
            </div>
        )}

        {/* State: REVIEWING_PLAN */}
        {appState === AppState.REVIEWING_PLAN && plan && (
            <PlanEditor 
                plan={plan}
                onPlanUpdate={setPlan}
                onModifyRequest={handleModifyPlan}
                onStartResearch={handleStartResearch}
            />
        )}

        {/* State: RESEARCHING or COMPLETED */}
        {(appState === AppState.RESEARCHING || appState === AppState.COMPLETED) && (
            <ResearchView 
                isLoading={appState === AppState.RESEARCHING}
                report={report}
                onReset={handleReset}
            />
        )}
      </main>
    </div>
  );
};

export default App;