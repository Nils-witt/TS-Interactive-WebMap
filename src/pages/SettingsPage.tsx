/*
 * SettingsPage.tsx
 * ----------------
 * Full-page settings view, accessible via /settings.
 * Re-uses the same settings logic as the MapSettings panel but rendered
 * as a regular page inside NavLayout rather than a modal overlay.
 */

import { type JSX, useEffect, useContext, useState } from 'react';
import {
    Box,
    Button,
    ButtonGroup,
    Checkbox,
    Container,
    Input,
    Paper,
    Typography,
} from '@mui/material';
import { DataProvider, DataProviderEvent } from '../dataProviders/DataProvider.ts';
import { MapConfigEvents } from '../enitities/MapConfig.ts';
import { GlobalEventHandler } from '../dataProviders/GlobalEventHandler.ts';
import { MapConfigContext } from '../contexts/MapConfigContext.tsx';
import { useNavigate } from 'react-router';

// ---------------------------------------------------------------------------
// SettingsPage
// ---------------------------------------------------------------------------

export function SettingsPage(): JSX.Element {
    const navigate = useNavigate();

    const [unitIconSize, setUnitIconSizeState] = useState<string>();
    const mapConfig = useContext(MapConfigContext);

    const [excludeStatus6, setExcludeStatus6] = useState<boolean>(false);
    const [hideUnitsAfterPositionUpdate, setHideUnitsAfterPositionUpdate] = useState<number>(21600);
    const [showUnitStatus, setShowUnitStatus] = useState<boolean>(false);

    // --------------------------------------------------
    // Bootstrap
    // --------------------------------------------------
    useEffect(() => {

        setUnitIconSizeState(mapConfig.getUnitIconSize().toString());
        setExcludeStatus6(mapConfig.getExcludeStatuses().includes(6));
        setHideUnitsAfterPositionUpdate(mapConfig.getHideUnitsAfterPositionUpdate());
        setShowUnitStatus(mapConfig.getShowUnitStatus());

    }, [mapConfig]);

    // --------------------------------------------------
    // Sync individual settings back to DataProvider
    // --------------------------------------------------
    useEffect(() => {
        if (!mapConfig) return;
        if (!unitIconSize || isNaN(parseInt(unitIconSize))) return;
        mapConfig.setUnitIconSize(parseInt(unitIconSize));
        DataProvider.getInstance().setMapConfig(mapConfig);
        GlobalEventHandler.getInstance().emit(
            MapConfigEvents.UnitIconSizeChanged,
            new DataProviderEvent(MapConfigEvents.UnitIconSizeChanged, mapConfig.getUnitIconSize()),
        );
    }, [unitIconSize]);

    useEffect(() => {
        if (!mapConfig) return;
        const statuses = mapConfig.getExcludeStatuses();
        if (excludeStatus6 && !statuses.includes(6)) {
            mapConfig.setExcludeStatuses([...statuses, 6]);
        } else if (!excludeStatus6) {
            mapConfig.setExcludeStatuses(statuses.filter((s) => s !== 6));
        }
        DataProvider.getInstance().setMapConfig(mapConfig);
        GlobalEventHandler.getInstance().emit(
            MapConfigEvents.ExcludeStatusesChanged,
            new DataProviderEvent(MapConfigEvents.ExcludeStatusesChanged, mapConfig.getExcludeStatuses()),
        );
    }, [excludeStatus6]);

    useEffect(() => {
        if (!mapConfig || isNaN(hideUnitsAfterPositionUpdate)) return;
        mapConfig.setHideUnitsAfterPositionUpdate(hideUnitsAfterPositionUpdate);
        DataProvider.getInstance().setMapConfig(mapConfig);
        GlobalEventHandler.getInstance().emit(
            MapConfigEvents.HideUnitsAfterPositionUpdateChanged,
            new DataProviderEvent(
                MapConfigEvents.HideUnitsAfterPositionUpdateChanged,
                mapConfig.getHideUnitsAfterPositionUpdate(),
            ),
        );
    }, [hideUnitsAfterPositionUpdate]);

    useEffect(() => {
        if (!mapConfig) return;
        mapConfig.setShowUnitStatus(showUnitStatus);
        DataProvider.getInstance().setMapConfig(mapConfig);
        GlobalEventHandler.getInstance().emit(
            MapConfigEvents.ShowUnitStatusChanged,
            new DataProviderEvent(MapConfigEvents.ShowUnitStatusChanged, mapConfig.getShowUnitStatus()),
        );
    }, [showUnitStatus]);


    const resetPWA = async () => {
        localStorage.clear();


        const keys = await caches.keys();
        for (const key of keys) {
            await caches.delete(key);
        }

        const dbs = await indexedDB.databases();
        const names = [...new Set(dbs.map((d) => d && d.name).filter(Boolean))];
        for (const name of names) {
            if (!name) continue;
            await new Promise((resolve, reject) => {
                const req = indexedDB.deleteDatabase(name);

                req.onsuccess = () => resolve({ name, status: "deleted" });
                req.onerror = () =>
                    reject(Object.assign(new Error(`Failed to delete IndexedDB: ${name}`), { name, event: req.error }));
                req.onblocked = () => resolve({ name, status: "blocked" }); // typically means another tab has it open
            });

        }
        const swRegistrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of swRegistrations) {
            await reg.unregister();
        }
        window.location.href = '/';
    }

    // --------------------------------------------------
    // Render
    // --------------------------------------------------
    return (
        <Box sx={{ overflowY: 'auto', height: '100%', py: 3 }}>
            <Container maxWidth="md">
                <Typography variant="h4" gutterBottom>
                    Settings
                </Typography>

                {/* ---- Cache controls ---- */}
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Cache
                    </Typography>
                    <ButtonGroup variant="outlined" color="warning">
                        <Button size="small" onClick={() => void navigate('/caches')}>
                            Open Cache Manager
                        </Button>
                        <Button size="small" onClick={() => void resetPWA()}>
                            Reset PWA
                        </Button>
                        <Button size="small" onClick={() => window.location.reload()}>
                            Reload
                        </Button>
                    </ButtonGroup>
                </Paper>

                {/* ---- Unit display ---- */}
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Unit Display
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography>Icon Size:</Typography>
                            <Input
                                value={unitIconSize ?? ''}
                                onChange={(e) => setUnitIconSizeState(e.target.value)}
                            />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Checkbox
                                checked={excludeStatus6}
                                onChange={(e) => setExcludeStatus6(e.target.checked)}
                            />
                            <Typography>Exclude units with status "6"</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography>Hide units after no position update (seconds):</Typography>
                            <Input
                                type="number"
                                value={hideUnitsAfterPositionUpdate}
                                onChange={(e) =>
                                    setHideUnitsAfterPositionUpdate(parseInt(e.target.value))
                                }
                            />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Checkbox
                                checked={showUnitStatus}
                                onChange={(e) => setShowUnitStatus(e.target.checked)}
                            />
                            <Typography>Show unit status</Typography>
                        </Box>
                    </Box>
                </Paper>

            </Container>
        </Box>
    );
}

export default SettingsPage;
