import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Search, 
  FileText, 
  PenTool, 
  CheckCircle2, 
  Loader2,
  Briefcase,
  TrendingUp,
  LineChart,
  UserCheck,
  Building2,
  PieChart,
  Globe,
  FileBarChart,
  Newspaper,
  Database,
  Check,
  Sparkles,
  Zap,
  MessageSquare
} from 'lucide-react';

const STEPS = [
  { id: 1, label: "专家角色召集", icon: Users, description: "组建多维度分析团队" },
  { id: 2, label: "关键信息采集", icon: Search, description: "全网深度检索与数据聚合" },
  { id: 3, label: "报告框架设计", icon: FileText, description: "构建逻辑严密的分析大纲" },
  { id: 4, label: "长文报告撰写", icon: PenTool, description: "合成多源信息生成深度内容" },
  { id: 5, label: "内容审核校正", icon: CheckCircle2, description: "交叉验证数据准确性" },
];

const ANALYSTS = [
  { role: "宏观分析师", icon: TrendingUp, color: "text-blue-400", ring: "border-blue-500", shadow: "shadow-blue-500/20" },
  { role: "行业分析师", icon: Building2, color: "text-emerald-400", ring: "border-emerald-500", shadow: "shadow-emerald-500/20" },
  { role: "股票分析师", icon: LineChart, color: "text-purple-400", ring: "border-purple-500", shadow: "shadow-purple-500/20" },
  { role: "用户研究员", icon: UserCheck, color: "text-orange-400", ring: "border-orange-500", shadow: "shadow-orange-500/20" },
  { role: "基金经理", icon: PieChart, color: "text-rose-400", ring: "border-rose-500", shadow: "shadow-rose-500/20" },
  { role: "首席研究官", icon: Briefcase, color: "text-amber-400", ring: "border-amber-500", shadow: "shadow-amber-500/20" },
];

const MOCK_SOURCES = [
  { type: 'web', title: 'Bloomberg Market Analysis', icon: Globe, color: 'text-blue-400' },
  { type: 'pdf', title: 'Q3 Industry Report 2024.pdf', icon: FileBarChart, color: 'text-rose-400' },
  { type: 'news', title: 'Reuters: Global Tech Trends', icon: Newspaper, color: 'text-orange-400' },
  { type: 'web', title: 'McKinsey Strategic Insights', icon: Globe, color: 'text-blue-400' },
  { type: 'data', title: 'NASDAQ Real-time Data', icon: LineChart, color: 'text-emerald-400' },
  { type: 'db', title: 'SEC Filings Database', icon: Database, color: 'text-slate-400' },
  { type: 'web', title: 'Nature Scientific Journals', icon: Globe, color: 'text-blue-400' },
  { type: 'pdf', title: 'Goldman Sachs Investment Memo', icon: FileBarChart, color: 'text-rose-400' },
];

const STEP_ACTIVITIES: Record<number, string[]> = {
  0: ["正在加入...", "准备就绪", "连接中"],
  1: ["扫描数据源", "验证来源", "读取财报", "关键词检索", "过滤噪音"],
  2: ["构建逻辑", "设计大纲", "识别缺口", "优化结构"],
  3: ["撰写草稿", "扩展论点", "引用数据", "综合分析", "生成图表"],
  4: ["事实核查", "校对数据", "最终审核", "合规检查"]
};

const ResearchProgress: React.FC = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [activeAnalysts, setActiveAnalysts] = useState<number[]>([]);
  const [foundSources, setFoundSources] = useState<typeof MOCK_SOURCES>([]);
  const [wordCount, setWordCount] = useState(0);
  
  // Advanced Animation States
  const [connections, setConnections] = useState<string[]>([]); // "idx1-idx2"
  const [activities, setActivities] = useState<Record<number, string>>({});

  // 1. Step Timeline
  useEffect(() => {
    // 0-3s: Step 1 (Experts)
    const t1 = setTimeout(() => setCurrentStepIndex(1), 3000);
    // 3-12s: Step 2 (Sources)
    const t2 = setTimeout(() => setCurrentStepIndex(2), 12000);
    // 12-16s: Step 3 (Framework)
    const t3 = setTimeout(() => setCurrentStepIndex(3), 16000);
    // 16-30s: Step 4 (Writing)
    const t4 = setTimeout(() => setCurrentStepIndex(4), 30000);
    
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  // 2. Reveal Analysts (Step 0)
  useEffect(() => {
    if (currentStepIndex === 0) {
      const interval = setInterval(() => {
        setActiveAnalysts(prev => prev.length < ANALYSTS.length ? [...prev, prev.length] : prev);
      }, 400);
      return () => clearInterval(interval);
    } else {
      setActiveAnalysts(ANALYSTS.map((_, i) => i));
    }
  }, [currentStepIndex]);

  // 3. Discover Sources (Step 2)
  useEffect(() => {
    if (currentStepIndex === 1) {
      const interval = setInterval(() => {
        setFoundSources(prev => {
          if (prev.length >= MOCK_SOURCES.length) return prev;
          return [...prev, MOCK_SOURCES[prev.length]];
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentStepIndex]);

  // 4. Writing Word Count (Step 4)
  useEffect(() => {
    if (currentStepIndex === 3) {
      const interval = setInterval(() => {
        setWordCount(prev => prev + Math.floor(Math.random() * 50) + 10);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [currentStepIndex]);

  // 5. Advanced: Random Connections
  useEffect(() => {
    if (currentStepIndex > 0 && currentStepIndex < 4) {
      const interval = setInterval(() => {
        // Create random connection
        const a = Math.floor(Math.random() * ANALYSTS.length);
        let b = Math.floor(Math.random() * ANALYSTS.length);
        while (b === a) b = Math.floor(Math.random() * ANALYSTS.length);
        
        const key = [Math.min(a,b), Math.max(a,b)].join('-');
        setConnections(prev => [...prev, key]);

        // Remove after short duration
        setTimeout(() => {
          setConnections(prev => prev.filter(k => k !== key));
        }, 800);
      }, 400); // Fast connections
      return () => clearInterval(interval);
    } else {
      setConnections([]);
    }
  }, [currentStepIndex]);

  // 6. Advanced: Analyst Activities
  useEffect(() => {
    if (currentStepIndex >= 0 && currentStepIndex <= 4) {
      const interval = setInterval(() => {
        const idx = Math.floor(Math.random() * ANALYSTS.length);
        const acts = STEP_ACTIVITIES[currentStepIndex] || ["Thinking"];
        const act = acts[Math.floor(Math.random() * acts.length)];
        
        setActivities(prev => ({ ...prev, [idx]: act }));
        
        setTimeout(() => {
          setActivities(prev => {
            const next = { ...prev };
            delete next[idx];
            return next;
          });
        }, 2000);
      }, 800);
      return () => clearInterval(interval);
    }
  }, [currentStepIndex]);


  const renderStepStatus = (index: number) => {
    if (index === 0) { // Experts
      if (currentStepIndex > 0) return <span className="text-emerald-400 text-xs font-mono">已集结 {ANALYSTS.length} 位领域专家</span>;
      return <span className="text-gemini-400 text-xs font-mono animate-pulse">正在匹配分析师...</span>;
    }
    if (index === 1) { // Sources
      if (currentStepIndex === 1) return <span className="text-gemini-400 text-xs font-mono">正在扫描信任源 ({foundSources.length}/{MOCK_SOURCES.length})...</span>;
      if (currentStepIndex > 1) return <span className="text-emerald-400 text-xs font-mono">已解析 {foundSources.length} 个关键数据源</span>;
      return null;
    }
    if (index === 2) { // Framework
      if (currentStepIndex > 2) return <span className="text-emerald-400 text-xs font-mono">框架逻辑已锁定</span>;
      if (currentStepIndex === 2) return <span className="text-gemini-400 text-xs font-mono animate-pulse">正在构建思维导图...</span>;
      return null;
    }
    if (index === 3) { // Writing
      if (currentStepIndex === 3) return <span className="text-gemini-400 text-xs font-mono">已生成 {wordCount.toLocaleString()} 字...</span>;
      if (currentStepIndex > 3) return <span className="text-emerald-400 text-xs font-mono">草稿撰写完成</span>;
      return null;
    }
    if (index === 4) { // Review
       if (currentStepIndex === 4) return <span className="text-gemini-400 text-xs font-mono animate-pulse">正在进行事实核查...</span>;
       return null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] w-full max-w-3xl mx-auto px-4 py-8">
      
      {/* 1. Advanced Analysts Header */}
      <div className="w-full mb-12 relative">
        {/* Connection Layer (SVG) */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
           <svg width="100%" height="100%">
              {connections.map(conn => {
                const [a, b] = conn.split('-').map(Number);
                const x1 = (a / (ANALYSTS.length - 1)) * 100;
                const x2 = (b / (ANALYSTS.length - 1)) * 100;
                return (
                  <path 
                    key={conn}
                    d={`M ${x1}% 40 Q ${(x1+x2)/2}% 0 ${x2}% 40`}
                    stroke="url(#gradient)"
                    strokeWidth="2"
                    fill="none"
                    className="animate-in fade-in duration-300"
                  />
                );
              })}
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0ea5e9" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
           </svg>
        </div>

        <div className="flex justify-between items-start relative z-10 px-2 sm:px-4">
          {ANALYSTS.map((analyst, idx) => {
            const isActive = activeAnalysts.includes(idx);
            const isWorking = currentStepIndex > 0 && currentStepIndex < 4;
            const activity = activities[idx];
            
            return (
              <div 
                key={idx}
                className={`flex flex-col items-center relative transition-all duration-700 w-16 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              >
                {/* Activity Bubble */}
                {activity && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-800/90 text-slate-200 text-[10px] px-2 py-1 rounded-full border border-slate-700 shadow-xl animate-in fade-in zoom-in slide-in-from-bottom-2 duration-300 z-20">
                     {activity}
                     <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45 border-b border-r border-slate-700"></div>
                  </div>
                )}

                {/* Avatar */}
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-900 border-2 ${analyst.ring} flex items-center justify-center mb-3 relative group shadow-lg ${analyst.shadow}`}>
                   
                   {/* Spinning Ring for active state */}
                   {isWorking && isActive && (
                     <div className={`absolute -inset-1 rounded-full border border-t-transparent ${analyst.ring.replace('border', 'border-opacity-50')} animate-spin duration-[3s]`}></div>
                   )}
                   
                   <analyst.icon className={`${analyst.color} transition-transform group-hover:scale-110 duration-300`} size={24} />
                   
                   {/* Status Dot */}
                   {isWorking && isActive && (
                     <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-slate-900"></span>
                     </span>
                   )}
                </div>
                
                {/* Label */}
                <span className={`text-[10px] sm:text-xs text-slate-400 font-semibold text-center leading-tight transition-colors duration-300 ${activity ? 'text-white' : ''}`}>
                  {analyst.role}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Main Timeline */}
      <div className="w-full bg-slate-800/40 rounded-2xl border border-slate-700/50 p-1 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col">
          {STEPS.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isPending = index > currentStepIndex;

            return (
              <div 
                key={step.id} 
                className={`relative transition-all duration-500 overflow-hidden ${isCurrent ? 'bg-slate-800/80 rounded-xl my-1 shadow-lg border border-slate-700' : 'opacity-60 hover:opacity-80 py-3 px-4'}`}
              >
                <div className={`flex items-start gap-4 ${isCurrent ? 'p-4' : ''}`}>
                  {/* Status Icon */}
                  <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-all duration-300 z-10
                    ${isCompleted ? 'bg-emerald-500 text-slate-900 border-emerald-500' : ''}
                    ${isCurrent ? 'bg-gemini-600 text-white border-gemini-500 shadow-[0_0_15px_rgba(14,165,233,0.5)]' : ''}
                    ${isPending ? 'bg-slate-800 border-slate-700 text-slate-600' : ''}
                  `}>
                    {isCompleted ? <Check size={16} strokeWidth={3} /> : 
                     isCurrent ? <Loader2 size={16} className="animate-spin" /> : 
                     <step.icon size={16} />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                        <h3 className={`font-medium text-sm md:text-base ${isPending ? 'text-slate-500' : 'text-slate-200'}`}>
                        {step.label}
                        </h3>
                        {renderStepStatus(index)}
                    </div>
                    
                    {/* Collapsed Description */}
                    {!isCurrent && (
                        <p className="text-xs text-slate-500 truncate">{step.description}</p>
                    )}

                    {/* EXPANDED CONTENT: Sources List (Step 2) */}
                    {index === 1 && (isCurrent || isCompleted) && foundSources.length > 0 && (
                        <div className={`mt-3 space-y-2 ${isCompleted ? 'hidden' : 'block animate-in slide-in-from-top-2'}`}>
                            <div className="h-px w-full bg-slate-700/50 mb-3" />
                            <div className="grid grid-cols-1 gap-2">
                                {foundSources.map((source, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-slate-900/50 border border-slate-700/50 animate-in fade-in slide-in-from-left-4 fill-mode-backwards" style={{ animationDelay: `${idx * 150}ms` }}>
                                        <div className="p-1.5 rounded bg-slate-800 shrink-0">
                                            <source.icon size={14} className={source.color} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs text-slate-300 truncate font-medium">{source.title}</div>
                                            <div className="text-[10px] text-slate-500 uppercase tracking-wider">{source.type}</div>
                                        </div>
                                        <div className="text-emerald-400">
                                            <CheckCircle2 size={12} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* EXPANDED CONTENT: Framework (Step 3) */}
                    {index === 2 && isCurrent && (
                        <div className="mt-3 grid gap-2 animate-in fade-in">
                            <div className="h-2 w-3/4 bg-slate-700 rounded animate-pulse"></div>
                            <div className="h-2 w-1/2 bg-slate-700 rounded animate-pulse delay-75"></div>
                            <div className="h-2 w-5/6 bg-slate-700 rounded animate-pulse delay-150"></div>
                        </div>
                    )}
                  </div>
                </div>

                {/* Vertical Connector Line */}
                {index < STEPS.length - 1 && (
                    <div className={`absolute left-[2.25rem] top-10 bottom-0 w-px -z-0 transition-colors duration-500 ${isCompleted ? 'bg-emerald-500/30' : 'bg-slate-800'}`} style={{ height: 'calc(100% + 1rem)' }}></div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      <p className="mt-6 text-slate-500 text-xs font-mono flex items-center gap-2 animate-pulse">
        <Sparkles size={12} className="text-gemini-400" />
        AI 正在调用 Gemini 3.0 Pro 进行深度逻辑推理...
      </p>
    </div>
  );
};

export default ResearchProgress;