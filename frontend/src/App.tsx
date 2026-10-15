import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, theme } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { AuthProvider } from './store/AuthContext';
import { AppRouter } from './router/AppRouter';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const useIsDarkMode = () => {
  const [isDark, setIsDark] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches,
  );

  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return isDark;
};

export const App: React.FC = () => {
  const isDark = useIsDarkMode();

  /** Antd theme tokens aligned with the CSS custom properties in index.css */
  const antdTheme = {
    algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: isDark ? '#c084fc' : '#aa3bff',
      borderRadius: 8,
      fontFamily: "system-ui, 'Segoe UI', Roboto, sans-serif",
      colorBgContainer: isDark ? '#1f2028' : '#ffffff',
      colorBgElevated: isDark ? '#282932' : '#ffffff',
      colorBorder: isDark ? '#2e303a' : '#e5e4e7',
      colorText: isDark ? '#9ca3af' : '#6b6375',
      colorTextHeading: isDark ? '#f3f4f6' : '#08060d',
    },
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={viVN} theme={antdTheme}>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </ConfigProvider>
    </QueryClientProvider>
  );
};

export default App;

