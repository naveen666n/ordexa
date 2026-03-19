import { createContext, useContext, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { configApi } from '../api/config.api';
import { CACHE_TIME } from '../lib/constants';

const ConfigContext = createContext(null);

const defaultConfig = {
  site: {
    name: 'Store',
    logo_url: null,
    favicon_url: null,
    tagline: '',
  },
  theme: {
    primary_color: '#4F46E5',
    secondary_color: '#10B981',
    accent_color: '#F59E0B',
    font_family: 'Inter, system-ui, sans-serif',
  },
  features: {
    reviews_enabled: true,
    wishlist_enabled: true,
    google_auth_enabled: true,
    cod_enabled: false,
    coupon_enabled: true,
    global_offer_enabled: true,
    sms_notifications_enabled: false,
    email_notifications_enabled: true,
    product_search_enabled: true,
    inventory_blocking_enabled: true,
    review_media_enabled: true,
  },
  contact: {
    email: '',
    phone: '',
  },
  social: {},
  order: {
    cancellable_statuses: ['pending', 'paid', 'processing'],
  },
};

export const ConfigProvider = ({ children }) => {
  const { data: config, isLoading } = useQuery({
    queryKey: ['config', 'public'],
    queryFn: configApi.getPublic,
    staleTime: CACHE_TIME.PUBLIC_CONFIG,
    retry: 1,
  });

  const activeConfig = config || defaultConfig;

  // Apply theme CSS variables when config loads
  useEffect(() => {
    if (activeConfig?.theme) {
      const root = document.documentElement;
      const { primary_color, secondary_color, accent_color, font_family } = activeConfig.theme;

      if (primary_color) root.style.setProperty('--color-primary', primary_color);
      if (secondary_color) root.style.setProperty('--color-secondary', secondary_color);
      if (accent_color) root.style.setProperty('--color-accent', accent_color);
      if (font_family) root.style.setProperty('--font-family', font_family);
    }

    if (activeConfig?.site?.name) {
      document.title = activeConfig.site.name;
    }

    if (activeConfig?.site?.favicon_url) {
      const favicon = document.getElementById('app-favicon');
      if (favicon) favicon.href = activeConfig.site.favicon_url;
    }
  }, [activeConfig]);

  // Show minimal loader while config loads (only first load)
  if (isLoading && !config) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <ConfigContext.Provider value={activeConfig}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};

export default ConfigContext;
