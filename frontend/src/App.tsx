import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, theme } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { AuthProvider } from './store/AuthContext';
import { SocketProvider } from './store/SocketProvider';
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

  /** Antd theme tokens aligned with Warm Sanctuary (Refined Edition) design system */
  const antdTheme = {
    algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: isDark ? '#BFA8F2' : '#6750A4',
      colorPrimaryHover: isDark ? '#D5C4F7' : '#533F85',
      colorPrimaryActive: isDark ? '#A88EE8' : '#42326D',
      colorSuccess: isDark ? '#7DC29F' : '#3A7558',
      colorWarning: isDark ? '#DF9B63' : '#A14F40',
      colorError: isDark ? '#E27668' : '#A63228',
      colorInfo: isDark ? '#82AECF' : '#426B8A',
      colorBgBase: isDark ? '#18181C' : '#F7F5F0',
      colorBgContainer: isDark ? '#222228' : '#FFFFFF',
      colorBgElevated: isDark ? '#2C2C34' : '#FFFFFF',
      colorBorder: isDark ? '#454352' : '#C7C1B8',
      colorBorderSecondary: isDark ? '#2F2E38' : '#E5E0D8',
      colorText: isDark ? '#EDEAF2' : '#2D2A32',
      colorTextSecondary: isDark ? '#A9A4B4' : '#595563',
      colorTextHeading: isDark ? '#EDEAF2' : '#2D2A32',
      colorTextDisabled: isDark ? '#696575' : '#8C8797',
      fontFamily: "'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      fontSize: 14,
      borderRadius: 8,
      controlHeight: 40,
    },
    components: {
      Button: {
        controlHeight: 40,
        borderRadius: 8,
        fontWeight: 500,
      },
      Card: {
        borderRadiusLG: 12,
        colorBgContainer: isDark ? '#222228' : '#FFFFFF',
        colorBorderSecondary: isDark ? '#2F2E38' : '#E5E0D8',
      },
      Input: {
        controlHeight: 40,
        borderRadius: 8,
        colorBorder: isDark ? '#454352' : '#C7C1B8',
      },
      Select: {
        controlHeight: 40,
        borderRadius: 8,
      },
      Table: {
        borderRadiusLG: 8,
        headerBg: isDark ? '#2C2C34' : '#F7F5F0',
        headerColor: isDark ? '#EDEAF2' : '#2D2A32',
        borderColor: isDark ? '#2F2E38' : '#E5E0D8',
      },
      Modal: {
        borderRadiusLG: 16,
        colorBgElevated: isDark ? '#2C2C34' : '#FFFFFF',
      },
      Tabs: {
        colorPrimary: isDark ? '#BFA8F2' : '#6750A4',
        itemSelectedColor: isDark ? '#BFA8F2' : '#6750A4',
        itemHoverColor: isDark ? '#D5C4F7' : '#533F85',
        titleFontSize: 14,
      },
      Radio: {
        colorPrimary: isDark ? '#BFA8F2' : '#6750A4',
      },
      Checkbox: {
        colorPrimary: isDark ? '#BFA8F2' : '#6750A4',
      },
      Alert: {
        borderRadiusLG: 8,
      },
    },
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={viVN} theme={antdTheme}>
        <AuthProvider>
          <SocketProvider>
            <AppRouter />
          </SocketProvider>
        </AuthProvider>
      </ConfigProvider>
    </QueryClientProvider>
  );
};

export default App;

