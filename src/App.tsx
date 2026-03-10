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
import { NavLayout } from './components/NavLayout.tsx';
import { DatabaseProvider } from './dataProviders/DatabaseProvider.ts';
import { MapOverlay } from './enitities/MapOverlay.ts';
import { MapItem } from './enitities/MapItem.ts';
import { type StorageInterface } from './dataProviders/StorageInterface.ts';
import { ApiProvider } from './dataProviders/ApiProvider.ts';
import { MapBaseLayer } from './enitities/MapBaseLayer.ts';
import { WebSocketProvider } from './dataProviders/WebSocketProvider.ts';
import { DisplayPage } from './pages/DisplayPage.tsx';

function ProtectedRoute({ loggedin, children }: { loggedin: boolean; children: JSX.Element }) {
    if (!loggedin) return <Navigate to="/login" replace />;
    return children;
}

function App() {
    const [loggedin, setLoggedin] = useState<boolean>(true);


    void (async () => {
        ApplicationLogger.info("Loading local data from IndexedDB.", { service: "MapComponent" });
        const runTimeProvider = DataProvider.getInstance();
        runTimeProvider.obtainActiveUser();
        const dbProvider = await DatabaseProvider.getInstance();

        const webSocketProvider = new WebSocketProvider();
        webSocketProvider.start();

        await Promise.all([
            dbProvider.loadAllMapStyles().then((style) => {
                const styles = Object.values(style);
                if (styles.length > 0) {
                    runTimeProvider.setMapStyle(styles[0]);
                }
            }),
            dbProvider.loadAllMapOverlays().then((result: Record<string, MapOverlay>) => {
                const localOverlays = Object.values(result);
                localOverlays.forEach((overlay: MapOverlay) => {
                    runTimeProvider.addMapOverlay(overlay);
                });
            }),
            dbProvider.loadAllMapGroups().then((result) => {
                const localMapGroups = Object.values(result);
                localMapGroups.forEach((group) => {
                    runTimeProvider.addMapGroup(group);
                });
            }),
            dbProvider.loadAllMapItems().then((result) => {
                const localObjects = Object.values(result);
                localObjects.forEach((item: MapItem) => {
                    runTimeProvider.addMapItem(item);
                });
            }),
            dbProvider.loadAllUnits().then((result) => {
                const localUnits = Object.values(result);
                localUnits.forEach((unit) => {
                    runTimeProvider.addUnit(unit);
                });
            }),
            dbProvider.loadAllUsers().then((result) => {
                const localUsers = Object.values(result);
                localUsers.forEach((user) => {
                    runTimeProvider.addUser(user);
                });
            }),
            dbProvider.loadAllMissionGroups().then((result) => {
                const localMissionGroups = Object.values(result);
                localMissionGroups.forEach((group) => {
                    runTimeProvider.addMissionGroup(group);
                });
            }),
            dbProvider.loadAllPhotos().then((result) => {
                const localPhotos = Object.values(result);
                localPhotos.forEach((photo) => {
                    runTimeProvider.addPhoto(photo);
                });
            })
        ]);

        ApplicationLogger.info(
            "Local data loaded from IndexedDB. Starting synchronization with remote storage.",
            { service: "MapComponent" }
        )
        const remoteStorage: StorageInterface = ApiProvider.getInstance();

        await Promise.all([
            remoteStorage.loadAllMapStyles().then((result: Record<string, MapBaseLayer>) => {
                const mapStyles = Object.values(result);
                if (mapStyles.length > 0) {
                    runTimeProvider.setMapStyle(Object.values(result)[0]);
                }
                void dbProvider.replaceAllMapStyles(mapStyles);
            }),
            remoteStorage.loadAllMapOverlays().then((result: Record<string, MapOverlay>) => {
                const remoteOverlays = Object.values(result);
                remoteOverlays.forEach((overlay: MapOverlay) => {
                    runTimeProvider.addMapOverlay(overlay);
                });
                void dbProvider.replaceAllMapOverlays(remoteOverlays)
            }),
            remoteStorage.loadAllMapGroups().then((result) => {
                const remoteMapGroups = Object.values(result);
                remoteMapGroups.forEach((group) => {
                    runTimeProvider.addMapGroup(group);
                });
                void dbProvider.replaceAllMapGroups(remoteMapGroups);
            }),
            remoteStorage.loadAllMapItems().then((result) => {
                const remoteObjects = Object.values(result);
                remoteObjects.forEach((item: MapItem) => {
                    runTimeProvider.addMapItem(item);
                });
                void dbProvider.replaceAllMapItems(remoteObjects);
            }),
            remoteStorage.loadAllUnits().then((result) => {
                const remoteUnits = Object.values(result);
                remoteUnits.forEach((unit) => {
                    runTimeProvider.addUnit(unit);
                });
                void dbProvider.replaceAllUnits(remoteUnits);
            }),
            remoteStorage.loadAllUsers().then((result) => {
                const remoteUsers = Object.values(result);
                remoteUsers.forEach((user) => {
                    runTimeProvider.addUser(user);
                });
                void dbProvider.replaceAllUsers(remoteUsers);
            }),
            remoteStorage.loadAllMissionGroups().then((result) => {
                const remoteMissionGroups = Object.values(result);
                remoteMissionGroups.forEach((group) => {
                    runTimeProvider.addMissionGroup(group);
                });
                void dbProvider.replaceAllMissionGroups(remoteMissionGroups);
            }),
            remoteStorage.loadAllPhotos().then((result) => {
                const remotePhotos = Object.values(result);
                remotePhotos.forEach((photo) => {
                    runTimeProvider.addPhoto(photo);
                });
                void dbProvider.replaceAllPhotos(remotePhotos);
            })
        ]);


        ApplicationLogger.info("Data synchronization complete.", { service: "MapComponent" });
    })();

    useEffect(() => {
        new BroadcastChannel('setApiBase').postMessage({ 'url': DataProvider.getInstance().getApiUrl() });

        const onUnauthorized = () => { setLoggedin(false); };
        const onLoginSuccess = () => { setLoggedin(true); };
        GlobalEventHandler.getInstance().on(ApiProviderEventTypes.UNAUTHORIZED, onUnauthorized);
        GlobalEventHandler.getInstance().on(ApiProviderEventTypes.LOGIN_SUCCESS, onLoginSuccess);
        void (async () => {
            try {
                const res = await fetch('/config.json');
                const config = await res.json() as { apiUrl?: string };
                console.log(config);
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

        return () => {
            GlobalEventHandler.getInstance().off(ApiProviderEventTypes.UNAUTHORIZED, onUnauthorized);
            GlobalEventHandler.getInstance().off(ApiProviderEventTypes.LOGIN_SUCCESS, onLoginSuccess);
        };
    }, []);

    return (
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
                <Route path="*" element={
                    <ProtectedRoute loggedin={loggedin}><MapPage /></ProtectedRoute>
                } />
            </Route>
        </Routes>
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
