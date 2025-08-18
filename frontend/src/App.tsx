import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthWrapper from './components/auth/AuthWrapper';
import TradingApp from './components/TradingApp';
import SessionTimeoutModal from './components/auth/SessionTimeoutModal';
import './index.css';

// Inner App Component that can use useAuth
function AppContent() {
  const { showSessionTimeoutModal, handleSessionTimeoutConfirm } = useAuth();
  
  useEffect(() => {
    // Push an initial state to create history entry for back button interception
    history.pushState(null, '', window.location.href);

    // Listen for all popstate events (browser back/forward button)
    const handlePopState = (event: PopStateEvent) => {
      const confirmed = confirm('Are you sure you want to leave?');
      if (!confirmed) {
        // Push state again to stay on current page
        history.pushState(null, '', window.location.href);
      }
      // If confirmed, allow natural navigation
    };

    window.addEventListener('popstate', handlePopState);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return (
    <>
      <AuthWrapper>
        <TradingApp />
      </AuthWrapper>
      <SessionTimeoutModal 
        isOpen={showSessionTimeoutModal}
        onConfirm={handleSessionTimeoutConfirm}
      />
    </>
  );
}

// Main App Component - Now with Authentication
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;