import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  // Navigation state with hash sync
  const [currentPage, setCurrentPage] = useState(() => {
    const hash = window.location.hash.replace('#/', '').split('?')[0];
    return hash || 'home';
  });

  const [pageParams, setPageParams] = useState(() => {
    const hash = window.location.hash;
    const parts = hash.split('?');
    if (parts[1]) {
      const params = new URLSearchParams(parts[1]);
      return Object.fromEntries(params.entries());
    }
    return {};
  });

  const [selectedMessId, setSelectedMessId] = useState(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#/mess/')) {
      return hash.replace('#/mess/', '').split('?')[0];
    }
    return null;
  });

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

  // Sync hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || '#/';
      if (hash.startsWith('#/mess/')) {
        const id = hash.replace('#/mess/', '').split('?')[0];
        setSelectedMessId(id);
        setCurrentPage('mess-details');
      } else {
        const cleanPage = hash.replace('#/', '').split('?')[0] || 'home';
        setCurrentPage(cleanPage);
      }

      const parts = hash.split('?');
      if (parts[1]) {
        const params = new URLSearchParams(parts[1]);
        setPageParams(Object.fromEntries(params.entries()));
      } else {
        setPageParams({});
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
    setActivePass(pass);
    const updated = [pass, ...passes.filter((p) => p.id !== pass.id)];
    setPasses(updated);
    localStorage.setItem('quickmess_active_pass', JSON.stringify(pass));
    localStorage.setItem('quickmess_passes', JSON.stringify(updated));
    showToast(`Lunch Pass ${pass.pass_code} confirmed!`, 'success');
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
