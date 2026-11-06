import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  BookOpen, LayoutDashboard, BrainCircuit, BookMarked, BarChart3, 
  Settings, Plus, Trash2, Edit3, CheckCircle2, XCircle, ChevronRight, 
  ChevronLeft, Play, RotateCcw, Download, Upload, Star, Award, 
  Flame, Check, Search, Filter, HelpCircle, Layers, FolderPlus,
  RefreshCw, CheckSquare, Square, AlertCircle, ArrowUpRight, Clock,
  FileSpreadsheet, Sparkles, User, ShieldCheck
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, 
  CartesianGrid, PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts';

// --- 初期預設範例資料 (Demo initial state) ---
const INITIAL_CATEGORIES = [
  { id: 'cat-1', name: '國家考試 (高普考)' },
  { id: 'cat-2', name: '升學考試 (學測/分科)' },
];

const INITIAL_SUBJECTS = [
  { id: 'sub-1', categoryId: 'cat-1', name: '行政學總論' },
  { id: 'sub-2', categoryId: 'cat-2', name: '高中核心英文' },
];

const INITIAL_CHAPTERS = [
  { id: 'chap-1', subjectId: 'sub-1', name: '第一章：行政學基礎理論與演進' },
  { id: 'chap-2', subjectId: 'sub-1', name: '第二章：組織理論與公共管理' },
  { id: 'chap-3', subjectId: 'sub-2', name: '第一章：核心字彙與文法分析' },
];

const INITIAL_QUESTIONS = [
  {
    id: 'q-1',
    categoryId: 'cat-1',
    subjectId: 'sub-1',
    chapterId: 'chap-1',
    type: 'single', // single, multiple, boolean
    difficulty: 'medium', // easy, medium, hard
    title: '根據韋伯 (Max Weber) 的官僚理論，下列何者「非」其核心特徵？',
    options: ['層級節制', '專業分工', '永業化保障', '強調非正式組織與情感交流'],
    correctAnswer: [3], // index 3
    explanation: '韋伯的傳統官僚理論強調理性化、去情感化、權責分明與層級節制；強調非正式組織與人際互動者為「人群關係學派」（如梅堯的霍桑實驗）。'
  },
  {
    id: 'q-2',
    categoryId: 'cat-1',
    subjectId: 'sub-1',
    chapterId: 'chap-1',
    type: 'multiple',
    difficulty: 'hard',
    title: '關於黑堡宣言 (Blacksburg Manifesto) 的主張，下列哪些敘述正確？（複選）',
    options: [
      '主張行政人員應扮演憲政守護者的角色',
      '強調市場機制與民營化勝於政府治理',
      '主張公共行政應具備專業正當性與公共利益價值',
      '認為文官應積極介入政策過程，捍衛公共價值'
    ],
    correctAnswer: [0, 2, 3],
    explanation: '黑堡宣言反對 1980 年代過度將市場機制與民營化視為萬靈丹的新公共管理思潮，強調公務員為憲政機構維護者與公共利益倡導者。'
  },
  {
    id: 'q-3',
    categoryId: 'cat-1',
    subjectId: 'sub-1',
    chapterId: 'chap-2',
    type: 'boolean',
    difficulty: 'easy',
    title: '根據新公共管理 (NPM) 理論，政府應扮演「導航 (Steering)」而非「划槳 (Rowing)」的角色。',
    options: ['正確 (True)', '錯誤 (False)'],
    correctAnswer: [0],
    explanation: '歐斯本 (Osborne) 與蓋布勒 (Gaebler) 在《新政府運動》中提出此觀點，強調政府應專注於政策規劃與目標設定（導航），具體執行可透過市場或民營化處理（划槳）。'
  },
  {
    id: 'q-4',
    categoryId: 'cat-2',
    subjectId: 'sub-2',
    chapterId: 'chap-3',
    type: 'single',
    difficulty: 'medium',
    title: 'Select the word that best completes the sentence: "The manager was highly ________ of the new proposals until he saw the detailed financial analysis."',
    options: ['skeptical', 'enthusiastic', 'optimistic', 'reassured'],
    correctAnswer: [0],
    explanation: 'Skeptical 意為「持懷疑態度的」。句意：經理在看到詳細的財務分析之前，對新提案抱持高度懷疑。'
  }
];

export default function SmartQuizApp() {
  // --- Global Navigation State ---
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, quiz-setup, quiz-session, wrong-questions, statistics, admin

  // --- Persistent Storage State ---
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('smart_quiz_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [subjects, setSubjects] = useState(() => {
    const saved = localStorage.getItem('smart_quiz_subjects');
    return saved ? JSON.parse(saved) : INITIAL_SUBJECTS;
  });

  const [chapters, setChapters] = useState(() => {
    const saved = localStorage.getItem('smart_quiz_chapters');
    return saved ? JSON.parse(saved) : INITIAL_CHAPTERS;
  });

  const [questions, setQuestions] = useState(() => {
    const saved = localStorage.getItem('smart_quiz_questions');
    return saved ? JSON.parse(saved) : INITIAL_QUESTIONS;
  });

  // Wrong Questions: { [questionId]: { count: number, lastWrongAt: string, isMastered: boolean, isFavorite: boolean } }
  const [wrongRecords, setWrongRecords] = useState(() => {
    const saved = localStorage.getItem('smart_quiz_wrong_records');
    return saved ? JSON.parse(saved) : {};
  });

  // User Answer Logs: Array<{ id, questionId, isCorrect, timestamp, selectedOptions, durationSec }>
  const [answerLogs, setAnswerLogs] = useState(() => {
    const saved = localStorage.getItem('smart_quiz_answer_logs');
    return saved ? JSON.parse(saved) : [
      { id: 'log-1', questionId: 'q-1', isCorrect: true, timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), durationSec: 15 },
      { id: 'log-2', questionId: 'q-2', isCorrect: false, timestamp: new Date(Date.now() - 86400000).toISOString(), durationSec: 30 },
      { id: 'log-3', questionId: 'q-3', isCorrect: true, timestamp: new Date().toISOString(), durationSec: 10 },
    ];
  });

  // Favorites state: Set of questionIds
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('smart_quiz_favorites');
    return saved ? JSON.parse(saved) : ['q-2'];
  });

  // Save to LocalStorage on updates
  useEffect(() => {
    localStorage.setItem('smart_quiz_categories', JSON.stringify(categories));
  }, [categories]);
  useEffect(() => {
    localStorage.setItem('smart_quiz_subjects', JSON.stringify(subjects));
  }, [subjects]);
  useEffect(() => {
    localStorage.setItem('smart_quiz_chapters', JSON.stringify(chapters));
  }, [chapters]);
  useEffect(() => {
    localStorage.setItem('smart_quiz_questions', JSON.stringify(questions));
  }, [questions]);
  useEffect(() => {
    localStorage.setItem('smart_quiz_wrong_records', JSON.stringify(wrongRecords));
  }, [wrongRecords]);
  useEffect(() => {
    localStorage.setItem('smart_quiz_answer_logs', JSON.stringify(answerLogs));
  }, [answerLogs]);
  useEffect(() => {
    localStorage.setItem('smart_quiz_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // --- Active Quiz Session Configuration ---
  const [quizConfig, setQuizConfig] = useState({
    mode: 'random', // random, sequential, chapter, difficulty, wrong, favorite
    categoryId: '',
    subjectId: '',
    chapterId: '',
    difficulty: 'all',
    questionCount: 5,
  });

  // Active Quiz State
  const [activeQuizQuestions, setActiveQuizQuestions] = useState([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [sessionAnswers, setSessionAnswers] = useState({}); // { [qId]: number[] }
  const [sessionSubmitted, setSessionSubmitted] = useState({}); // { [qId]: boolean }
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [sessionElapsedSec, setSessionElapsedSec] = useState(0);

  // Timer effect for quiz session
  useEffect(() => {
    let timer;
    if (activeTab === 'quiz-session' && !sessionCompleted) {
      timer = setInterval(() => {
        setSessionElapsedSec(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeTab, sessionCompleted]);

  // --- Handler Functions ---
  const handleStartQuiz = (customQuestions = null, modeLabel = '') => {
    let pool = customQuestions ? [...customQuestions] : [...questions];

    if (!customQuestions) {
      if (quizConfig.categoryId) {
        pool = pool.filter(q => q.categoryId === quizConfig.categoryId);
      }
      if (quizConfig.subjectId) {
        pool = pool.filter(q => q.subjectId === quizConfig.subjectId);
      }
      if (quizConfig.chapterId) {
        pool = pool.filter(q => q.chapterId === quizConfig.chapterId);
      }
      if (quizConfig.difficulty !== 'all') {
        pool = pool.filter(q => q.difficulty === quizConfig.difficulty);
      }

      if (quizConfig.mode === 'random') {
        pool = pool.sort(() => Math.random() - 0.5);
      }
      
      const count = Math.min(quizConfig.questionCount, pool.length > 0 ? pool.length : 1);
      pool = pool.slice(0, count);
    }

    if (pool.length === 0) {
      alert('所選條件下無符合題目，請調整篩選條件！');
      return;
    }

    setActiveQuizQuestions(pool);
    setCurrentQuizIndex(0);
    setSessionAnswers({});
    setSessionSubmitted({});
    setSessionStartTime(Date.now());
    setSessionElapsedSec(0);
    setSessionCompleted(false);
    setActiveTab('quiz-session');
  };

  const handleToggleFavorite = (qId) => {
    setFavorites(prev => {
      if (prev.includes(qId)) {
        return prev.filter(id => id !== qId);
      } else {
        return [...prev, qId];
      }
    });
  };

  const handleToggleMastered = (qId) => {
    setWrongRecords(prev => {
      const existing = prev[qId] || { count: 1, lastWrongAt: new Date().toISOString(), isMastered: false };
      return {
        ...prev,
        [qId]: { ...existing, isMastered: !existing.isMastered }
      };
    });
  };

  const handleSelectOption = (questionId, optionIdx, isMultiple) => {
    if (sessionSubmitted[questionId]) return; // Already submitted

    setSessionAnswers(prev => {
      const current = prev[questionId] || [];
      if (isMultiple) {
        if (current.includes(optionIdx)) {
          return { ...prev, [questionId]: current.filter(i => i !== optionIdx) };
        } else {
          return { ...prev, [questionId]: [...current, optionIdx] };
        }
      } else {
        return { ...prev, [questionId]: [optionIdx] };
      }
    });
  };

  const handleSubmitAnswer = (qId) => {
    const question = questions.find(q => q.id === qId);
    if (!question) return;

    const userAns = (sessionAnswers[qId] || []).sort();
    const correctAns = [...question.correctAnswer].sort();
    const isCorrect = userAns.length === correctAns.length && userAns.every((val, idx) => val === correctAns[idx]);

    // Record submission
    setSessionSubmitted(prev => ({ ...prev, [qId]: true }));

    // Add answer log
    const newLog = {
      id: 'log-' + Date.now(),
      questionId: qId,
      isCorrect,
      timestamp: new Date().toISOString(),
      selectedOptions: userAns,
      durationSec: sessionElapsedSec
    };
    setAnswerLogs(prev => [newLog, ...prev]);

    // Update wrong questions record
    if (!isCorrect) {
      setWrongRecords(prev => {
        const existing = prev[qId] || { count: 0, lastWrongAt: new Date().toISOString(), isMastered: false };
        return {
          ...prev,
          [qId]: {
            ...existing,
            count: existing.count + 1,
            lastWrongAt: new Date().toISOString(),
            isMastered: false // Mark unmastered on new error
          }
        };
      });
    }
  };

  const handleFinishSession = () => {
    setSessionCompleted(true);
  };

  // Helper Stats
  const totalAnswered = answerLogs.length;
  const totalCorrect = answerLogs.filter(l => l.isCorrect).length;
  const overallAccuracy = totalAnswered > 0 ? ((totalCorrect / totalAnswered) * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans pb-16 md:pb-0">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="bg-blue-600 text-white p-1.5 sm:p-2 rounded-xl shadow-md">
              <BrainCircuit className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg sm:text-xl text-slate-900 tracking-tight flex items-center gap-1.5">
                智慧刷題 <span className="text-blue-600 hidden xs:inline">Smart Quiz</span>
                <span className="text-[10px] sm:text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">v1.1 Mobile</span>
              </h1>
            </div>
          </div>

          {/* User Profile / Status */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-1 rounded-lg text-xs font-medium">
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>連續 <strong>3</strong> 天</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col md:flex-row gap-6">
        {/* Desktop Navigation Sidebar */}
        <aside className="hidden md:block w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-sm sticky top-22">
            <nav className="space-y-1">
              <NavItem 
                icon={<LayoutDashboard className="w-5 h-5" />} 
                label="首頁總覽" 
                active={activeTab === 'dashboard'} 
                onClick={() => setActiveTab('dashboard')} 
              />
              <NavItem 
                icon={<BookOpen className="w-5 h-5" />} 
                label="題庫與刷題" 
                active={activeTab === 'quiz-setup'} 
                onClick={() => setActiveTab('quiz-setup')} 
              />
              <NavItem 
                icon={<BookMarked className="w-5 h-5" />} 
                label="錯題本與收藏" 
                badge={Object.keys(wrongRecords).length}
                active={activeTab === 'wrong-questions'} 
                onClick={() => setActiveTab('wrong-questions')} 
              />
              <NavItem 
                icon={<BarChart3 className="w-5 h-5" />} 
                label="學習統計分析" 
                active={activeTab === 'statistics'} 
                onClick={() => setActiveTab('statistics')} 
              />
              <NavItem 
                icon={<Settings className="w-5 h-5" />} 
                label="題庫管理後台" 
                active={activeTab === 'admin'} 
                onClick={() => setActiveTab('admin')} 
              />
            </nav>

            {/* Quick Quick Start Box */}
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md">
              <h4 className="font-semibold text-sm mb-1">準備好考試了嗎？</h4>
              <p className="text-xs text-blue-100 mb-3 leading-relaxed">一鍵隨機出題，快速檢視學習成效！</p>
              <button 
                onClick={() => handleStartQuiz()}
                className="w-full bg-white text-blue-700 hover:bg-blue-50 font-medium text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                立即開始隨機刷題
              </button>
            </div>
          </div>
        </aside>

        {/* Content View Routing */}
        <main className="flex-1 min-w-0">
          {activeTab === 'dashboard' && (
            <DashboardView 
              questions={questions}
              categories={categories}
              subjects={subjects}
              answerLogs={answerLogs}
              wrongRecords={wrongRecords}
              onStartQuiz={() => setActiveTab('quiz-setup')}
              onGoToWrong={() => setActiveTab('wrong-questions')}
            />
          )}

          {activeTab === 'quiz-setup' && (
            <QuizSetupView 
              categories={categories}
              subjects={subjects}
              chapters={chapters}
              questions={questions}
              quizConfig={quizConfig}
              setQuizConfig={setQuizConfig}
              onStartQuiz={handleStartQuiz}
            />
          )}

          {activeTab === 'quiz-session' && (
            <QuizSessionView 
              questions={activeQuizQuestions}
              currentIndex={currentQuizIndex}
              setCurrentIndex={setCurrentQuizIndex}
              sessionAnswers={sessionAnswers}
              sessionSubmitted={sessionSubmitted}
              onSelectOption={handleSelectOption}
              onSubmitAnswer={handleSubmitAnswer}
              onFinishSession={handleFinishSession}
              isCompleted={sessionCompleted}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              elapsedSec={sessionElapsedSec}
              onRestart={() => setActiveTab('quiz-setup')}
            />
          )}

          {activeTab === 'wrong-questions' && (
            <WrongQuestionsView 
              questions={questions}
              wrongRecords={wrongRecords}
              favorites={favorites}
              subjects={subjects}
              chapters={chapters}
              onToggleFavorite={handleToggleFavorite}
              onToggleMastered={handleToggleMastered}
              onStartPractice={(selectedQs) => handleStartQuiz(selectedQs)}
            />
          )}

          {activeTab === 'statistics' && (
            <StatisticsView 
              answerLogs={answerLogs}
              questions={questions}
              subjects={subjects}
              chapters={chapters}
            />
          )}

          {activeTab === 'admin' && (
            <AdminView 
              categories={categories}
              setCategories={setCategories}
              subjects={subjects}
              setSubjects={setSubjects}
              chapters={chapters}
              setChapters={setChapters}
              questions={questions}
              setQuestions={setQuestions}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 px-2 py-1 flex justify-around items-center shadow-lg">
        <MobileNavItem 
          icon={<LayoutDashboard className="w-5 h-5" />} 
          label="總覽" 
          active={activeTab === 'dashboard'} 
          onClick={() => setActiveTab('dashboard')} 
        />
        <MobileNavItem 
          icon={<BookOpen className="w-5 h-5" />} 
          label="刷題" 
          active={activeTab === 'quiz-setup' || activeTab === 'quiz-session'} 
          onClick={() => setActiveTab('quiz-setup')} 
        />
        <MobileNavItem 
          icon={<BookMarked className="w-5 h-5" />} 
          label="錯題" 
          badge={Object.keys(wrongRecords).length}
          active={activeTab === 'wrong-questions'} 
          onClick={() => setActiveTab('wrong-questions')} 
        />
        <MobileNavItem 
          icon={<BarChart3 className="w-5 h-5" />} 
          label="統計" 
          active={activeTab === 'statistics'} 
          onClick={() => setActiveTab('statistics')} 
        />
        <MobileNavItem 
          icon={<Settings className="w-5 h-5" />} 
          label="管理" 
          active={activeTab === 'admin'} 
          onClick={() => setActiveTab('admin')} 
        />
      </div>
    </div>
  );
}

// Sidebar Nav Item Component
function NavItem({ icon, label, active, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
        active 
          ? 'bg-blue-50 text-blue-700 font-semibold' 
          : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className={active ? 'text-blue-600' : 'text-slate-400'}>{icon}</span>
        <span>{label}</span>
      </div>
      {typeof badge === 'number' && badge > 0 && (
        <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
          {badge}
        </span>
      )}
    </button>
  );
}

// Mobile Bottom Nav Item Component
function MobileNavItem({ icon, label, active, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
        active ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800 font-medium'
      }`}
    >
      <div className="relative">
        {icon}
        {typeof badge === 'number' && badge > 0 && (
          <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <span className="text-[10px] mt-0.5">{label}</span>
    </button>
  );
}

// ==========================================
// 1. 首頁總覽畫面 (Dashboard View)
// ==========================================
function DashboardView({ questions, categories, subjects, answerLogs, wrongRecords, onStartQuiz, onGoToWrong }) {
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogs = answerLogs.filter(log => log.timestamp.startsWith(todayStr));
  const todayCount = todayLogs.length;

  const totalQuestions = questions.length;
  const totalAnswered = answerLogs.length;
  const totalCorrect = answerLogs.filter(l => l.isCorrect).length;
  const overallAccuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  const wrongCount = Object.keys(wrongRecords).filter(qId => !wrongRecords[qId].isMastered).length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2">歡迎回來，開始今天的刷題挑戰吧！</h2>
          <p className="text-blue-100 text-sm max-w-xl">
            「持續複習與正確分析錯題，是通往高分的唯一捷徑。」今天已完成 <span className="underline font-bold text-white">{todayCount}</span> 道題目。
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button 
              onClick={onStartQuiz}
              className="bg-white text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 shadow transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              開始練習
            </button>
            <button 
              onClick={onGoToWrong}
              className="bg-blue-500/40 hover:bg-blue-500/60 text-white border border-white/30 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all backdrop-blur-sm"
            >
              <BookMarked className="w-4 h-4" />
              重練錯題 ({wrongCount})
            </button>
          </div>
        </div>
        {/* Background Decorative Graphic */}
        <BrainCircuit className="absolute -right-8 -bottom-8 w-60 h-60 text-white/10 pointer-events-none" />
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">總題庫數量</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalQuestions} <span className="text-xs font-normal text-slate-500">題</span></div>
          <div className="text-xs text-slate-400 mt-1">涵蓋 {categories.length} 個考試類別</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">累積練習次數</span>
            <CheckSquare className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalAnswered} <span className="text-xs font-normal text-slate-500">次</span></div>
          <div className="text-xs text-emerald-600 mt-1">今日 +{todayCount} 題</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">整體答對率</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{overallAccuracy}%</div>
          <div className="text-xs text-slate-400 mt-1">累積答對 {totalCorrect} 題</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">待複習錯題</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{wrongCount} <span className="text-xs font-normal text-slate-500">題</span></div>
          <div className="text-xs text-rose-500 mt-1">{wrongCount > 0 ? '建議撥空複習' : '目前表現優異'}</div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subject Progress Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              科目學習進度
            </h3>
          </div>

          <div className="space-y-3">
            {subjects.map(sub => {
              const subQuestions = questions.filter(q => q.subjectId === sub.id);
              const subQIds = subQuestions.map(q => q.id);
              const subLogs = answerLogs.filter(l => subQIds.includes(l.questionId));
              const subCorrect = subLogs.filter(l => l.isCorrect).length;
              const accuracy = subLogs.length > 0 ? Math.round((subCorrect / subLogs.length) * 100) : 0;

              return (
                <div key={sub.id} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:border-blue-200 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm">{sub.name}</h4>
                      <p className="text-xs text-slate-500">題庫總計 {subQuestions.length} 題 • 已作答 {subLogs.length} 次</p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                      正確率 {accuracy}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${accuracy}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Smart Recommendations */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            智慧學習建議
          </h3>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 text-amber-900 border border-amber-100 text-xs leading-relaxed">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong>錯題提醒：</strong>
                目前有 <strong>{wrongCount}</strong> 道尚未標記熟悉的錯題，建議今日優先進行「錯題強化練習」。
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 text-blue-900 border border-blue-100 text-xs leading-relaxed">
              <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong>節奏良好：</strong>
                您已連續學習 3 天！維持每日 15 分鐘刷題，複習效果最佳。
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. 題庫與刷題設定頁 (Quiz Setup View)
// ==========================================
function QuizSetupView({ categories, subjects, chapters, questions, quizConfig, setQuizConfig, onStartQuiz }) {
  const filteredSubjects = useMemo(() => {
    return quizConfig.categoryId 
      ? subjects.filter(s => s.categoryId === quizConfig.categoryId)
      : subjects;
  }, [subjects, quizConfig.categoryId]);

  const filteredChapters = useMemo(() => {
    return quizConfig.subjectId 
      ? chapters.filter(c => c.subjectId === quizConfig.subjectId)
      : chapters;
  }, [chapters, quizConfig.subjectId]);

  const poolCount = useMemo(() => {
    return questions.filter(q => {
      if (quizConfig.categoryId && q.categoryId !== quizConfig.categoryId) return false;
      if (quizConfig.subjectId && q.subjectId !== quizConfig.subjectId) return false;
      if (quizConfig.chapterId && q.chapterId !== quizConfig.chapterId) return false;
      if (quizConfig.difficulty !== 'all' && q.difficulty !== quizConfig.difficulty) return false;
      return true;
    }).length;
  }, [questions, quizConfig]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-xl font-bold text-slate-900">設定刷題模式與條件</h2>
          <p className="text-xs text-slate-500 mt-1">自訂最適合您當前學習進度的考題組合</p>
        </div>

        {/* Mode Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">刷題模式</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'random', title: '隨機抽題', desc: '全庫隨機揀選考題' },
              { id: 'sequential', title: '順序刷題', desc: '依題庫建立順序練習' },
              { id: 'chapter', title: '依章節練', desc: '鎖定特定章節單元' },
              { id: 'difficulty', title: '難度篩選', desc: '專攻特定難度等級' },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setQuizConfig({ ...quizConfig, mode: m.id })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  quizConfig.mode === m.id 
                    ? 'border-blue-600 bg-blue-50/50 text-blue-900 ring-2 ring-blue-500/20' 
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div className="font-semibold text-sm">{m.title}</div>
                <div className="text-xs text-slate-400 mt-0.5">{m.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">考試類別</label>
            <select 
              value={quizConfig.categoryId}
              onChange={(e) => setQuizConfig({ ...quizConfig, categoryId: e.target.value, subjectId: '', chapterId: '' })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部考試類別</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">科目</label>
            <select 
              value={quizConfig.subjectId}
              onChange={(e) => setQuizConfig({ ...quizConfig, subjectId: e.target.value, chapterId: '' })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部科目</option>
              {filteredSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">章節</label>
            <select 
              value={quizConfig.chapterId}
              onChange={(e) => setQuizConfig({ ...quizConfig, chapterId: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部章節</option>
              {filteredChapters.map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
            </select>
          </div>
        </div>

        {/* Difficulty & Count */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">題目難度</label>
            <div className="flex gap-2">
              {[
                { id: 'all', label: '全部' },
                { id: 'easy', label: '簡單' },
                { id: 'medium', label: '中等' },
                { id: 'hard', label: '困難' }
              ].map(d => (
                <button
                  key={d.id}
                  onClick={() => setQuizConfig({ ...quizConfig, difficulty: d.id })}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    quizConfig.difficulty === d.id
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">本次練習題數</label>
            <div className="flex gap-2">
              {[5, 10, 20, 50].map(cnt => (
                <button
                  key={cnt}
                  onClick={() => setQuizConfig({ ...quizConfig, questionCount: cnt })}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    quizConfig.questionCount === cnt
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cnt} 題
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Start Button & Summary */}
        <div className="border-t border-slate-100 pt-5 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            符合條件題目總數：<strong className="text-blue-600 text-sm">{poolCount}</strong> 題
          </div>
          <button
            onClick={() => onStartQuiz()}
            disabled={poolCount === 0}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md transition-all ${
              poolCount > 0 
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/25' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            開始刷題練習
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. 刷題進行頁 (Quiz Session View)
// ==========================================
function QuizSessionView({ 
  questions, currentIndex, setCurrentIndex, sessionAnswers, sessionSubmitted,
  onSelectOption, onSubmitAnswer, onFinishSession, isCompleted,
  favorites, onToggleFavorite, elapsedSec, onRestart
}) {
  if (!questions || questions.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
        <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-700">尚未載入練習考題</h3>
        <button onClick={onRestart} className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl">
          返回設定
        </button>
      </div>
    );
  }

  // If session is completed, show summary result screen
  if (isCompleted) {
    let correctCount = 0;
    questions.forEach(q => {
      const uAns = (sessionAnswers[q.id] || []).sort();
      const cAns = [...q.correctAnswer].sort();
      if (uAns.length === cAns.length && uAns.every((v, i) => v === cAns[i])) {
        correctCount++;
      }
    });

    const accuracy = Math.round((correctCount / questions.length) * 100);
    const mins = Math.floor(elapsedSec / 60);
    const secs = elapsedSec % 60;

    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <Award className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900">恭喜完成本次刷題練習！</h2>
          <p className="text-slate-500 text-xs mt-1">數據已自動寫入個人學習歷程紀錄</p>
        </div>

        <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl">
          <div>
            <div className="text-xs text-slate-500 mb-1">總題數</div>
            <div className="text-xl font-bold text-slate-900">{questions.length} 題</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">正確率</div>
            <div className="text-xl font-bold text-emerald-600">{accuracy}%</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">本次耗時</div>
            <div className="text-xl font-bold text-slate-900">{mins}分 {secs}秒</div>
          </div>
        </div>

        <div className="flex gap-3 justify-center pt-2">
          <button 
            onClick={onRestart}
            className="px-5 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 text-sm font-semibold rounded-xl transition-all"
          >
            返回題庫
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const isMultiple = currentQ.type === 'multiple';
  const isSubmitted = sessionSubmitted[currentQ.id];
  const userAns = sessionAnswers[currentQ.id] || [];
  const isFav = favorites.includes(currentQ.id);

  const mins = Math.floor(elapsedSec / 60);
  const secs = elapsedSec % 60;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Quiz Header Bar */}
      <div className="bg-white px-5 py-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-2.5 py-1 bg-blue-100 text-blue-700 rounded-md">
            題目 {currentIndex + 1} / {questions.length}
          </span>
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleFavorite(currentQ.id)}
            className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              isFav ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Star className={`w-4 h-4 ${isFav ? 'fill-amber-500 text-amber-500' : ''}`} />
            {isFav ? '已收藏' : '收藏'}
          </button>
          <button
            onClick={onFinishSession}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-semibold rounded-lg transition-all"
          >
            結束練習
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
        <div 
          className="bg-blue-600 h-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Main Question Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
              currentQ.type === 'single' ? 'bg-indigo-100 text-indigo-700' :
              currentQ.type === 'multiple' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'
            }`}>
              {currentQ.type === 'single' ? '單選題' : currentQ.type === 'multiple' ? '複選題' : '是非題'}
            </span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
              currentQ.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700' :
              currentQ.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
            }`}>
              {currentQ.difficulty === 'easy' ? '簡單' : currentQ.difficulty === 'medium' ? '中等' : '困難'}
            </span>
          </div>

          <h3 className="text-lg font-bold text-slate-900 leading-relaxed">
            {currentQ.title}
          </h3>
        </div>

        {/* Options List */}
        <div className="space-y-3">
          {currentQ.options.map((opt, idx) => {
            const isSelected = userAns.includes(idx);
            const isCorrectOption = currentQ.correctAnswer.includes(idx);

            let btnStyle = 'border-slate-200 hover:border-blue-400 bg-white text-slate-800';
            if (isSelected) {
              btnStyle = 'border-blue-600 bg-blue-50/50 text-blue-900 ring-2 ring-blue-500/20';
            }

            if (isSubmitted) {
              if (isCorrectOption) {
                btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 font-semibold';
              } else if (isSelected && !isCorrectOption) {
                btnStyle = 'border-rose-500 bg-rose-50 text-rose-900';
              } else {
                btnStyle = 'border-slate-100 bg-slate-50 text-slate-400 opacity-60';
              }
            }

            return (
              <button
                key={idx}
                disabled={isSubmitted}
                onClick={() => onSelectOption(currentQ.id, idx, isMultiple)}
                className={`w-full p-4 rounded-xl border text-left flex items-start gap-3 transition-all ${btnStyle}`}
              >
                <div className="mt-0.5">
                  {isMultiple ? (
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'}`}>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  ) : (
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'border-blue-600 text-blue-600' : 'border-slate-300'}`}>
                      {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                    </div>
                  )}
                </div>
                <div className="flex-1 text-sm leading-relaxed">{opt}</div>
              </button>
            );
          })}
        </div>

        {/* Action Button: Submit Answer */}
        {!isSubmitted && (
          <div className="pt-2">
            <button
              onClick={() => onSubmitAnswer(currentQ.id)}
              disabled={userAns.length === 0}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all shadow ${
                userAns.length > 0 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              提交答案
            </button>
          </div>
        )}

        {/* Answer Explanation Display */}
        {isSubmitted && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs leading-relaxed animate-in fade-in duration-300">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <Sparkles className="w-4 h-4 text-amber-500" />
              詳解說明
            </div>
            <p className="text-slate-600">{currentQ.explanation}</p>
          </div>
        )}
      </div>

      {/* Navigation Footer Controls */}
      <div className="flex items-center justify-between pt-2">
        <button
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex(prev => prev - 1)}
          className={`flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
            currentIndex > 0 ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50' : 'opacity-40 cursor-not-allowed border-slate-200'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          上一題
        </button>

        {currentIndex < questions.length - 1 ? (
          <button
            onClick={() => setCurrentIndex(prev => prev + 1)}
            className="flex items-center gap-1 px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow transition-all"
          >
            下一題
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={onFinishSession}
            className="flex items-center gap-1 px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow transition-all"
          >
            完成練習
            <Check className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 4. 錯題本與收藏頁 (Wrong Questions View)
// ==========================================
function WrongQuestionsView({ questions, wrongRecords, favorites, subjects, chapters, onToggleFavorite, onToggleMastered, onStartPractice }) {
  const [filterSub, setFilterSub] = useState('');
  const [filterTab, setFilterTab] = useState('wrong'); // wrong, favorite

  const wrongList = useMemo(() => {
    return questions.filter(q => {
      if (filterTab === 'wrong') {
        const rec = wrongRecords[q.id];
        if (!rec || rec.isMastered) return false;
      } else if (filterTab === 'favorite') {
        if (!favorites.includes(q.id)) return false;
      }
      if (filterSub && q.subjectId !== filterSub) return false;
      return true;
    });
  }, [questions, wrongRecords, favorites, filterSub, filterTab]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">錯題與重點收藏本</h2>
          <p className="text-xs text-slate-500 mt-0.5">系統自動累積強化難題，隨時重新複習</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onStartPractice(wrongList)}
            disabled={wrongList.length === 0}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow ${
              wrongList.length > 0 ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            重新練習選取題目 ({wrongList.length})
          </button>
        </div>
      </div>

      {/* Tabs and Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex bg-slate-200/60 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setFilterTab('wrong')}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterTab === 'wrong' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            待複習錯題
          </button>
          <button
            onClick={() => setFilterTab('favorite')}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterTab === 'favorite' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            重點收藏題目 ({favorites.length})
          </button>
        </div>

        {/* Subject Filter Dropdown */}
        <select
          value={filterSub}
          onChange={(e) => setFilterSub(e.target.value)}
          className="w-full sm:w-48 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none"
        >
          <option value="">全部科目</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Question Cards List */}
      <div className="space-y-4">
        {wrongList.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">太棒了！無任何待處理的題目</p>
          </div>
        ) : (
          wrongList.map(q => {
            const rec = wrongRecords[q.id];
            const isFav = favorites.includes(q.id);

            return (
              <div key={q.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {subjects.find(s => s.id === q.subjectId)?.name || '未分類'}
                      </span>
                      {rec && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700">
                          答錯 {rec.count} 次
                        </span>
                      )}
                    </div>
                    <h4 className="font-semibold text-slate-900 text-sm leading-snug">{q.title}</h4>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => onToggleFavorite(q.id)}
                      className={`p-1.5 rounded-lg text-xs transition-all ${
                        isFav ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${isFav ? 'fill-amber-500 text-amber-500' : ''}`} />
                    </button>
                    {rec && (
                      <button
                        onClick={() => onToggleMastered(q.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          rec.isMastered 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {rec.isMastered ? '已熟悉' : '標記已熟悉'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
                  <div className="font-semibold text-slate-800">正確答案選項：</div>
                  <div>
                    {q.correctAnswer.map(idx => `${String.fromCharCode(65 + idx)}. ${q.options[idx]}`).join(' / ')}
                  </div>
                  <div className="pt-1 text-slate-500 border-t border-slate-200/60 mt-1">
                    <strong className="text-slate-700">解析：</strong>{q.explanation}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ==========================================
// 5. 學習統計分析頁 (Statistics View)
// ==========================================
function StatisticsView({ answerLogs, questions, subjects }) {
  // Chart Data Preparation
  const dailyData = useMemo(() => {
    const daysMap = {};
    answerLogs.forEach(log => {
      const dateKey = log.timestamp.split('T')[0];
      if (!daysMap[dateKey]) daysMap[dateKey] = { date: dateKey, total: 0, correct: 0 };
      daysMap[dateKey].total += 1;
      if (log.isCorrect) daysMap[dateKey].correct += 1;
    });

    return Object.values(daysMap).sort((a, b) => a.date.localeCompare(b.date));
  }, [answerLogs]);

  const subjectData = useMemo(() => {
    return subjects.map(sub => {
      const subQuestions = questions.filter(q => q.subjectId === sub.id);
      const subQIds = subQuestions.map(q => q.id);
      const logs = answerLogs.filter(l => subQIds.includes(l.questionId));
      const correct = logs.filter(l => l.isCorrect).length;
      return {
        name: sub.name,
        total: logs.length,
        correct: correct,
        accuracy: logs.length > 0 ? Math.round((correct / logs.length) * 100) : 0
      };
    });
  }, [answerLogs, questions, subjects]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">學習數據與視覺化圖表</h2>
        <p className="text-xs text-slate-500 mt-0.5">客觀分析答題趨勢，精準抓出複習痛點</p>
      </div>

      {/* Line Chart: Daily Quiz Count */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">每日刷題趨勢</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="total" name="刷題總數" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="correct" name="答對題數" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart: Subject Performance */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">各科目正確率分析 (%)</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={subjectData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="accuracy" name="正確率 (%)" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 6. 題庫與分類後台管理頁 (Admin View)
// ==========================================
function AdminView({ categories, setCategories, subjects, setSubjects, chapters, setChapters, questions, setQuestions }) {
  const [adminTab, setAdminTab] = useState('questions'); // questions, categories, import
  const [showAddModal, setShowAddModal] = useState(false);

  // New Question Form State
  const [newQ, setNewQ] = useState({
    title: '',
    categoryId: categories[0]?.id || '',
    subjectId: subjects[0]?.id || '',
    chapterId: chapters[0]?.id || '',
    type: 'single',
    difficulty: 'medium',
    options: ['', '', '', ''],
    correctAnswer: [0],
    explanation: ''
  });

  const handleAddQuestionSubmit = (e) => {
    e.preventDefault();
    if (!newQ.title) return alert('請填寫題目內容！');

    const created = {
      ...newQ,
      id: 'q-' + Date.now(),
    };

    setQuestions(prev => [created, ...prev]);
    setShowAddModal(false);
    alert('題目新增成功！');
  };

  const handleDeleteQuestion = (qId) => {
    if (confirm('確定要刪除這道題目嗎？')) {
      setQuestions(prev => prev.filter(q => q.id !== qId));
    }
  };

  // CSV Import Simulation Handler
  const handleCSVImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        // Header line expected: title,type,difficulty,opt0,opt1,opt2,opt3,correct,explanation
        const newQs = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',');
          if (cols.length >= 8) {
            newQs.push({
              id: 'q-import-' + Date.now() + '-' + i,
              categoryId: categories[0]?.id || '',
              subjectId: subjects[0]?.id || '',
              chapterId: chapters[0]?.id || '',
              title: cols[0],
              type: cols[1] || 'single',
              difficulty: cols[2] || 'medium',
              options: [cols[3], cols[4], cols[5], cols[6]],
              correctAnswer: [parseInt(cols[7]) || 0],
              explanation: cols[8] || '匯入題庫解析'
            });
          }
        }
        if (newQs.length > 0) {
          setQuestions(prev => [...newQs, ...prev]);
          alert(`成功匯入 ${newQs.length} 道題目！`);
        } else {
          alert('匯入失敗，請確認 CSV 格式正確！');
        }
      } catch (err) {
        alert('解析 CSV 檔案時發生錯誤。');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">題庫管理者專區</h2>
          <p className="text-xs text-slate-500 mt-0.5">彈性自訂考試分類、章節與題目內容</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow transition-all"
        >
          <Plus className="w-4 h-4" />
          手動新增題目
        </button>
      </div>

      {/* Admin Tab Switcher */}
      <div className="flex bg-slate-200/60 p-1 rounded-xl">
        <button
          onClick={() => setAdminTab('questions')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
            adminTab === 'questions' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
          }`}
        >
          題庫列表 ({questions.length})
        </button>
        <button
          onClick={() => setAdminTab('import')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
            adminTab === 'import' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
          }`}
        >
          批次 CSV 匯入
        </button>
      </div>

      {/* Admin Tab 1: Questions List */}
      {adminTab === 'questions' && (
        <div className="space-y-3">
          {questions.map((q, idx) => (
            <div key={q.id} className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-400"># {idx + 1}</div>
                <h4 className="font-semibold text-slate-900 text-sm">{q.title}</h4>
                <div className="text-xs text-slate-500">
                  選項數量: {q.options.length} 個 • 正確解答: {q.correctAnswer.map(i => String.fromCharCode(65 + i)).join(', ')}
                </div>
              </div>

              <button
                onClick={() => handleDeleteQuestion(q.id)}
                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 border border-slate-100 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Admin Tab 2: Batch CSV Import */}
      {adminTab === 'import' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base">匯入考題 CSV 檔</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            CSV 標準標頭格式：<code className="bg-slate-100 px-1.5 py-0.5 rounded text-rose-600">title,type,difficulty,opt0,opt1,opt2,opt3,correct,explanation</code>
          </p>

          <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-50 transition-all">
            <Upload className="w-8 h-8 text-slate-400 mb-2" />
            <span className="text-xs font-bold text-slate-700">點擊選擇 CSV 檔案進行上傳</span>
            <input type="file" accept=".csv" onChange={handleCSVImport} className="hidden" />
          </label>
        </div>
      )}

      {/* Add Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">手動新增考題</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleAddQuestionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">題目敘述</label>
                <textarea 
                  value={newQ.title} 
                  onChange={e => setNewQ({ ...newQ, title: e.target.value })}
                  className="w-full border rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  rows={2} 
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">題型</label>
                  <select 
                    value={newQ.type} 
                    onChange={e => setNewQ({ ...newQ, type: e.target.value })}
                    className="w-full border rounded-xl p-2 bg-slate-50"
                  >
                    <option value="single">單選題</option>
                    <option value="multiple">複選題</option>
                    <option value="boolean">是非題</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">難度</label>
                  <select 
                    value={newQ.difficulty} 
                    onChange={e => setNewQ({ ...newQ, difficulty: e.target.value })}
                    className="w-full border rounded-xl p-2 bg-slate-50"
                  >
                    <option value="easy">簡單</option>
                    <option value="medium">中等</option>
                    <option value="hard">困難</option>
                  </select>
                </div>
              </div>

              {/* Options inputs */}
              <div className="space-y-2">
                <label className="block font-semibold text-slate-700">選項列表 (指定選項 A, B, C, D)</label>
                {newQ.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="font-bold text-slate-500">{String.fromCharCode(65 + i)}</span>
                    <input 
                      type="text" 
                      value={opt} 
                      onChange={e => {
                        const opts = [...newQ.options];
                        opts[i] = e.target.value;
                        setNewQ({ ...newQ, options: opts });
                      }} 
                      className="flex-1 border rounded-lg p-2 bg-slate-50" 
                      placeholder={`選項 ${String.fromCharCode(65 + i)}`}
                      required 
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">正確答案 (0 代表 A, 1 代表 B...)</label>
                <input 
                  type="text" 
                  value={newQ.correctAnswer.join(',')} 
                  onChange={e => setNewQ({ ...newQ, correctAnswer: e.target.value.split(',').map(n => parseInt(n.trim()) || 0) })}
                  className="w-full border rounded-xl p-2 bg-slate-50" 
                  placeholder="例如: 0 (若為複選填 0,2)" 
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">詳細解析</label>
                <textarea 
                  value={newQ.explanation} 
                  onChange={e => setNewQ({ ...newQ, explanation: e.target.value })}
                  className="w-full border rounded-xl p-2 bg-slate-50" 
                  rows={2} 
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded-xl">取消</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold">儲存題目</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
