import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../config/api';

interface EmailHealth {
  resend: {
    apiKeyPresent: boolean;
    apiKeyFormatValid: boolean;
    configurationValid: boolean;
  };
  fromEmailPresent: boolean;
  fromNamePresent: boolean;
  frontendUrlSet: boolean;
  frontendUrl: string;
}

const AdminHealth: React.FC = () => {
  const [emailHealth, setEmailHealth] = useState<EmailHealth | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    loadEmailHealth();
  }, []);

  const loadEmailHealth = async () => {
    try {
      setEmailLoading(true);
      setEmailError(null);
      const res = await fetch(`${API_BASE_URL}/health/email`);
      if (!res.ok) throw new Error('Failed to load email health');
      const data = await res.json();
      setEmailHealth(data as EmailHealth);
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Failed to load email health');
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <h2 className="text-xl font-semibold text-white">System Health</h2>
        <p className="text-gray-400 text-sm">Configuration checks and operational status</p>
      </div>

      {/* Email Configuration Health */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Email Configuration</h3>
            <button
              onClick={loadEmailHealth}
              disabled={emailLoading}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md text-sm transition-colors"
            >
              {emailLoading ? 'Checking…' : 'Refresh'}
            </button>
          </div>

          {emailError && (
            <div className="mb-4 p-3 bg-red-900 border border-red-700 rounded-lg">
              <p className="text-red-300 text-sm">{emailError}</p>
            </div>
          )}

          {!emailError && emailHealth && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-2">Resend API Key</p>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${emailHealth.resend.apiKeyPresent ? 'bg-green-700 text-white' : 'bg-red-700 text-white'}`}>
                      {emailHealth.resend.apiKeyPresent ? 'Present' : 'Missing'}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${emailHealth.resend.apiKeyFormatValid ? 'bg-green-700 text-white' : 'bg-yellow-700 text-white'}`}>
                      {emailHealth.resend.apiKeyFormatValid ? 'Format OK' : 'Format Invalid'}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-2">Configuration Status</p>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${emailHealth.resend.configurationValid ? 'bg-green-700 text-white' : 'bg-yellow-700 text-white'}`}>
                    {emailHealth.resend.configurationValid ? 'Valid' : 'Needs Attention'}
                  </span>
                </div>

                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-2">Sender Identity</p>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${emailHealth.fromEmailPresent ? 'bg-green-700 text-white' : 'bg-red-700 text-white'}`}>
                      From Email {emailHealth.fromEmailPresent ? 'Set' : 'Missing'}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${emailHealth.fromNamePresent ? 'bg-green-700 text-white' : 'bg-red-700 text-white'}`}>
                      From Name {emailHealth.fromNamePresent ? 'Set' : 'Missing'}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-2">Frontend URL</p>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${emailHealth.frontendUrlSet ? 'bg-green-700 text-white' : 'bg-red-700 text-white'}`}>
                      {emailHealth.frontendUrlSet ? 'Set' : 'Missing'}
                    </span>
                    <span className="text-gray-300 text-xs font-mono break-all">{emailHealth.frontendUrl || 'n/a'}</span>
                  </div>
                </div>
              </div>

              <p className="text-gray-400 text-xs">
                Tip: Set `RESEND_API_KEY`, `FROM_EMAIL`, `FROM_NAME`, and `FRONTEND_URL` in `backend/.env`. Key should start with `re_`.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminHealth;