import {type JSX, useEffect, useState} from 'react'
import {Navigate, Route, Routes} from 'react-router-dom';
import {GlobalEventHandler} from "./dataProviders/GlobalEventHandler.ts";
import {ApiProviderEventTypes} from "./dataProviders/ApiProvider.ts";
import {LoginPage} from "./pages/LoginPage.tsx";
import MapPage from "./pages/MapPage.tsx";
import {ApplicationLogger} from "./ApplicationLogger.ts";
import {DataProvider} from "./dataProviders/DataProvider.ts";
import {PhotoPage} from './pages/PhotoPage.tsx';
import {MapLocationPage} from './pages/MapLocationPage.tsx';
import { DatabaseProvider } from './dataProviders/DatabaseProvider.ts';
import { MapOverlay } from './enitities/MapOverlay.ts';
import { MapItem } from './enitities/MapItem.ts';
import { type StorageInterface } from './dataProviders/StorageInterface.ts';
import { ApiProvider } from './dataProviders/ApiProvider.ts';
import { MapBaseLayer } from './enitities/MapBaseLayer.ts';

function ProtectedRoute({loggedin, children}: { loggedin: boolean; children: JSX.Element }) {
    if (!loggedin) return <Navigate to="/login" replace/>;
    return children;
}

function App() {
    const [loggedin, setLoggedin] = useState<boolean>(true);


        void (async () => {
            ApplicationLogger.info("Loading local data from IndexedDB.", {service: "MapComponent"});
            const runTimeProvider = DataProvider.getInstance();
            const dbProvider = await DatabaseProvider.getInstance();

            await Promise.all([
                dbProvider.loadAllMapStyles().then((style) => {
                    const styles = Object.values(style);
                    if (styles.length > 0) {
                        runTimeProvider.setMapStyle(styles[0]);
                    }
                }),
                dbProvider.loadAllOverlays().then((result: Record<string, MapOverlay>) => {
                    const localOverlays = Object.values(result);
                    localOverlays.forEach((overlay: MapOverlay) => {
                        runTimeProvider.addOverlay(overlay);
                    });
                }),
                dbProvider.loadAllMapGroups().then((result) => {
                    const localMapGroups = Object.values(result);
                    localMapGroups.forEach((group) => {
                        runTimeProvider.addMapGroup(group);
                    });
                }),
                dbProvider.loadAllNamedGeoReferencedObjects().then((result) => {
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
                })
            ]);

            ApplicationLogger.info(
                "Local data loaded from IndexedDB. Starting synchronization with remote storage.",
                {service: "MapComponent"}
            )
            const remoteStorage: StorageInterface = ApiProvider.getInstance();

            await Promise.all([
                remoteStorage.loadAllMapStyles().then((result: Record<string, MapBaseLayer>) => {
                    const mapStyles = Object.values(result);
                    if (mapStyles.length > 0) {
                        runTimeProvider.setMapStyle(Object.values(result)[0]);
                    }
                    void dbProvider.replaceMapStyles(mapStyles);
                }),
                remoteStorage.loadAllOverlays().then((result: Record<string, MapOverlay>) => {
                    const remoteOverlays = Object.values(result);
                    remoteOverlays.forEach((overlay: MapOverlay) => {
                        runTimeProvider.addOverlay(overlay);
                    });
                    void dbProvider.replaceOverlays(remoteOverlays)
                }),/*
,
                remoteStorage.loadAllMapGroups().then((result) => {
                    const remoteMapGroups = Object.values(result);
                    remoteMapGroups.forEach((group) => {
                        runTimeProvider.addMapGroup(group);
                    });
                    void dbProvider.replaceMapGroups(remoteMapGroups);
                }),*/
                remoteStorage.loadAllNamedGeoReferencedObjects().then((result) => {
                    const remoteObjects = Object.values(result);
                    remoteObjects.forEach((item: MapItem) => {
                        runTimeProvider.addMapItem(item);
                    });
                    void dbProvider.replaceNamedGeoReferencedObjects(remoteObjects);
                }),
                remoteStorage.loadAllUnits().then((result) => {
                    const remoteUnits = Object.values(result);
                    remoteUnits.forEach((unit) => {
                        runTimeProvider.addUnit(unit);
                    });
                    void dbProvider.replaceUnits(remoteUnits);
                })
                 

            ])


            ApplicationLogger.info("Data synchronization complete.", {service: "MapComponent"});
        })();

    useEffect(() => {
        new BroadcastChannel('setApiBase').postMessage({'url': DataProvider.getInstance().getApiUrl()});

        GlobalEventHandler.getInstance().on(ApiProviderEventTypes.UNAUTHORIZED, () => {
            setLoggedin(false);
        });
        GlobalEventHandler.getInstance().on(ApiProviderEventTypes.LOGIN_SUCCESS, () => {
            setLoggedin(true);
        });
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
                ApplicationLogger.info("No config.json found, using defaults", {service: 'App'});
            }
        })();
    }, []);

    return (
        <Routes>
            <Route path="/login" element={loggedin ? <Navigate to="/map" replace/> : <LoginPage/>}/>
            <Route path="/map" element={
                <ProtectedRoute loggedin={loggedin}><MapPage/></ProtectedRoute>
            }/>
            <Route path="/photo" element={
                <ProtectedRoute loggedin={loggedin}><PhotoPage/></ProtectedRoute>
            }/>
            <Route path="/map-locations" element={
                <ProtectedRoute loggedin={loggedin}><MapLocationPage/></ProtectedRoute>
            }/>
            <Route path="*" element={<Navigate to="/map" replace/>}/>
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
