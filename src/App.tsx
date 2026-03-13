import { type JSX, useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom';
import { GlobalEventHandler } from "./dataProviders/GlobalEventHandler.ts";
import { ApiProviderEventTypes } from "./dataProviders/ApiProvider.ts";
import { LoginPage } from "./pages/LoginPage.tsx";
import MapPage from "./pages/MapPage.tsx";
import { ApplicationLogger } from "./ApplicationLogger.ts";
import { DataProvider } from "./dataProviders/DataProvider.ts";
import { PhotoPage } from './pages/PhotoPage.tsx';
import { MapLocationPage } from './pages/MapLocationPage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';
import { UnitsPage } from './pages/UnitsPage.tsx';
import { OverlaysPage } from './pages/OverlaysPage.tsx';
import { MissionGroupsPage } from './pages/MissionGroupsPage.tsx';
import { CachePage } from './pages/CachePage.tsx';
import { NavLayout } from './components/NavLayout.tsx';
import { DatabaseProvider } from './dataProviders/DatabaseProvider.ts';
import { WebSocketProvider } from './dataProviders/WebSocketProvider.ts';
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

function ProtectedRoute({ loggedin, children }: { loggedin: boolean; children: JSX.Element }) {
    if (!loggedin) return <Navigate to="/login" replace />;
    return children;
}

function LoadingScreen() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <div className="loader" />
            <p>Loading...</p>
        </div>
    );
}


function App() {
    const [isLoading, setLoading] = useState(true);
    const [loggedin, setLoggedin] = useState<boolean>(false);
    const [databaseProvider, setDatabaseProvider] = useState<DatabaseProvider | null>(null);

    useEffect(() => {
        if(!databaseProvider) return;
        const webSocketProvider = WebSocketProvider.getInstance();
        webSocketProvider.setDatabaseProvider(databaseProvider);
        webSocketProvider.start();

    }, [databaseProvider]);
    useEffect(() => {
        const instance = DatabaseProvider.getInstance();
        void instance.setUpDone(() => {
            setDatabaseProvider(instance);
        });
        void instance.setUp();


        new BroadcastChannel('setApiBase').postMessage({ 'url': DataProvider.getInstance().getApiUrl() });

        const onUnauthorized = () => { setLoggedin(false); };
        const onLoginSuccess = () => { setLoggedin(true); };
        GlobalEventHandler.getInstance().on(ApiProviderEventTypes.UNAUTHORIZED, onUnauthorized);
        GlobalEventHandler.getInstance().on(ApiProviderEventTypes.LOGIN_SUCCESS, onLoginSuccess);
        void (async () => {
            try {
                const res = await fetch('/config.json');
                const config = await res.json() as { apiUrl?: string };
                if (config.apiUrl) {
                    if (localStorage.getItem('apiUrl') != config.apiUrl) {
                        localStorage.setItem('apiUrl', config.apiUrl);
                        window.location.reload();
                    }
                }
            } catch {
                ApplicationLogger.info("No config.json found, using defaults", { service: 'App' });
            }
        })();

        const pKey = localStorage.getItem('apiToken');

        if (pKey) {
            setLoggedin(true);
        }
        setLoading(false);
        return () => {
            GlobalEventHandler.getInstance().off(ApiProviderEventTypes.UNAUTHORIZED, onUnauthorized);
            GlobalEventHandler.getInstance().off(ApiProviderEventTypes.LOGIN_SUCCESS, onLoginSuccess);
        };
    }, []);

    return (
        <>
        {isLoading || databaseProvider == null ? (
            <LoadingScreen />
        ):(
        <DataBaseContext.Provider value={databaseProvider}>
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
                                                    <Routes>
                                                        <Route path="/login" element={loggedin ? <Navigate to="/" replace /> : <LoginPage />} />
                                                        <Route path="/display" element={
                                                            <ProtectedRoute loggedin={loggedin}><DisplayPage /></ProtectedRoute>
                                                        } />
                                                        <Route element={<NavLayout />}>
                                                            <Route path="/photo" element={
                                                                <ProtectedRoute loggedin={loggedin}><PhotoPage /></ProtectedRoute>
                                                            } />
                                                            <Route path="/locations" element={
                                                                <ProtectedRoute loggedin={loggedin}><MapLocationPage /></ProtectedRoute>
                                                            } />
                                                            <Route path="/settings" element={
                                                                <ProtectedRoute loggedin={loggedin}><SettingsPage /></ProtectedRoute>
                                                            } />
                                                            <Route path="/units" element={
                                                                <ProtectedRoute loggedin={loggedin}><UnitsPage /></ProtectedRoute>
                                                            } />
                                                            <Route path="/overlays" element={
                                                                <ProtectedRoute loggedin={loggedin}><OverlaysPage /></ProtectedRoute>
                                                            } />
                                                            <Route path="/mission-groups" element={
                                                                <ProtectedRoute loggedin={loggedin}><MissionGroupsPage /></ProtectedRoute>
                                                            } />
                                                            <Route path="/caches" element={
                                                                <ProtectedRoute loggedin={loggedin}><CachePage /></ProtectedRoute>
                                                            } />
                                                            <Route path="*" element={
                                                                <ProtectedRoute loggedin={loggedin}><MapPage /></ProtectedRoute>
                                                            } />
                                                        </Route>
                                                    </Routes>
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
        </DataBaseContext.Provider>
        )}
        </>
    );
}


declare global {
    interface Navigator {
        userAgentData: {
            mobile: boolean
        }
    }
}

export default App
