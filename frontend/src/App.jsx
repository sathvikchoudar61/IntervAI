import React, { useState, useEffect, useRef } from 'react';
import WaveVisualizer from './components/WaveVisualizer';
import ReportDashboard from './components/ReportDashboard';

export default function App() {
  // Navigation / Views State
  const [view, setView] = useState('setup'); // 'setup' | 'interview' | 'loading' | 'result'
  
  // Setup Parameters
  const [file, setFile] = useState(null);
  const [jobRole, setJobRole] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [tone, setTone] = useState('professional');

  // Interview Session State
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  
  // Speech STT / TTS state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState('');
  const [micWarning, setMicWarning] = useState('');
  const [audioStream, setAudioStream] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Loading indicator states
  const [loadingType, setLoadingType] = useState('upload'); // 'upload' | 'evaluate'
  const [loadingTitle, setLoadingTitle] = useState('Analyzing Resume');
  const [loadingDesc, setLoadingDesc] = useState('Extracting credentials and tailoring relevant mock interview questions...');

  // Final evaluation result
  const [evaluation, setEvaluation] = useState(null);

  // Refs
  const dropZoneRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  // Initialize Speech Recognition on Mount
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsRecording(true);
        setRecordingStatus('Listening...');
        setMicWarning('');
      };

      rec.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (finalTranscript) {
          setCurrentAnswer(prev => prev + finalTranscript);
        }
      };

      rec.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        let msg = "Speech recognition error occurred.";
        if (event.error === 'not-allowed') {
          msg = "Microphone permission denied. Please allow mic access in your browser settings.";
        } else if (event.error === 'no-speech') {
          console.log("No speech detected.");
          stopRecording();
          return;
        } else if (event.error === 'audio-capture') {
          msg = "No microphone was found. Please ensure a microphone is plugged in.";
        } else if (event.error === 'network') {
          msg = "Speech recognition requires an internet connection. Please check your connection.";
        }
        setMicWarning(msg);
        stopRecording();
      };

      rec.onend = () => {
        stopRecording();
      };

      recognitionRef.current = rec;
    } else {
      console.warn("SpeechRecognition is not supported in this browser.");
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Cycle Loading messages
  useEffect(() => {
    if (view !== 'loading' || loadingType !== 'evaluate') return;

    let stage = 0;
    const interval = setInterval(() => {
      stage++;
      if (stage === 1) {
        setLoadingTitle('Analyzing Answers');
        setLoadingDesc('Deconstructing your core replies against industry standards...');
      } else if (stage === 2) {
        const toneWord = tone === 'brutal' ? 'a brutal' : (tone === 'friendly' ? 'a supportive' : 'a professional');
        setLoadingTitle('Generating Evaluation');
        setLoadingDesc(`Formulating ${toneWord} critique and calculating final scores...`);
      } else if (stage === 3) {
        setLoadingTitle('Finalizing Report');
        setLoadingDesc('Rendering strengths, weaknesses, and hiring recommendations...');
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [view, tone, loadingType]);

  // Handle Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    if (dropZoneRef.current) dropZoneRef.current.classList.add('border-dev-green', 'bg-dev-light-green/20');
  };

  const handleDragLeave = () => {
    if (dropZoneRef.current) dropZoneRef.current.classList.remove('border-dev-green', 'bg-dev-light-green/20');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleDragLeave();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const validateAndSetFile = (f) => {
    if (!f.name.endsWith('.pdf')) {
      alert("Please upload a PDF file only.");
      return;
    }
    setFile(f);
  };

  const removeFile = (e) => {
    e.stopPropagation();
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Toggle Speech Recognition
  const toggleRecording = async () => {
    if (!recognitionRef.current) return;

    if (isRecording) {
      stopRecording();
    } else {
      try {
        setRecordingStatus('Requesting mic...');
        setMicWarning('');

        // Grab mic stream
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setAudioStream(stream);

        // Start SpeechRecognition
        recognitionRef.current.start();
      } catch (err) {
        console.error("Microphone access failed:", err);
        let msg = "Microphone access denied or failed. Please check browser settings.";
        if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          msg = "No microphone detected. Please plug in a microphone.";
        }
        setMicWarning(msg);
        stopRecording();
      }
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    setRecordingStatus('');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      setAudioStream(null);
    }
  };

  // TTS: Speak Question
  const speakQuestion = () => {
    const questionText = questions[currentIndex];
    if (!questionText || !synthRef.current) return;

    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(questionText);
    utterance.rate = tone === 'brutal' ? 1.05 : (tone === 'friendly' ? 0.95 : 1.0);
    utterance.pitch = tone === 'brutal' ? 0.9 : (tone === 'friendly' ? 1.1 : 1.0);

    setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  };

  // Setup Actions
  const handleStartInterview = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please upload your PDF resume first.");
      return;
    }

    setLoadingType('upload');
    setView('loading');
    setLoadingTitle('Analyzing Resume');
    setLoadingDesc('Parsing credentials and generating custom mock interview questions...');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('job_role', jobRole || 'Software Developer');
    formData.append('num_questions', numQuestions);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to upload and generate questions.');
      }

      const data = await response.json();
      setQuestions(data.questions);
      setAnswers([]);
      setCurrentIndex(0);
      setCurrentAnswer('');
      setView('interview');

      // Auto-read first question (unless brutal)
      if (tone !== 'brutal') {
        setTimeout(() => {
          const firstQuestion = data.questions[0];
          if (firstQuestion && synthRef.current) {
            synthRef.current.cancel();
            const utterance = new SpeechSynthesisUtterance(firstQuestion);
            utterance.rate = tone === 'friendly' ? 0.95 : 1.0;
            utterance.pitch = tone === 'friendly' ? 1.1 : 1.0;
            synthRef.current.speak(utterance);
          }
        }, 500);
      }

    } catch (err) {
      alert("Error starting interview: " + err.message);
      setView('setup');
    }
  };

  // Question Submission Flow
  const handleSubmitAnswer = () => {
    stopRecording();
    if (synthRef.current) synthRef.current.cancel();

    const ans = currentAnswer.trim();
    if (!ans) {
      alert("Please provide an answer before continuing.");
      return;
    }

    const updatedAnswers = [...answers, ans];
    setAnswers(updatedAnswers);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setCurrentAnswer('');
      
      // Auto speak next question (unless brutal)
      if (tone !== 'brutal') {
        setTimeout(() => {
          const nextQuestion = questions[currentIndex + 1];
          if (nextQuestion && synthRef.current) {
            synthRef.current.cancel();
            const utterance = new SpeechSynthesisUtterance(nextQuestion);
            utterance.rate = tone === 'friendly' ? 0.95 : 1.0;
            utterance.pitch = tone === 'friendly' ? 1.1 : 1.0;
            synthRef.current.speak(utterance);
          }
        }, 400);
      }
    } else {
      evaluateInterview(updatedAnswers);
    }
  };

  const evaluateInterview = async (finalAnswers) => {
    setLoadingType('evaluate');
    setView('loading');
    setLoadingTitle('Evaluating Answers');
    setLoadingDesc('Sending responses to AI model for strict grading...');

    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions,
          answers: finalAnswers,
          tone
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Evaluation failed.');
      }

      const data = await response.json();
      setEvaluation(data);
      setView('result');
    } catch (err) {
      alert("Evaluation Error: " + err.message);
      setView('setup');
    }
  };

  const handleExitInterview = () => {
    if (window.confirm("Are you sure you want to exit? Your progress will be lost.")) {
      handleRestart();
    }
  };

  const handleRestart = () => {
    stopRecording();
    if (synthRef.current) synthRef.current.cancel();

    setFile(null);
    setJobRole('');
    setQuestions([]);
    setAnswers([]);
    setCurrentIndex(0);
    setCurrentAnswer('');
    setEvaluation(null);
    setLoadingType('upload');
    setView('setup');
  };

  const percentage = questions.length > 0 ? Math.round((currentIndex / questions.length) * 100) : 0;

  return (
    <div className="w-[90%] max-w-[1400px] mx-auto flex flex-col gap-6 px-2">
      {/* HEADER */}
      <header className="flex items-center justify-between pb-4 border-b border-dev-border mb-2">
        <div className="flex items-center gap-2.5">
          <svg className="w-7 h-7 text-dev-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            <path d="M8 10h.01"></path>
            <path d="M12 10h.01"></path>
            <path d="M16 10h.01"></path>
          </svg>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">
            IntervAI<span className="text-dev-green">.</span>
          </h1>
        </div>
        <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase hidden sm:block">
          Mock Interviewer
        </p>
      </header>

      {/* SETUP VIEW */}
      {view === 'setup' && (
        <section className="glass-panel p-6 sm:p-8 flex flex-col gap-6 animate-[slide-down_0.2s_ease-out]">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold text-slate-800">
              Start Mock Interview
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm">
              Upload your resume and choose settings to let the AI formulate custom interview questions.
            </p>
          </div>

          <form onSubmit={handleStartInterview} className="flex flex-col gap-5">
            {/* Upload Zone */}
            <div 
              ref={dropZoneRef}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className="border-2 border-dashed border-dev-border rounded-lg p-6 sm:p-8 text-center cursor-pointer bg-slate-50/50 hover:bg-slate-50 hover:border-dev-green transition-all duration-200"
            >
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".pdf" 
                onChange={handleFileChange}
                className="hidden" 
              />
              
              {!file ? (
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="text-slate-400">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-600">
                    <span className="text-dev-green font-semibold">Click to upload</span> or drag and drop
                    <p className="text-[10px] text-slate-400 mt-0.5">PDF file format only</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 bg-dev-light-green border border-dev-green/20 rounded-full px-4 py-2 w-fit mx-auto shadow-sm">
                  <svg className="w-4 h-4 text-dev-dark-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                  <span className="text-xs font-semibold text-dev-dark-green max-w-[200px] truncate">{file.name}</span>
                  <button 
                    type="button" 
                    onClick={removeFile}
                    className="p-0.5 rounded-full text-dev-dark-green hover:bg-dev-green/10 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Job Role</label>
                <input 
                  type="text" 
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  placeholder="e.g. Software Engineer, Product Manager"
                  list="roles-list-react"
                  required
                  className="bg-white border border-dev-border rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-[#222222] placeholder-slate-400 focus:border-dev-green focus:ring-4 focus:ring-dev-green/10 transition-all outline-none"
                />
                <datalist id="roles-list-react">
                  <option value="Software Engineer" />
                  <option value="Frontend Developer" />
                  <option value="Backend Developer" />
                  <option value="Full Stack Developer" />
                  <option value="Data Analyst" />
                  <option value="Product Manager" />
                  <option value="UI/UX Designer" />
                </datalist>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Number of Questions</label>
                <select 
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                  className="bg-white border border-dev-border rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-[#222222] focus:border-dev-green focus:ring-4 focus:ring-dev-green/10 transition-all outline-none"
                >
                  <option value="3">3 Questions (Quick Test)</option>
                  <option value="5">5 Questions (Standard)</option>
                  <option value="8">8 Questions (Detailed)</option>
                  <option value="10">10 Questions (Full Mock)</option>
                </select>
              </div>

              {/* Tone Selection */}
              <div className="sm:col-span-2 flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Interviewer Tone</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'friendly', title: 'Friendly', desc: 'Encouraging & supportive', activeStyle: 'border-dev-green bg-dev-light-green/30 shadow-[0_2px_8px_rgba(47,141,70,0.06)]' },
                    { id: 'professional', title: 'Professional', desc: 'Standard corporate style', activeStyle: 'border-slate-500 bg-slate-50 shadow-[0_2px_8px_rgba(0,0,0,0.04)]' },
                    { id: 'brutal', title: 'Brutal', desc: 'Hyper-critical & strict', activeStyle: 'border-rose-500 bg-rose-50/30 shadow-[0_2px_8px_rgba(244,63,94,0.06)]' }
                  ].map((t) => (
                    <label key={t.id} className="cursor-pointer">
                      <input 
                        type="radio" 
                        name="tone-react"
                        value={t.id} 
                        checked={tone === t.id}
                        onChange={() => setTone(t.id)}
                        className="hidden"
                      />
                      <div className={`flex flex-col items-center text-center p-5 rounded-lg bg-white border border-dev-border hover:bg-slate-50/50 transition-all duration-200 ${
                        tone === t.id ? t.activeStyle : ''
                      }`}>
                        <span className="text-sm font-bold text-slate-800 mb-0.5">{t.title}</span>
                        <span className="text-[10px] text-slate-500 leading-normal">{t.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-1">
              <button 
                type="submit" 
                disabled={!file}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg text-sm font-bold bg-dev-green hover:bg-dev-green-hover text-white transition-all shadow-[0_2px_8px_rgba(47,141,70,0.2)] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 duration-200"
              >
                <span>Generate Interview Questions</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </div>
          </form>
        </section>
      )}

      {/* INTERVIEW VIEW */}
      {view === 'interview' && (
        <section className="glass-panel p-6 sm:p-8 flex flex-col gap-5 animate-[slide-down_0.2s_ease-out]">
          {/* Progress */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Question {currentIndex + 1} of {questions.length}</span>
              <span>{percentage}% Completed</span>
            </div>
            <div className="bg-slate-100 h-2 rounded-full overflow-hidden w-full">
              <div 
                className="h-full bg-dev-green transition-all duration-300"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>

          {/* Question Display */}
          <div className="flex flex-col sm:flex-row gap-4 items-start bg-slate-50 border border-dev-border rounded-lg p-5">
            <div className="bg-dev-light-green border border-dev-green/20 text-dev-green w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M12 2v3"></path>
                <path d="M8 5h8"></path>
              </svg>
            </div>
            
            <div className="flex-grow flex justify-between items-start gap-4">
              <p className="text-sm sm:text-base font-semibold text-[#222222] leading-relaxed">
                {questions[currentIndex]}
              </p>
              <button 
                onClick={speakQuestion}
                className={`p-2 rounded-lg border border-dev-border hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-600 transition-all flex-shrink-0 ${
                  isSpeaking ? 'text-dev-green border-dev-green/30' : ''
                }`}
                title="Speak Question"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>
              </button>
            </div>
          </div>

          {/* Answer Area */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Your Answer</label>
            
            {/* Mic warning banner */}
            {micWarning && (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 rounded-lg p-3 text-xs text-rose-700 animate-[slide-down_0.2s_ease]">
                <svg className="w-4 h-4 text-rose-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <span>{micWarning}</span>
              </div>
            )}

            <div className="relative flex flex-col">
              <textarea 
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Type your answer here, or click the mic button to speak..."
                rows="5"
                className="bg-white border border-dev-border rounded-lg p-4 text-xs sm:text-sm text-[#222222] placeholder-slate-400 focus:border-dev-green focus:ring-4 focus:ring-dev-green/10 outline-none resize-none pb-14 transition-all"
              />
              
              <div className="absolute bottom-2.5 right-2.5 flex items-center gap-2 bg-slate-50 border border-dev-border rounded-lg p-1.5">
                <WaveVisualizer isRecording={isRecording} stream={audioStream} />
                <button 
                  onClick={toggleRecording}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-dev-border text-slate-700 transition-all ${
                    isRecording ? 'bg-rose-500 hover:bg-rose-600 text-white animate-mic-pulse border border-white/20' : 'hover:bg-slate-50'
                  }`}
                  title="Voice Input"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                  </svg>
                </button>
                {recordingStatus && (
                  <span className="text-[9px] font-bold text-rose-600 animate-text-pulse pr-2">{recordingStatus}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-1">
            <button 
              onClick={handleExitInterview}
              className="px-5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold border border-dev-border hover:border-slate-300 hover:bg-slate-50 text-slate-700 transition-all duration-200"
            >
              Exit
            </button>
            <button 
              onClick={handleSubmitAnswer}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold bg-dev-green hover:bg-dev-green-hover text-white shadow-sm"
            >
              <span>{currentIndex === questions.length - 1 ? 'Finish & Evaluate' : 'Next Question'}</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </div>
        </section>
      )}

      {/* LOADING VIEW */}
      {view === 'loading' && (
        <section className="glass-panel p-10 flex flex-col items-center justify-center text-center gap-4 animate-[slide-down_0.2s_ease-out]">
          <div className="relative w-16 h-16 flex items-center justify-center mb-1">
            {/* Spinning Rings */}
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-dev-green animate-[spin_1.5s_linear_infinite]"></div>
            <div className="absolute inset-1.5 rounded-full border-2 border-transparent border-b-dev-green/30 animate-[spin_1s_linear_infinite_reverse]"></div>
            <div className="w-3.5 h-3.5 rounded-full bg-dev-green shadow-[0_0_10px_rgba(47,141,70,0.3)]"></div>
          </div>
          <div className="flex flex-col gap-1 max-w-sm">
            <h3 className="text-base font-bold text-[#222222]">
              {loadingTitle}
            </h3>
            <p className="text-xs text-slate-500">
              {loadingDesc}
            </p>
          </div>
        </section>
      )}

      {/* RESULTS/DASHBOARD VIEW */}
      {view === 'result' && evaluation && (
        <ReportDashboard data={evaluation} onRestart={handleRestart} />
      )}
    </div>
  );
}
