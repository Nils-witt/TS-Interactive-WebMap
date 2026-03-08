import { type JSX, useEffect, useMemo, useRef, useState } from 'react';
import {
    Box,
    Button,
    Checkbox,
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
    const [items, setItems] = useState<MapItem[]>(() => Array.from(dp.getAllMapItems().values()));
    const [groups, setGroups] = useState<MapGroup[]>(() => Array.from(dp.getAllMapGroups().values()));

    const [nameFilter, setNameFilter] = useState('');
    const [groupFilter, setGroupFilter] = useState<string>('');
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

    useEffect(() => {
        const refresh = () => {
            setItems(Array.from(dp.getAllMapItems().values()));
            setGroups(Array.from(dp.getAllMapGroups().values()));
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
        groups.forEach((g) => m.set(g.getId(), g.getName()));
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
    const [confirmDelete, setConfirmDelete] = useState(false);

    // ── Multiselect state ──────────────────────────────────────────────────
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
    const lastSelectedId = useRef<string | null>(null);

    // ── Bulk-edit state ────────────────────────────────────────────────────
    const [bulkEditOpen, setBulkEditOpen] = useState(false);
    // '' means "keep current value"
    const [bulkEditGroupId, setBulkEditGroupId] = useState<string>('__keep__');
    const [bulkEditShowOnMap, setBulkEditShowOnMap] = useState<'' | 'true' | 'false'>('');
    const [bulkEditZoomLevel, setBulkEditZoomLevel] = useState<string>('');

    const openBulkEdit = () => {
        setBulkEditGroupId('__keep__');
        setBulkEditShowOnMap('');
        setBulkEditZoomLevel('');
        setBulkEditOpen(true);
    };

    const saveBulkEdit = () => {
        const selectedItems = items.filter((item) => item.getId() !== null && selectedIds.has(item.getId()!));
        for (const item of selectedItems) {
            if (bulkEditGroupId !== '__keep__') {
                item.setGroupId(bulkEditGroupId === '' ? null : bulkEditGroupId);
            }
            if (bulkEditShowOnMap !== '') {
                item.setShowOnMap(bulkEditShowOnMap === 'true');
            }
            if (bulkEditZoomLevel.trim() !== '') {
                const z = parseInt(bulkEditZoomLevel, 10);
                if (!isNaN(z)) item.setZoomLevel(z);
            }
            DataProvider.getInstance().addMapItem(item);
            void DatabaseProvider.getInstance().then((db) => db.saveMapItem(item));
            void ApiProvider.getInstance().saveMapItem(item);
        }
        setBulkEditOpen(false);
    };

    const allFilteredSelected =
        filtered.length > 0 && filtered.every((item) => item.getId() !== null && selectedIds.has(item.getId()!));
    const someFilteredSelected =
        !allFilteredSelected && filtered.some((item) => item.getId() !== null && selectedIds.has(item.getId()!));

    const toggleAll = () => {
        if (allFilteredSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filtered.filter((item) => item.getId() !== null).map((item) => item.getId()!)));
        }
    };

    const handleRowCheck = (id: string, shiftKey: boolean) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (shiftKey && lastSelectedId.current !== null && lastSelectedId.current !== id) {
                const ids = filtered.map((item) => item.getId()!).filter(Boolean);
                const anchorIdx = ids.indexOf(lastSelectedId.current);
                const targetIdx = ids.indexOf(id);
                if (anchorIdx !== -1 && targetIdx !== -1) {
                    const [from, to] = anchorIdx < targetIdx ? [anchorIdx, targetIdx] : [targetIdx, anchorIdx];
                    // Determine intent: if target is not yet selected, add the range; otherwise remove it
                    const adding = !prev.has(id);
                    for (let i = from; i <= to; i++) {
                        if (adding) next.add(ids[i]);
                        else next.delete(ids[i]);
                    }
                    lastSelectedId.current = id;
                    return next;
                }
            }
            if (next.has(id)) next.delete(id);
            else next.add(id);
            lastSelectedId.current = id;
            return next;
        });
    };

    const bulkDeleteItems = () => {
        for (const id of selectedIds) {
            void ApiProvider.getInstance().deleteMapItem(id);
            void DataProvider.getInstance().deleteMapItem(id);
            void DatabaseProvider.getInstance().then((db) => db.deleteMapItem(id));
        }
        setSelectedIds(new Set());
        setConfirmBulkDelete(false);
    };

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
            db.saveMapItem(editingItem)
        );
        void ApiProvider.getInstance().saveMapItem(editingItem);
        closeEditDialog();
    };

        const confirmDeleteItem = () => {
            if (!editingItem || !editingItem.getId()) return;
            setConfirmDelete(false);
            closeEditDialog();
            void ApiProvider.getInstance().deleteMapItem(editingItem.getId()!);
            void DataProvider.getInstance().deleteMapItem(editingItem.getId()!);
            void DatabaseProvider.getInstance().then((db) => db.deleteMapItem(editingItem.getId()!));
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
                                <MenuItem key={g.getId()} value={g.getId()}>
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
                    {selectedIds.size > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
                            <Typography variant="body2" color="text.secondary">
                                {selectedIds.size} selected
                            </Typography>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={openBulkEdit}
                            >
                                Edit Selected
                            </Button>
                            <Button
                                variant="contained"
                                color="error"
                                size="small"
                                onClick={() => setConfirmBulkDelete(true)}
                            >
                                Delete Selected
                            </Button>
                            <Button size="small" onClick={() => setSelectedIds(new Set())}>
                                Clear
                            </Button>
                        </Box>
                    )}
                </Box>

                <TableContainer component={Paper} sx={{ flex: 1, overflow: 'auto' }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        size="small"
                                        checked={allFilteredSelected}
                                        indeterminate={someFilteredSelected}
                                        onChange={toggleAll}
                                        disabled={filtered.length === 0}
                                    />
                                </TableCell>
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
                                    <TableCell colSpan={8} align="center" sx={{ color: 'text.secondary', py: 4 }}>
                                        No map locations match the current filters.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((item) => (
                                    <TableRow
                                        key={item.getId()}
                                        hover
                                        selected={item.getId() !== null && selectedIds.has(item.getId()!)}
                                    >
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                size="small"
                                                checked={item.getId() !== null && selectedIds.has(item.getId()!)}
                                                onChange={(e) => item.getId() !== null && handleRowCheck(item.getId()!, (e.nativeEvent as MouseEvent).shiftKey)}
                                            />
                                        </TableCell>
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
            {/* --- bulk edit dialog --- */}
            <Dialog open={bulkEditOpen} onClose={() => setBulkEditOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle>Edit {selectedIds.size} Selected Item(s)</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
                    <Typography variant="body2" color="text.secondary">
                        Only fields you change will be updated. Leave a field at "Keep current" to leave it unchanged.
                    </Typography>
                    <FormControl size="small" fullWidth>
                        <InputLabel>Group</InputLabel>
                        <Select
                            value={bulkEditGroupId}
                            label="Group"
                            onChange={(e) => setBulkEditGroupId(e.target.value)}
                        >
                            <MenuItem value="__keep__"><em>Keep current</em></MenuItem>
                            <MenuItem value=""><em>No group</em></MenuItem>
                            {groups.map((g) => (
                                <MenuItem key={g.getId()} value={g.getId()}>{g.getName()}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl size="small" fullWidth>
                        <InputLabel>Show on Map</InputLabel>
                        <Select
                            value={bulkEditShowOnMap}
                            label="Show on Map"
                            onChange={(e) => setBulkEditShowOnMap(e.target.value as '' | 'true' | 'false')}
                        >
                            <MenuItem value=""><em>Keep current</em></MenuItem>
                            <MenuItem value="true">Yes</MenuItem>
                            <MenuItem value="false">No</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField
                        label="Zoom Level"
                        type="number"
                        value={bulkEditZoomLevel}
                        onChange={(e) => setBulkEditZoomLevel(e.target.value)}
                        size="small"
                        placeholder="Keep current"
                        slotProps={{ htmlInput: { min: 1, max: 22 } }}
                        fullWidth
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setBulkEditOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={saveBulkEdit}>
                        Apply
                    </Button>
                </DialogActions>
            </Dialog>
            {/* --- confirm bulk delete dialog --- */}
            <Dialog open={confirmBulkDelete} onClose={() => setConfirmBulkDelete(false)}>
                <DialogTitle>Delete Selected Items</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete <strong>{selectedIds.size}</strong> selected item(s)? This cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmBulkDelete(false)}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={bulkDeleteItems}>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
            {/* --- confirm delete dialog --- */}
            <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
                <DialogTitle>Delete Map Item</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete <strong>{editingItem?.getName()}</strong>? This cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDelete(false)}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={confirmDeleteItem}>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
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
                                <MenuItem key={g.getId()} value={g.getId()}>{g.getName()}</MenuItem>
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
                    <Button onClick={() => {
                        if (!editingItem) return;
                        setConfirmDelete(true);
                    }}>Delete</Button>
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
