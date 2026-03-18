import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, AlertCircle } from 'lucide-react';
import configApi from '../../../api/admin/config.api';

const FeatureFlagsPage = () => {
  const queryClient = useQueryClient();
  const [togglingKey, setTogglingKey] = useState(null);
  const [savedKey, setSavedKey] = useState(null);
  const [error, setError] = useState('');

  const { data: flags = [], isLoading } = useQuery({
    queryKey: ['admin', 'config', 'feature-flags'],
    queryFn: () => configApi.getFeatureFlags().then((r) => r.data.data),
    staleTime: 30_000,
  });

  const handleToggle = async (flag) => {
    setTogglingKey(flag.key);
    setError('');
    try {
      await configApi.toggleFlag(flag.key, !flag.enabled);
      queryClient.invalidateQueries({ queryKey: ['admin', 'config', 'feature-flags'] });
      queryClient.invalidateQueries({ queryKey: ['config', 'public'] });
      setSavedKey(flag.key);
      setTimeout(() => setSavedKey(null), 2000);
    } catch (err) {
      setError(err.response?.data?.error?.message || `Failed to toggle ${flag.key}.`);
    } finally {
      setTogglingKey(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Feature Flags</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Enable or disable platform features in real time.</p>
      </div>

      {error && (
        <p className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
          <AlertCircle size={14} /> {error}
        </p>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        {flags.map((flag) => (
          <div key={flag.key} className="flex items-center justify-between px-5 py-4">
            <div className="flex-1 min-w-0 pr-4">
              <p className="text-sm font-medium text-gray-900 font-mono">{flag.key}</p>
              {flag.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{flag.description}</p>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {savedKey === flag.key && (
                <span className="text-xs text-green-600 font-medium">Saved</span>
              )}
              {togglingKey === flag.key ? (
                <Loader2 size={16} className="animate-spin text-gray-400" />
              ) : (
                <button
                  onClick={() => handleToggle(flag)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                    flag.enabled ? 'bg-primary' : 'bg-gray-200'
                  }`}
                  aria-label={`Toggle ${flag.key}`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                      flag.enabled ? 'translate-x-4' : 'translate-x-1'
                    }`}
                  />
                </button>
              )}
              <span className={`text-xs font-medium w-10 text-right ${flag.enabled ? 'text-green-600' : 'text-gray-400'}`}>
                {flag.enabled ? 'On' : 'Off'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeatureFlagsPage;
