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
import { useContext, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GeolocateControl, Map as MapLibreMap, Marker, NavigationControl, Popup, type MapRef } from '@vis.gl/react-maplibre';
import ReactLayerControl from "../controls/LayerControl";
import ReactSearchControl from "../controls/SearchControl";
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
import { ApiProvider } from "../dataProviders/ApiProvider.ts";
import './css/mapContextMenu.scss';
import type { Unit } from '../enitities/Unit.ts';
import { UnitsContext } from '../contexts/UnitsContext.tsx';
import { LocalStorageProvider } from '../dataProviders/LocalStorageProvider.ts';
import { MapItemContext } from '../contexts/MapItemContext.tsx';
import { MapGroupContext } from '../contexts/MapGroupContext.tsx';
import { useMapBaseLayer } from '../contexts/MapBaseLayerContext.tsx';

export function MapComponent() {
    const keyValueStore = new LocalStorageProvider();

    const [searchParams] = useSearchParams();
    const [qUnit, setQUnit] = useState<string | null>(searchParams.get('unitId'));
    const [qItem, setQItem] = useState<string | null>(searchParams.get('mapItemId'));
    const [qGroup, setQGroup] = useState<string | null>(searchParams.get('groupId'));

    const [showItem, setShowItem] = useState<MapItem | undefined>(undefined);
    const [showUnit, setShowUnit] = useState<Unit | undefined>(undefined);
    const [showGroupId, setShowGroupId] = useState<string | undefined>(undefined);

    const [mapCenter, setMapCenter] = useState<[number, number]>(localStorage.getItem('mapCenter')
        ? JSON.parse(localStorage.getItem('mapCenter') || '[7.1545,50.7438]') as [number, number]
        : [7.1545, 50.7438]);
    const baseLayer = useMapBaseLayer();
    const mapRef = React.useRef<MapRef | null>(null);


    const units = useContext(UnitsContext);
    const items = useContext(MapItemContext);
    const groups = useContext(MapGroupContext);


    useEffect(() => {
        setQUnit(searchParams.get('unitId'));
        setQItem(searchParams.get('mapItemId'));
        setQGroup(searchParams.get('groupId'));
    }, [searchParams]);


    useEffect(() => {
        if (qUnit) {
            units.forEach((u) => {
                if (u.getId() === qUnit) {
                    setShowUnit(u);
                    if (u.getPosition()) {
                        setZoom(16);
                        setMapCenter([u.getPosition()!.getLongitude(), u.getPosition()!.getLatitude()]);
                    }
                }
            });
        }

    }, [qUnit, units]);


    useEffect(() => {
        if (qGroup) {
            setShowGroupId(qGroup);
        }else {
            setShowGroupId(undefined);
        }
    }, [qGroup]);


    useEffect(() => {
        if(qItem){
            items.forEach((i) => {
                if (i.getId() === qItem) {
                    setShowItem(i);
                    setZoom(i.getZoomLevel());
                    setMapCenter([i.getLongitude(), i.getLatitude()]);
                }
            });
        }else {
            setShowItem(undefined);
        }

    }, [qItem, items]);


    const mapMoved = (e: { viewState: { longitude: number, latitude: number, zoom: number } }) => {
        void keyValueStore.setItem('mapCenter', JSON.stringify([e.viewState.longitude, e.viewState.latitude]));
        void keyValueStore.setItem('mapZoom', JSON.stringify(e.viewState.zoom));
    }

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


    if (!baseLayer) {
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
                mapStyle={baseLayer.getUrl()}
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
                <ReactLayerControl position="bottom-left"/>
                <ReactSearchControl position="top-left"/>

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