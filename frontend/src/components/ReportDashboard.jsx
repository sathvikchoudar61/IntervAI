import React, { useState, useEffect } from 'react';

export default function ReportDashboard({ data, onRestart }) {
  const [activeTab, setActiveTab] = useState('technical');
  const [animatedScore, setAnimatedScore] = useState(0);

  const score = parseInt(data.overall_score) || 0;
  const techScore = parseInt(data.technical_score) || 0;
  const commScore = parseInt(data.communication_score) || 0;
  const recommendation = data.recommendation || 'Consider';

  // Animate overall score number counter
  useEffect(() => {
    let start = 0;
    const duration = 1000; // ms
    if (score === 0) return;
    const stepTime = Math.abs(Math.floor(duration / score));
    
    const timer = setInterval(() => {
      start += 1;
      setAnimatedScore(start);
      if (start >= score) {
        clearInterval(timer);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [score]);

  // Compute circular gauge offset: r=40 => perimeter ~ 251.2
  const perimeter = 2 * Math.PI * 40;
  const dashOffset = perimeter - (score / 100) * perimeter;

  const getDecisionBadgeClass = (rec) => {
    const r = rec.toLowerCase();
    if (r.includes('hire')) {
      return 'bg-[#E6F4EA] border-[#C2E7CD] text-[#137333]';
    } else if (r.includes('reject')) {
      return 'bg-[#FCE8E6] border-[#FAD2CF] text-[#C5221F]';
    }
    return 'bg-[#FEF7E0] border-[#FEEFC3] text-[#B06000]';
  };

  const getBarColorClass = (val) => {
    if (val >= 80) return 'bg-[#2F8D46]';
    if (val >= 60) return 'bg-[#F59E0B]';
    return 'bg-[#EF4444]';
  };

  const getGaugeStroke = () => {
    if (score >= 80) return 'url(#gauge-grad-high)';
    if (score >= 60) return 'url(#gauge-grad-mid)';
    return 'url(#gauge-grad-low)';
  };

  return (
    <div className="glass-panel p-6 sm:p-8 flex flex-col gap-6 w-full animate-[slide-down_0.25s_ease-out]">
      {/* Header */}
      <div className="text-center flex flex-col items-center gap-2">
        <h2 className="text-xl font-bold tracking-tight text-[#222222] font-heading">
          Interview Performance Report
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm">
          Detailed breakdown of your answers evaluated by IntervAI
        </p>
        
        {/* Recommendation Badge */}
        <div className="mt-1.5">
          <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm inline-block ${getDecisionBadgeClass(recommendation)}`}>
            {recommendation}
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Summary Card with Circle Gauge */}
        <div className="glass-card md:col-span-2 flex flex-col sm:flex-row items-center justify-around p-6 gap-6">
          <div className="flex justify-center relative w-32 h-32 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="gauge-grad-high" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2F8D46" />
                  <stop offset="100%" stopColor="#1e5c2d" />
                </linearGradient>
                <linearGradient id="gauge-grad-mid" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
                <linearGradient id="gauge-grad-low" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#c22727" />
                </linearGradient>
              </defs>
              {/* Gauge Background */}
              <circle className="fill-none stroke-slate-100 stroke-[7]" cx="50" cy="50" r="40"></circle>
              {/* Gauge Fill */}
              <circle 
                className="fill-none stroke-[7] stroke-linecap-round gauge-fill" 
                cx="50" 
                cy="50" 
                r="40" 
                strokeDasharray="251.2" 
                strokeDashoffset={dashOffset}
                stroke={getGaugeStroke()}
              ></circle>
            </svg>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center flex flex-col leading-none">
              <span className="font-heading text-3xl font-extrabold text-[#222222]">{animatedScore}</span>
              <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Overall</span>
            </div>
          </div>

          {/* Sub metrics progress bars */}
          <div className="flex flex-col gap-4 w-full max-w-sm">
            {/* Tech Bar */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>Technical Depth</span>
                <strong className="text-[#222222] font-bold">{techScore}/100</strong>
              </div>
              <div className="bg-slate-100 h-2 rounded-full overflow-hidden w-full">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${getBarColorClass(techScore)}`}
                  style={{ width: `${techScore}%` }}
                ></div>
              </div>
            </div>

            {/* Comm Bar */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>Communication & Articulation</span>
                <strong className="text-[#222222] font-bold">{commScore}/100</strong>
              </div>
              <div className="bg-slate-100 h-2 rounded-full overflow-hidden w-full">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${getBarColorClass(commScore)}`}
                  style={{ width: `${commScore}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown Feedback Panel */}
        <div className="glass-card md:col-span-2 flex flex-col gap-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Detailed Feedback</h3>
          
          <div className="flex gap-1.5 border-b border-dev-border pb-px">
            <button 
              className={`px-3 py-2 text-xs font-semibold relative transition-all duration-200 ${
                activeTab === 'technical' ? 'text-dev-green' : 'text-slate-500 hover:text-slate-800'
              }`}
              onClick={() => setActiveTab('technical')}
            >
              Technical Knowledge
              {activeTab === 'technical' && (
                <div className="absolute bottom-[-1.5px] left-0 right-0 h-[2px] bg-dev-green rounded-full"></div>
              )}
            </button>
            <button 
              className={`px-3 py-2 text-xs font-semibold relative transition-all duration-200 ${
                activeTab === 'communication' ? 'text-dev-green' : 'text-slate-500 hover:text-slate-800'
              }`}
              onClick={() => setActiveTab('communication')}
            >
              Communication Skills
              {activeTab === 'communication' && (
                <div className="absolute bottom-[-1.5px] left-0 right-0 h-[2px] bg-dev-green rounded-full"></div>
              )}
            </button>
          </div>

          <div className="pt-1 text-xs sm:text-sm leading-relaxed text-slate-700 font-medium">
            {activeTab === 'technical' ? (
              <p className="animate-fade-in">{data.technical_feedback || 'No technical feedback available.'}</p>
            ) : (
              <p className="animate-fade-in">{data.communication_feedback || 'No communication feedback available.'}</p>
            )}
          </div>
        </div>

        {/* Strengths List */}
        <div className="glass-card flex flex-col gap-3">
          <h4 className="font-bold text-xs text-[#137333] flex items-center gap-1.5 uppercase tracking-wider">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Key Strengths
          </h4>
          <ul className="flex flex-col gap-2 text-xs text-slate-700">
            {renderListItems(data.strengths, '✓')}
          </ul>
        </div>

        {/* Weaknesses List */}
        <div className="glass-card flex flex-col gap-3">
          <h4 className="font-bold text-xs text-[#C5221F] flex items-center gap-1.5 uppercase tracking-wider">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            Critical Weaknesses
          </h4>
          <ul className="flex flex-col gap-2 text-xs text-slate-700">
            {renderListItems(data.weaknesses, '✗')}
          </ul>
        </div>

        {/* Suggested Improvements */}
        <div className="glass-card md:col-span-2 flex flex-col gap-3">
          <h4 className="font-bold text-xs text-[#B06000] flex items-center gap-1.5 uppercase tracking-wider">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            Suggested Improvements
          </h4>
          <ul className="flex flex-col gap-2 text-xs text-slate-700">
            {renderListItems(data.improvements, '✦')}
          </ul>
        </div>
      </div>

      {/* Action Restart button */}
      <div className="flex justify-center mt-3">
        <button 
          className="flex items-center gap-2 px-6 py-3 rounded-lg text-xs sm:text-sm font-semibold border border-dev-border hover:border-slate-300 bg-white hover:bg-slate-50 text-[#222222] transition-all duration-200"
          onClick={onRestart}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
          </svg>
          Start New Interview
        </button>
      </div>
    </div>
  );
}

function renderListItems(items, bullet) {
  if (!items) return <li>None documented.</li>;
  const list = Array.isArray(items) ? items : [items];
  
  if (list.length === 0) return <li>None documented.</li>;
  
  return list.map((item, idx) => (
    <li key={idx} className="flex gap-1.5 leading-relaxed">
      <span className={`font-bold flex-shrink-0 ${
        bullet === '✓' ? 'text-[#137333]' : bullet === '✗' ? 'text-[#C5221F]' : 'text-[#B06000]'
      }`}>{bullet}</span>
      <span>{item}</span>
    </li>
  ));
}
