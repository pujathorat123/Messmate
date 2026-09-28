import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CompareFloatingBar from './components/CompareFloatingBar';

// Pages
import HomePage from './pages/HomePage';
import FindMessPage from './pages/FindMessPage';
import MessDetailPage from './pages/MessDetailPage';
import ComparePage from './pages/ComparePage';
import ConfirmPage from './pages/ConfirmPage';
import ReviewsPage from './pages/ReviewsPage';

import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

function Toast() {
  const { toast } = useApp();
  if (!toast) return null;

  const bgStyles = {
    success: 'bg-emerald-900/90 text-white border-emerald-500',
    error: 'bg-rose-900/90 text-white border-rose-500',
    warning: 'bg-amber-900/90 text-white border-amber-500',
    info: 'bg-slate-900/90 text-white border-slate-700'
  }[toast.type] || 'bg-slate-900/90 text-white border-slate-700';

  const Icon = {
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertCircle,
    info: Info
  }[toast.type] || Info;

  return (
    <div className="fixed top-20 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
      <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border shadow-xl backdrop-blur-md text-xs sm:text-sm font-semibold ${bgStyles}`}>
        <Icon className="w-4 h-4 shrink-0 text-emerald-400" />
        <span>{toast.message}</span>
      </div>
    </div>
  );
}

function MainContent() {
  const { currentPage } = useApp();

  switch (currentPage) {
    case 'home':
      return <HomePage />;
    case 'find':
      return <FindMessPage />;
    case 'mess-details':
      return <MessDetailPage />;
    case 'compare':
      return <ComparePage />;
    case 'confirm':
      return <ConfirmPage />;
    case 'reviews':
      return <ReviewsPage />;
    default:
      return <HomePage />;
  }
}

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-emerald-500 selection:text-white">
        <Navbar />
        <main className="flex-1 w-full">
          <MainContent />
        </main>
        <CompareFloatingBar />
        <Toast />
        <Footer />
      </div>
    </AppProvider>
  );
}
