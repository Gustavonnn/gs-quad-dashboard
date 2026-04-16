import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import './index.css';
import { QueryProvider } from './app/QueryProvider';
import { ThemeProvider } from './app/ThemeProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { RootLayout } from './app/RootLayout';
import { routes } from './app/routes';
import { env } from './lib/env';
import { RouteFallback } from '@/components/RouteFallback';

// Força tema claro ANTES de tudo
document.documentElement.setAttribute('data-theme', 'light');

// Initialize Sentry for error tracking in production
if (env.VITE_APP_ENV === 'production' && env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: env.VITE_SENTRY_DSN,
    environment: env.VITE_APP_ENV,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: routes,
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryProvider>
        <ThemeProvider>
          <Suspense fallback={<RouteFallback />}>
            <RouterProvider router={router} />
          </Suspense>
        </ThemeProvider>
      </QueryProvider>
    </ErrorBoundary>
  </StrictMode>
);
