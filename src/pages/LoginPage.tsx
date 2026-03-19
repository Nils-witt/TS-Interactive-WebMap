import { type JSX, useEffect, useState } from 'react';
import { LoginComponent } from '../components/LoginComponent.tsx';
import { DarkToggle } from '../components/DarkToggle.tsx';

import './css/login.scss';
import { useAuth } from 'react-oidc-context';
import { useApi } from '../contexts/ApiContext.tsx';
import { DataProvider } from '../dataProviders/DataProvider.ts';

export function LoginPage(): JSX.Element {
  //const apiProvider = ApiProvider.getInstance();

  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  const auth = useAuth();
  const apiProvider = useApi();

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const stored = localStorage.getItem('theme');
      if (stored === 'light' || stored === 'dark') return stored;
    } catch {
      // ignore
    }
    return window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const handleToggleTheme = () =>
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  const handleLogin = (username: string, password: string) => {
    setLocked(true);
    setError(null);

    apiProvider
      .login(username, password)
      .then((token) => {
        console.log('Login successful, token:', token);
        DataProvider.getInstance().setLocalApiToken(token);
        setError(null);
      })
      .catch(() => {
        setError('Login failed');
        setLocked(false);
      });
  };

  useEffect(() => {
    if (auth.isAuthenticated) {
      console.log('User is authenticated', auth.user?.access_token);
    }
  }, [auth]);

  return (
    <div className="login-container">
      <div className="login-theme-toggle">
        <DarkToggle theme={theme} onToggle={handleToggleTheme} />
      </div>
      <div className="login-box">
        <div className="login-header-row">
          <img
            src="/ts-interactive-webmap-icon.svg"
            className="login-icon"
            alt="App icon"
          />
        </div>
        <LoginComponent
          locked={locked}
          handleLogin={handleLogin}
          error={error}
        />
      </div>
    </div>
  );
}
