import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

// Helper to reliably parse hash and query parameters
function parseHash(hashStr) {
  if (!hashStr) return { page: 'home', params: {}, messId: null };
  
  // Remove leading # and optional /
  const clean = hashStr.replace(/^#\/?/, '');
  const [pathPart, queryPart] = clean.split('?');
  
  let page = 'home';
  let messId = null;

  if (pathPart && pathPart.startsWith('mess/')) {
    page = 'mess-details';
    messId = pathPart.replace('mess/', '').split('/')[0] || null;
  } else if (pathPart) {
    page = pathPart.replace(/\/$/, '') || 'home';
  }

  const params = {};
  if (queryPart) {
    const searchParams = new URLSearchParams(queryPart);
    for (const [k, v] of searchParams.entries()) {
      params[k] = v;
    }
  }

  return { page, params, messId };
}

export function AppProvider({ children }) {
  const initial = parseHash(window.location.hash);

  // Navigation state with robust hash sync
  const [currentPage, setCurrentPage] = useState(initial.page || 'home');
  const [pageParams, setPageParams] = useState(initial.params || {});
  const [selectedMessId, setSelectedMessId] = useState(initial.messId || null);

  // Compare List (persist to localStorage)
  const [compareList, setCompareList] = useState(() => {
    try {
      const saved = localStorage.getItem('quickmess_compare');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Lunch Passes (persist to localStorage)
  const [passes, setPasses] = useState(() => {
    try {
      const saved = localStorage.getItem('quickmess_passes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activePass, setActivePass] = useState(() => {
    try {
      const saved = localStorage.getItem('quickmess_active_pass');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Global search query state for smooth cross-page searching
  const [globalSearch, setGlobalSearch] = useState('');

  // Toast notification state
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Sync hash changes reliably
  useEffect(() => {
    const handleHashChange = () => {
      const parsed = parseHash(window.location.hash);
      setCurrentPage(parsed.page);
      setPageParams(parsed.params);
      if (parsed.messId) {
        setSelectedMessId(parsed.messId);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Navigate helper
  const navigate = (page, params = {}, messId = null) => {
    let url = `#/${page}`;
    if (messId) {
      url = `#/mess/${messId}`;
      setSelectedMessId(messId);
      setCurrentPage('mess-details');
    } else {
      setCurrentPage(page);
    }

    const query = new URLSearchParams(params).toString();
    if (query) {
      url += `?${query}`;
    }
    window.location.hash = url;
    setPageParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Compare helpers
  const addToCompare = (mess) => {
    if (!mess || !mess.id) return;
    if (compareList.some((m) => m.id === mess.id)) {
      showToast(`${mess.name} is already in comparison!`, 'info');
      return;
    }
    if (compareList.length >= 3) {
      showToast('You can compare up to 3 messes at once. Please remove one first.', 'warning');
      return;
    }
    const updated = [...compareList, mess];
    setCompareList(updated);
    localStorage.setItem('quickmess_compare', JSON.stringify(updated));
    showToast(`Added ${mess.name} to comparison!`, 'success');
  };

  const removeFromCompare = (messId) => {
    const updated = compareList.filter((m) => m.id !== messId);
    setCompareList(updated);
    localStorage.setItem('quickmess_compare', JSON.stringify(updated));
    showToast('Removed mess from comparison', 'info');
  };

  const clearCompare = () => {
    setCompareList([]);
    localStorage.removeItem('quickmess_compare');
    showToast('Comparison cleared', 'info');
  };

  const isInCompare = (messId) => {
    return compareList.some((m) => m.id === messId);
  };

  // Lunch pass helpers
  const saveNewPass = (pass) => {
    if (!pass) return;
    setActivePass(pass);
    const updated = [pass, ...passes.filter((p) => p && p.id !== pass.id)];
    setPasses(updated);
    localStorage.setItem('quickmess_active_pass', JSON.stringify(pass));
    localStorage.setItem('quickmess_passes', JSON.stringify(updated));
    showToast(`Lunch Pass ${pass.pass_code || ''} confirmed!`, 'success');
  };

  return (
    <AppContext.Provider
      value={{
        currentPage,
        pageParams,
        selectedMessId,
        setSelectedMessId,
        navigate,
        compareList,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
        passes,
        activePass,
        setActivePass,
        saveNewPass,
        globalSearch,
        setGlobalSearch,
        toast,
        showToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
