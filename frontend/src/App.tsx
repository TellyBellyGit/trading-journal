import React, { useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import AuthWrapper from './components/auth/AuthWrapper';
import TradingApp from './components/TradingApp';
import './index.css';

// Main App Component - Now with Authentication
function App() {
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
    <AuthProvider>
      <AuthWrapper>
        <TradingApp />
      </AuthWrapper>
    </AuthProvider>
  );
}

export default App;