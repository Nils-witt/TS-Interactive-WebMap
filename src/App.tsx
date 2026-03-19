import { useEffect, useState } from 'react';
import { Outlet, Route, Routes } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage.tsx';
import MapPage from './pages/MapPage.tsx';
import { ApplicationLogger } from './ApplicationLogger.ts';
import { DataProvider } from './dataProviders/DataProvider.ts';
import { PhotoPage } from './pages/PhotoPage.tsx';
import { MapLocationPage } from './pages/MapLocationPage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';
import { UnitsPage } from './pages/UnitsPage.tsx';
import { OverlaysPage } from './pages/OverlaysPage.tsx';
import { MissionGroupsPage } from './pages/MissionGroupsPage.tsx';
import { CachePage } from './pages/CachePage.tsx';
import { NavLayout } from './components/NavLayout.tsx';
import { DatabaseProvider } from './dataProviders/DatabaseProvider.ts';
import { DisplayPage } from './pages/DisplayPage.tsx';
import { UnitsProvider } from './contexts/UnitsContext.tsx';
import { MapConfigProvider } from './contexts/MapConfigContext.tsx';
import { MapGroupProvider } from './contexts/MapGroupContext.tsx';
import { MapItemProvider } from './contexts/MapItemContext.tsx';
import { MapOverlayProvider } from './contexts/MapOverlayContext.tsx';
import { MissionGroupProvider } from './contexts/MissionGroupContext.tsx';
import { PhotoProvider } from './contexts/PhotoContext.tsx';
import { ActiveUserProvider } from './contexts/ActiveUserContext.tsx';
import { MapBaseLayerProvider } from './contexts/MapBaseLayerContext.tsx';
import { DataBaseContext } from './contexts/DataBaseContext.tsx';
import { UsersProvider } from './contexts/UsersContext.tsx';
import { AuthProvider, type AuthProviderProps } from 'react-oidc-context';
import { User, WebStorageStateStore } from 'oidc-client-ts';
import { ApiContextProvider, useApi } from './contexts/ApiContext.tsx';

const oidcConfig: AuthProviderProps = {
  authority: 'https://sso.nils-witt.de/application/o/tac-man/',
  client_id: 'd87qffuHwIBuhq2l8IBSL4SqOmz2DHMpfqxdGlJX',
  redirect_uri: window.location.origin,
  scope: 'openid profile email',
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  automaticSilentRenew: true,
  onSigninCallback: (user?: User) => {
    if (user) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  },
};

function LoadingScreen() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
      }}
    >
      <div className="loader" />
      <p>Loading...</p>
    </div>
  );
}

function App() {
  const [isLoading, setLoading] = useState(true);
  const [databaseProvider, setDatabaseProvider] =
    useState<DatabaseProvider | null>(null);
  useEffect(() => {
    const instance = DatabaseProvider.getInstance();
    void instance.setUpDone(() => {
      setDatabaseProvider(instance);
    });
    void instance.setUp();

    new BroadcastChannel('setApiBase').postMessage({
      url: DataProvider.getInstance().getApiUrl(),
    });
    void (async () => {
      try {
        const res = await fetch('/config.json');
        const config = (await res.json()) as { apiUrl?: string };
        if (config.apiUrl) {
          if (localStorage.getItem('apiUrl') != config.apiUrl) {
            localStorage.setItem('apiUrl', config.apiUrl);
            window.location.reload();
          }
        }
      } catch {
        ApplicationLogger.info('No config.json found, using defaults', {
          service: 'App',
        });
      }
    })();

    setLoading(false);
  }, []);

  return (
    <>
      {(navigator.serviceWorker.controller == null &&
        !window.location.host.startsWith('localhost')) ||
      isLoading ||
      databaseProvider == null ? (
        <>
          {navigator.serviceWorker.controller == null ? (
            <p style={{ color: 'red', textAlign: 'center' }}>
              Service Worker not active. Please ensure the SW is registered and
              active for the app to function properly.
            </p>
          ) : (
            <></>
          )}
          {databaseProvider == null ? (
            <p style={{ color: 'red', textAlign: 'center' }}>
              DB not connected
            </p>
          ) : (
            <></>
          )}
          <LoadingScreen />
        </>
      ) : (
        <DataBaseContext.Provider value={databaseProvider}>
          <AuthProvider {...oidcConfig}>
            <ApiContextProvider>
              <Routes>
                <Route element={<DateProvidingContextProvider />}>
                  <Route path="/display" element={<DisplayPage />} />
                  <Route element={<NavLayout />}>
                    <Route path="/photo" element={<PhotoPage />} />
                    <Route path="/locations" element={<MapLocationPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/units" element={<UnitsPage />} />
                    <Route path="/overlays" element={<OverlaysPage />} />
                    <Route
                      path="/mission-groups"
                      element={<MissionGroupsPage />}
                    />
                    <Route path="/caches" element={<CachePage />} />
                    <Route path="*" element={<MapPage />} />
                  </Route>
                </Route>
              </Routes>
            </ApiContextProvider>
          </AuthProvider>
        </DataBaseContext.Provider>
      )}
    </>
  );
}

function DateProvidingContextProvider() {
  const apiProvider = useApi();

  if (!apiProvider.hasToken()) {
    return <LoginPage />;
  }
  return (
    <MapBaseLayerProvider>
      <MapConfigProvider>
        <MapGroupProvider>
          <MapItemProvider>
            <MapOverlayProvider>
              <MissionGroupProvider>
                <PhotoProvider>
                  <UnitsProvider>
                    <UsersProvider>
                      <ActiveUserProvider>
                        <Outlet />
                      </ActiveUserProvider>
                    </UsersProvider>
                  </UnitsProvider>
                </PhotoProvider>
              </MissionGroupProvider>
            </MapOverlayProvider>
          </MapItemProvider>
        </MapGroupProvider>
      </MapConfigProvider>
    </MapBaseLayerProvider>
  );
}

declare global {
  interface Navigator {
    userAgentData: {
      mobile: boolean;
    };
  }
}

export default App;
