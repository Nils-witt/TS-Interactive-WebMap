/*
 * MapComponent.tsx
 * ----------------
 * React component that renders the main interactive map using MapLibre.
 * Purpose: initialize map state, load remote styles/overlays/objects, persist view state
 * and wire app-level controls (search, layers, settings).
 * Exports: MapComponent(props: MapComponentProps)
 * Props:
 *  - keyValueStore: KeyValueInterface for persisting view state
 *  - dataProvider: DataProvider singleton instance for map data (overlays, styles)
 *  - eventHandler: GlobalEventHandler used by child controls to dispatch app events
 *  - showSettings?: optional flag to render a settings button
 * Side-effects: fetches map styles/overlays/objects from remote store and writes to local DB.
 */

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GeolocateControl, Map as MapLibreMap, Marker, NavigationControl, Popup, type MapRef } from '@vis.gl/react-maplibre';
import ReactLayerControl from "../controls/LayerControl";
import ReactSearchControl from "../controls/SearchControl";
import { DataProvider, DataProviderEvent, DataProviderEventType } from "../dataProviders/DataProvider";
import { GlobalEventHandler } from "../dataProviders/GlobalEventHandler";
import type { MapBaseLayer } from "../enitities/MapBaseLayer.ts";
import type { KeyValueInterface } from "../dataProviders/KeyValueInterface.ts";
import { RouteDisplay } from "../controls/RouteDisplay.tsx";
import { UnitDisplay } from "../controls/UnitDisplay.tsx";
import { GroupDisplay } from "../controls/GroupDisplay.tsx";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Select,
    Switch,
    TextField,
} from '@mui/material';
import { MapItem } from "../enitities/MapItem.ts";
import type { MapGroup } from "../enitities/MapGroup.ts";
import { ApiProvider } from "../dataProviders/ApiProvider.ts";
import './css/mapContextMenu.scss';
import type { Unit } from '../enitities/Unit.ts';

interface MapComponentProps {
    keyValueStore: KeyValueInterface;
    dataProvider: DataProvider;
    eventHandler: GlobalEventHandler;
    showSettings?: boolean;
}

export function MapComponent(props: MapComponentProps) {


    const { keyValueStore, dataProvider, eventHandler } = props;

    const [searchParams] = useSearchParams();


    const [showItem, setShowItem] = useState<MapItem | undefined>(undefined);
    const [showUnit, setShowUnit] = useState<Unit | undefined>(undefined);
    const [showGroupId, setShowGroupId] = useState<string | undefined>(undefined);

    const [mapCenter, setMapCenter] = useState<[number, number]>(localStorage.getItem('mapCenter')
        ? JSON.parse(localStorage.getItem('mapCenter') || '[7.1545,50.7438]') as [number, number]
        : [7.1545, 50.7438]);

    const mapRef = React.useRef<MapRef | null>(null);

    /**
     * Query params
     */
    useEffect(() => {
        const qUnit = searchParams.get('unitId');
        const qItem = searchParams.get('mapItemId');
        const qGroup = searchParams.get('groupId');
        // If unitId or groupId is present in the URL, we could set some state here to filter displayed units/groups on the map.
        // For now, we'll just log them.
        if (qUnit) {
            let unit = dataProvider.getAllUnits().get(qUnit);
            setShowUnit(unit || undefined);
            if (unit) {
                setZoom(16);
                if (unit.getPosition()) {
                    setMapCenter([unit.getPosition()!.getLongitude(), unit.getPosition()!.getLatitude()]);
                }
            } else {
                dataProvider.on(DataProviderEventType.UNIT_ADDED, (event: DataProviderEvent) => {
                    const updatedUnit = event.data as Unit;
                    if (updatedUnit.getId() == qUnit) {
                        console.log('Unit position updated:', updatedUnit.getPosition());
                        setShowUnit(updatedUnit);
                        if (updatedUnit.getPosition()) {
                            if (mapRef.current) {
                                mapRef.current.getMap().flyTo({
                                    center: [updatedUnit.getPosition()!.getLongitude(), updatedUnit.getPosition()!.getLatitude()],
                                    zoom: 16,
                                    essential: true,
                                });
                            }
                        }
                    }
                });
            }
        }

        if (qItem) {
            let item = dataProvider.getAllMapItems().get(qItem);
            setShowItem(item || undefined);
            if (item) {
                setZoom(item.getZoomLevel());
                setMapCenter([item.getLongitude(), item.getLatitude()]);

            } else {
                dataProvider.on(DataProviderEventType.MAP_ITEM_UPDATED, (event: DataProviderEvent) => {
                    const updatedItem = event.data as MapItem;
                    if (updatedItem.getId() === qItem) {
                        setShowItem(updatedItem);
                        if (mapRef.current) {
                            mapRef.current.getMap().flyTo({
                                center: [updatedItem.getLongitude(), updatedItem.getLatitude()],
                                zoom: updatedItem.getZoomLevel(),
                                essential: true,
                            });
                        }
                    }
                });
            }
        }
        if (qGroup) {
            setShowGroupId(qGroup);
        }

    }, []);

    const mapMoved = (e: { viewState: { longitude: number, latitude: number, zoom: number } }) => {
        void keyValueStore.setItem('mapCenter', JSON.stringify([e.viewState.longitude, e.viewState.latitude]));
        void keyValueStore.setItem('mapZoom', JSON.stringify(e.viewState.zoom));
    }

    const [mapStyle, setMapStyle] = React.useState<MapBaseLayer | null>(null);

    const [showItemPopup, setShowItemPopup] = React.useState<boolean>(true);

    // ── Context menu ──────────────────────────────────────────────────────
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; lng: number; lat: number } | null>(null);

    // ── Create MapItem dialog ─────────────────────────────────────────────
    const [createOpen, setCreateOpen] = useState(false);
    const [createName, setCreateName] = useState('');
    const [createLat, setCreateLat] = useState('');
    const [createLng, setCreateLng] = useState('');
    const [createZoom, setCreateZoom] = useState('14');
    const [createShowOnMap, setCreateShowOnMap] = useState(false);
    const [createGroupId, setCreateGroupId] = useState('');
    const [groups, setGroups] = useState<MapGroup[]>(() => Array.from(dataProvider.getAllMapGroups().values()));

    useEffect(() => {
        const refresh = () => setGroups(Array.from(DataProvider.getInstance().getAllMapGroups().values()));
        const events = [
            DataProviderEventType.MAP_GROUPS_UPDATED,
            DataProviderEventType.MAP_GROUPS_CREATED,
            DataProviderEventType.MAP_GROUPS_DELETED,
        ] as const;
        events.forEach((e) => GlobalEventHandler.getInstance().on(e, refresh));
        return () => events.forEach((e) => GlobalEventHandler.getInstance().off(e, refresh));
    }, []);

    const openCreateDialog = (lng: number, lat: number) => {
        setContextMenu(null);
        setCreateName('');
        setCreateLat(lat.toFixed(6));
        setCreateLng(lng.toFixed(6));
        setCreateZoom(String(zoom));
        setCreateShowOnMap(false);
        setCreateGroupId('');
        setCreateOpen(true);
    };

    const saveCreateDialog = () => {
        const item = new MapItem({
            latitude: parseFloat(createLat),
            longitude: parseFloat(createLng),
            name: createName.trim(),
            zoomLevel: parseInt(createZoom, 10),
            showOnMap: createShowOnMap,
            groupId: createGroupId || null,
        });
        // Just create the item remotely; it will be added to the map via WebSocket update to ensure real-time consistency with the backend and other clients.
        void ApiProvider.getInstance().saveMapItem(item);
        setCreateOpen(false);
    };

    const [zoom, setZoom] = React.useState<number>(() => {
        //if (resolvedItem) return resolvedItem.getZoomLevel();
        //if (qZoom) return parseFloat(qZoom);
        const stored = localStorage.getItem('mapZoom');
        return stored ? (JSON.parse(stored) as number) : 14;
    });


    useEffect(() => {
        const provider = DataProvider.getInstance();

        const mapStyle = provider.getMapStyle()
        if (mapStyle != undefined) {
            setMapStyle(mapStyle);
        }
        const onMapStyleUpdated = (event: DataProviderEvent) => {
            setMapStyle(event.data as MapBaseLayer);
        };
        provider.on(DataProviderEventType.MAP_STYLE_UPDATED, onMapStyleUpdated);

        return () => {
            provider.off(DataProviderEventType.MAP_STYLE_UPDATED, onMapStyleUpdated);
        };
    }, []);

    if (!mapStyle) {
        return <div>Loading...</div>;
    }

    return (
        <>
            <MapLibreMap
                initialViewState={{
                    longitude: mapCenter[0],
                    latitude: mapCenter[1],
                    zoom: zoom
                }}
                style={{ width: '100%', height: '100%' }}
                mapStyle={mapStyle.getUrl()}
                attributionControl={false}
                onMoveEnd={mapMoved}
                onContextMenu={(e) => {
                    e.originalEvent.preventDefault();
                    setContextMenu({
                        x: e.originalEvent.clientX,
                        y: e.originalEvent.clientY,
                        lng: e.lngLat.lng,
                        lat: e.lngLat.lat,
                    });
                }}
                onClick={() => setContextMenu(null)}
                ref={mapRef}
            >
                <GeolocateControl />
                <NavigationControl />
                <ReactLayerControl position="bottom-left" dataProvider={dataProvider} />
                <ReactSearchControl position="top-left" dataProvider={dataProvider} globalEventHandler={eventHandler} />

                <RouteDisplay></RouteDisplay>
                <UnitDisplay showId={showUnit ? showUnit.getId() : undefined} />
                <GroupDisplay groupId={showGroupId} />

                {showItem && (
                    <Marker longitude={showItem.getLongitude()} latitude={showItem.getLatitude()} />
                )}
                {showItem && showItemPopup && (
                    <Popup
                        longitude={showItem.getLongitude()}
                        latitude={showItem.getLatitude()}
                        anchor="bottom"
                        offset={[0, -35] as [number, number]}
                        onClose={() => setShowItemPopup(false)}
                    >
                        {showItem.getName()}
                    </Popup>
                )}
            </MapLibreMap>
            {/* ── Context menu ──────────────────────────────────────────────── */}
            {contextMenu && (
                <div
                    className="mapcontextmenu-root"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                    onMouseLeave={() => setContextMenu(null)}
                >
                    <button onClick={() => openCreateDialog(contextMenu.lng, contextMenu.lat)}>
                        Create Map Item here
                    </button>
                </div>
            )}
            {/* ── Create MapItem dialog ──────────────────────────────────────── */}
            <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Create Map Item</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
                    <TextField
                        label="Name"
                        value={createName}
                        onChange={(e) => setCreateName(e.target.value)}
                        fullWidth
                        size="small"
                        autoFocus
                    />
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            label="Latitude"
                            type="number"
                            value={createLat}
                            onChange={(e) => setCreateLat(e.target.value)}
                            fullWidth
                            size="small"
                            slotProps={{ htmlInput: { step: 'any' } }}
                        />
                        <TextField
                            label="Longitude"
                            type="number"
                            value={createLng}
                            onChange={(e) => setCreateLng(e.target.value)}
                            fullWidth
                            size="small"
                            slotProps={{ htmlInput: { step: 'any' } }}
                        />
                    </Box>
                    <TextField
                        label="Zoom Level"
                        type="number"
                        value={createZoom}
                        onChange={(e) => setCreateZoom(e.target.value)}
                        size="small"
                        sx={{ width: 160 }}
                        slotProps={{ htmlInput: { min: 1, max: 22 } }}
                    />
                    <FormControl size="small" fullWidth>
                        <InputLabel>Group</InputLabel>
                        <Select
                            value={createGroupId}
                            label="Group"
                            onChange={(e) => setCreateGroupId(e.target.value)}
                        >
                            <MenuItem value=""><em>No group</em></MenuItem>
                            {groups.map((g) => (
                                <MenuItem key={g.getId()} value={g.getId()}>{g.getName()}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={createShowOnMap}
                                onChange={(e) => setCreateShowOnMap(e.target.checked)}
                            />
                        }
                        label="Show on Map"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={saveCreateDialog}
                        disabled={!createName.trim() || isNaN(parseFloat(createLat)) || isNaN(parseFloat(createLng))}
                    >
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
}