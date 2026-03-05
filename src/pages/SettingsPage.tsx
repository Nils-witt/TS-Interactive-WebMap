/*
 * SettingsPage.tsx
 * ----------------
 * Full-page settings view, accessible via /settings.
 * Re-uses the same settings logic as the MapSettings panel but rendered
 * as a regular page inside NavLayout rather than a modal overlay.
 */

import { type JSX, useEffect, useRef } from 'react';
import * as React from 'react';
import {
    Box,
    Button,
    ButtonGroup,
    Checkbox,
    Container,
    Divider,
    Input,
    Paper,
    Popover,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { DataProvider, DataProviderEvent, DataProviderEventType } from '../dataProviders/DataProvider.ts';
import CacheProvider from '../dataProviders/CacheProvider.ts';
import { type MapOverlay } from '../enitities/MapOverlay.ts';
import { MapConfig, MapConfigEvents } from '../enitities/MapConfig.ts';
import { GlobalEventHandler } from '../dataProviders/GlobalEventHandler.ts';
import { Utilities } from '../Utilities.ts';

function LayerTableRow({ overlay }: { overlay: MapOverlay }): JSX.Element {
    const btnRef = useRef<HTMLButtonElement | null>(null);
    const [order, setOrder] = React.useState<number>(overlay.getOrder());
    const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);

    const downloadLayer = async () => {
        if (btnRef.current) {
            btnRef.current.disabled = true;
            btnRef.current.innerText = 'Downloading…';
            await CacheProvider.getInstance().cacheOverlay(overlay, btnRef.current);
        } else {
            await CacheProvider.getInstance().cacheOverlay(overlay);
        }
    };

    useEffect(() => {
        void CacheProvider.getInstance().getOverlayCacheState(overlay).then((res) => {
            if (btnRef.current) {
                if (res.missing.length === 0) {
                    btnRef.current.disabled = true;
                    btnRef.current.innerText = 'Downloaded';
                } else {
                    btnRef.current.disabled = false;
                    btnRef.current.innerText = `Download (${res.missing.length} / ${res.remoteTiles.length} tiles)`;
                }
            }
        });
    }, []);

    useEffect(() => {
        if (order !== overlay.getOrder()) {
            overlay.setOrder(order);
        }
    }, [order]);

    const open = Boolean(anchorEl);
    const id = open ? 'overlay-popover' : undefined;

    return (
        <TableRow key={overlay.getId()}>
            <TableCell>
                {overlay.getName()} ({overlay.getLayerVersion()})
            </TableCell>
            <TableCell>
                <Input
                    type="number"
                    defaultValue={order}
                    onChange={(e) => setOrder(parseInt(e.target.value))}
                />
            </TableCell>
            <TableCell>
                <ButtonGroup>
                    <Button ref={btnRef} size="small" onClick={() => void downloadLayer()}>
                        Download
                    </Button>
                    <Button size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
                        Info
                    </Button>
                    <Popover
                        id={id}
                        open={open}
                        anchorEl={anchorEl}
                        onClose={() => setAnchorEl(null)}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                    >
                        <Typography sx={{ p: 2 }}>{overlay.getUrl()}</Typography>
                    </Popover>
                </ButtonGroup>
            </TableCell>
        </TableRow>
    );
}

// ---------------------------------------------------------------------------
// SettingsPage
// ---------------------------------------------------------------------------

export function SettingsPage(): JSX.Element {
    const [overlays, setOverlays] = React.useState<MapOverlay[]>([]);
    const [unitIconSize, setUnitIconSizeState] = React.useState<string>();
    const [mapConfig, setMapConfig] = React.useState<MapConfig>();

    const [excludeStatus6, setExcludeStatus6] = React.useState<boolean>(false);
    const [hideUnitsAfterPositionUpdate, setHideUnitsAfterPositionUpdate] = React.useState<number>(21600);
    const [showUnitStatus, setShowUnitStatus] = React.useState<boolean>(false);

    // --------------------------------------------------
    // Bootstrap
    // --------------------------------------------------
    useEffect(() => {
        const updateOverlays = () => {
            setOverlays(Array.from(DataProvider.getInstance().getOverlays().values()));
        };

        DataProvider.getInstance().on(DataProviderEventType.OVERLAY_ADDED, updateOverlays);
        DataProvider.getInstance().on(DataProviderEventType.OVERLAY_UPDATED, updateOverlays);
        updateOverlays();

        const lcConfig = DataProvider.getInstance().getMapConfig();
        setMapConfig(lcConfig);
        setUnitIconSizeState(lcConfig.getUnitIconSize().toString());
        setExcludeStatus6(lcConfig.getExcludeStatuses().includes(6));
        setHideUnitsAfterPositionUpdate(lcConfig.getHideUnitsAfterPositionUpdate());
        setShowUnitStatus(lcConfig.getShowUnitStatus());

        const onMapConfigUpdated = (event: DataProviderEvent) => {
            const config = event.data as MapConfig;
            setMapConfig(config);
            setUnitIconSizeState(config.getUnitIconSize().toString());
            setExcludeStatus6(config.getExcludeStatuses().includes(6));
            setHideUnitsAfterPositionUpdate(config.getHideUnitsAfterPositionUpdate());
            setShowUnitStatus(config.getShowUnitStatus());
        };
        DataProvider.getInstance().on(DataProviderEventType.MAP_CONFIG_UPDATED, onMapConfigUpdated);

        return () => {
            DataProvider.getInstance().off(DataProviderEventType.OVERLAY_ADDED, updateOverlays);
            DataProvider.getInstance().off(DataProviderEventType.OVERLAY_UPDATED, updateOverlays);
            DataProvider.getInstance().off(DataProviderEventType.MAP_CONFIG_UPDATED, onMapConfigUpdated);
        };
    }, []);

    // --------------------------------------------------
    // Sync individual settings back to DataProvider
    // --------------------------------------------------
    useEffect(() => {
        if (!mapConfig) return;
        mapConfig.setUnitIconSize(parseInt(unitIconSize ?? '0'));
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
                        <Button size="small" onClick={() => void Utilities.clearMapCache()}>
                            Clear Map Cache
                        </Button>
                        <Button size="small" onClick={() => void Utilities.clearCache()}>
                            Clear Full Cache
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

                {/* ---- Overlays ---- */}
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Map Overlays
                    </Typography>
                    <Divider sx={{ mb: 1 }} />
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Overlay</TableCell>
                                <TableCell>Layer Order</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {overlays.map((overlay) => (
                                <LayerTableRow key={overlay.getId()} overlay={overlay} />
                            ))}
                            {overlays.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3}>
                                        <Typography color="text.secondary" variant="body2">
                                            No overlays available.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </Paper>
            </Container>
        </Box>
    );
}

export default SettingsPage;
