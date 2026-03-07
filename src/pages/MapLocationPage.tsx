import { type JSX, useEffect, useMemo, useState } from 'react';
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    InputAdornment,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import IconButton from '@mui/material/IconButton';
import MapIcon from '@mui/icons-material/Map';
import { useNavigate } from 'react-router-dom';
import { DataProvider, DataProviderEventType } from '../dataProviders/DataProvider.ts';
import { type MapItem } from '../enitities/MapItem.ts';
import { type MapGroup } from '../enitities/MapGroup.ts';
import { GlobalEventHandler } from '../dataProviders/GlobalEventHandler.ts';
import { DatabaseProvider } from '../dataProviders/DatabaseProvider.ts';
import { ApiProvider } from '../dataProviders/ApiProvider.ts';

type SortField = 'name' | 'groupId' | 'latitude' | 'longitude' | 'zoomLevel';
type SortOrder = 'asc' | 'desc';

export function MapLocationPage(): JSX.Element {
    const navigate = useNavigate();
    const dp = DataProvider.getInstance();
    const [items, setItems] = useState<MapItem[]>(() => Array.from(dp.getMapLocations().values()));
    const [groups, setGroups] = useState<MapGroup[]>(() => Array.from(dp.getMapGroups().values()));

    const [nameFilter, setNameFilter] = useState('');
    const [groupFilter, setGroupFilter] = useState<string>('');
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

    useEffect(() => {
        const refresh = () => {
            setItems(Array.from(dp.getMapLocations().values()));
            setGroups(Array.from(dp.getMapGroups().values()));
        };

        const events = [
            DataProviderEventType.MAP_ITEM_CREATED,
            DataProviderEventType.MAP_ITEM_UPDATED,
            DataProviderEventType.MAP_ITEM_DELETED,
            DataProviderEventType.MAP_GROUPS_UPDATED,
            DataProviderEventType.MAP_GROUPS_CREATED,
            DataProviderEventType.MAP_GROUPS_DELETED,
        ];

        events.forEach((e) => GlobalEventHandler.getInstance().on(e, refresh));
        return () => events.forEach((e) => GlobalEventHandler.getInstance().off(e, refresh));
    }, []);

    const groupMap = useMemo(() => {
        const m = new Map<string, string>();
        groups.forEach((g) => m.set(g.getID(), g.getName()));
        return m;
    }, [groups]);

    const filtered = useMemo(() => {
        let result = items;

        if (nameFilter.trim()) {
            const lower = nameFilter.toLowerCase();
            result = result.filter((item) => item.getName().toLowerCase().includes(lower));
        }

        if (groupFilter) {
            result = result.filter((item) => item.getGroupId() === groupFilter);
        }

        result = [...result].sort((a, b) => {
            let aVal: string | number;
            let bVal: string | number;

            if (sortField === 'name') {
                aVal = a.getName().toLowerCase();
                bVal = b.getName().toLowerCase();
            } else if (sortField === 'groupId') {
                aVal = groupMap.get(a.getGroupId() ?? '') ?? '';
                bVal = groupMap.get(b.getGroupId() ?? '') ?? '';
            } else if (sortField === 'latitude') {
                aVal = a.getLatitude();
                bVal = b.getLatitude();
            } else if (sortField === 'longitude') {
                aVal = a.getLongitude();
                bVal = b.getLongitude();
            } else {
                aVal = a.getZoomLevel();
                bVal = b.getZoomLevel();
            }

            if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [items, nameFilter, groupFilter, sortField, sortOrder, groupMap]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const openOnMap = (item: MapItem) => {
        const params = new URLSearchParams({
            mapItemId: String(item.getId()),
        });
        void navigate(`/map?${params.toString()}`);
    };

    // ── Edit dialog state ──────────────────────────────────────────────────
    const [editingItem, setEditingItem] = useState<MapItem | null>(null);
    const [editName, setEditName] = useState('');
    const [editLatitude, setEditLatitude] = useState('');
    const [editLongitude, setEditLongitude] = useState('');
    const [editZoomLevel, setEditZoomLevel] = useState('');
    const [editShowOnMap, setEditShowOnMap] = useState(false);
    const [editGroupId, setEditGroupId] = useState<string>('');

    const openEditDialog = (item: MapItem) => {
        setEditingItem(item);
        setEditName(item.getName());
        setEditLatitude(String(item.getLatitude()));
        setEditLongitude(String(item.getLongitude()));
        setEditZoomLevel(String(item.getZoomLevel()));
        setEditShowOnMap(item.getShowOnMap());
        setEditGroupId(item.getGroupId() ?? '');
    };

    const closeEditDialog = () => setEditingItem(null);

    const saveEditDialog = () => {
        if (!editingItem) return;

        editingItem.setName(editName.trim());
        editingItem.setLatitude(parseFloat(editLatitude));
        editingItem.setLongitude(parseFloat(editLongitude));
        editingItem.setZoomLevel(parseInt(editZoomLevel, 10));
        editingItem.setShowOnMap(editShowOnMap);
        editingItem.setGroupId(editGroupId || null);

        DataProvider.getInstance().addMapItem(editingItem);
        void DatabaseProvider.getInstance().then((db) =>
            db.saveNamedGeoReferencedObject(editingItem)
        );
        void ApiProvider.getInstance().saveMapItem(editingItem);
        closeEditDialog();
    };

    return (
        <>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2, gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>Map Locations</Typography>
                    <Chip label={`${filtered.length} / ${items.length}`} size="small" variant="outlined" />
                </Box>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <TextField
                        label="Filter by Name"
                        size="small"
                        value={nameFilter}
                        onChange={(e) => setNameFilter(e.target.value)}
                        sx={{ minWidth: 220 }}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Filter by Group</InputLabel>
                        <Select
                            value={groupFilter}
                            label="Filter by Group"
                            onChange={(e) => setGroupFilter(e.target.value)}
                        >
                            <MenuItem value="">
                                <em>All groups</em>
                            </MenuItem>
                            {groups.map((g) => (
                                <MenuItem key={g.getID()} value={g.getID()}>
                                    {g.getName()}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button variant="outlined" onClick={() => {
                        const params = new URLSearchParams({
                            groupId: String(groupFilter),
                        });
                        void navigate(`/map?${params.toString()}`);
                    }}
                        disabled={!groupFilter}
                    >
                        Show all on Map
                    </Button>
                </Box>

                <TableContainer component={Paper} sx={{ flex: 1, overflow: 'auto' }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sortDirection={sortField === 'name' ? sortOrder : false}>
                                    <TableSortLabel
                                        active={sortField === 'name'}
                                        direction={sortField === 'name' ? sortOrder : 'asc'}
                                        onClick={() => handleSort('name')}
                                    >
                                        Name
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell sortDirection={sortField === 'groupId' ? sortOrder : false}>
                                    <TableSortLabel
                                        active={sortField === 'groupId'}
                                        direction={sortField === 'groupId' ? sortOrder : 'asc'}
                                        onClick={() => handleSort('groupId')}
                                    >
                                        Group
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell sortDirection={sortField === 'latitude' ? sortOrder : false} align="right">
                                    <TableSortLabel
                                        active={sortField === 'latitude'}
                                        direction={sortField === 'latitude' ? sortOrder : 'asc'}
                                        onClick={() => handleSort('latitude')}
                                    >
                                        Latitude
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell sortDirection={sortField === 'longitude' ? sortOrder : false} align="right">
                                    <TableSortLabel
                                        active={sortField === 'longitude'}
                                        direction={sortField === 'longitude' ? sortOrder : 'asc'}
                                        onClick={() => handleSort('longitude')}
                                    >
                                        Longitude
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell sortDirection={sortField === 'zoomLevel' ? sortOrder : false} align="right">
                                    <TableSortLabel
                                        active={sortField === 'zoomLevel'}
                                        direction={sortField === 'zoomLevel' ? sortOrder : 'asc'}
                                        onClick={() => handleSort('zoomLevel')}
                                    >
                                        Zoom
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell align="center">On Map</TableCell>
                                <TableCell align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ color: 'text.secondary', py: 4 }}>
                                        No map locations match the current filters.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((item) => (
                                    <TableRow key={item.getId()} hover>
                                        <TableCell>{item.getName()}</TableCell>
                                        <TableCell>
                                            {item.getGroupId()
                                                ? groupMap.get(item.getGroupId()!) ?? item.getGroupId()
                                                : <Typography variant="body2" color="text.secondary">—</Typography>}
                                        </TableCell>
                                        <TableCell align="right">{item.getLatitude().toFixed(6)}</TableCell>
                                        <TableCell align="right">{item.getLongitude().toFixed(6)}</TableCell>
                                        <TableCell align="right">{item.getZoomLevel()}</TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={item.getShowOnMap() ? 'Yes' : 'No'}
                                                color={item.getShowOnMap() ? 'success' : 'default'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="Edit">
                                                <IconButton size="small" onClick={() => openEditDialog(item)}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Open on Map">
                                                <IconButton size="small" onClick={() => openOnMap(item)}>
                                                    <MapIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            {/* ── Edit MapItem Dialog ──────────────────────────────────── */}
            <Dialog open={editingItem !== null} onClose={closeEditDialog} fullWidth maxWidth="sm">
                <DialogTitle>Edit Map Item</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
                    <TextField
                        label="Name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        fullWidth
                        size="small"
                    />
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            label="Latitude"
                            type="number"
                            value={editLatitude}
                            onChange={(e) => setEditLatitude(e.target.value)}
                            fullWidth
                            size="small"
                            slotProps={{ htmlInput: { step: 'any' } }}
                        />
                        <TextField
                            label="Longitude"
                            type="number"
                            value={editLongitude}
                            onChange={(e) => setEditLongitude(e.target.value)}
                            fullWidth
                            size="small"
                            slotProps={{ htmlInput: { step: 'any' } }}
                        />
                    </Box>
                    <TextField
                        label="Zoom Level"
                        type="number"
                        value={editZoomLevel}
                        onChange={(e) => setEditZoomLevel(e.target.value)}
                        size="small"
                        sx={{ width: 160 }}
                        slotProps={{ htmlInput: { min: 1, max: 22 } }}
                    />
                    <FormControl size="small" fullWidth>
                        <InputLabel>Group</InputLabel>
                        <Select
                            value={editGroupId}
                            label="Group"
                            onChange={(e) => setEditGroupId(e.target.value)}
                        >
                            <MenuItem value=""><em>No group</em></MenuItem>
                            {groups.map((g) => (
                                <MenuItem key={g.getID()} value={g.getID()}>{g.getName()}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={editShowOnMap}
                                onChange={(e) => setEditShowOnMap(e.target.checked)}
                            />
                        }
                        label="Show on Map"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeEditDialog}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={saveEditDialog}
                        disabled={!editName.trim() || isNaN(parseFloat(editLatitude)) || isNaN(parseFloat(editLongitude))}
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
