'use client';

import React, { createContext, useContext, useSyncExternalStore, useCallback } from 'react';

interface AnalysisModeContextType {
  isAnalysisMode: boolean;
  toggleAnalysisMode: () => void;
  setAnalysisMode: (enabled: boolean) => void;
}

const AnalysisModeContext = createContext<AnalysisModeContextType | undefined>(undefined);

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('ssl_analysis_mode_change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('ssl_analysis_mode_change', callback);
  };
}

function getSnapshot(): boolean {
  try {
    return localStorage.getItem('ssl_analysis_mode') === 'true';
  } catch {
    return false;
  }
}

function getServerSnapshot(): boolean {
  return false;
}

export function AnalysisModeProvider({ children }: { children: React.ReactNode }) {
  const isAnalysisMode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setAnalysisMode = useCallback((enabled: boolean) => {
    try {
      localStorage.setItem('ssl_analysis_mode', String(enabled));
      window.dispatchEvent(new Event('ssl_analysis_mode_change'));
    } catch {
      // Ignore
    }
  }, []);

  const toggleAnalysisMode = useCallback(() => {
    const current = getSnapshot();
    setAnalysisMode(!current);
  }, [setAnalysisMode]);

  return (
    <AnalysisModeContext.Provider
      value={{
        isAnalysisMode,
        toggleAnalysisMode,
        setAnalysisMode,
      }}
    >
      {children}
    </AnalysisModeContext.Provider>
  );
}

export function useAnalysisMode() {
  const context = useContext(AnalysisModeContext);
  if (!context) {
    throw new Error('useAnalysisMode must be used within an AnalysisModeProvider');
  }
  return context;
}
