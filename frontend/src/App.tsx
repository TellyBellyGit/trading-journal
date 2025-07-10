import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import AuthWrapper from './components/auth/AuthWrapper';
import TradingApp from './components/TradingApp';
import './index.css';

// Main App Component - Now with Authentication
function App() {
  return (
    <AuthProvider>
      <AuthWrapper>
        <TradingApp />
      </AuthWrapper>
    </AuthProvider>
  );
}

export default App;