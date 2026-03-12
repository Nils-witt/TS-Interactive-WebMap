import { type JSX, useContext, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Avatar,
    Box,
    Button,
    Checkbox,
    Chip,
    CircularProgress,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    InputAdornment,
    IconButton,
    MenuItem,
    Paper,
    Select,
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
    FormControl,
    InputLabel,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MapIcon from '@mui/icons-material/Map';
import EditIcon from '@mui/icons-material/Edit';
import { DataProvider } from '../dataProviders/DataProvider.ts';
import { Unit } from '../enitities/Unit.ts';
import { ApiProvider } from '../dataProviders/ApiProvider.ts';
import { UnitsContext } from '../contexts/UnitsContext.tsx';

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<number, string> = {
    1: 'Funk Frei',
    2: 'Einsatzbereit',
    3: 'Einsatz übernommen',
    4: 'Am Einsatzort',
    5: 'Sprechwunsch',
    6: 'Nicht Einsatzbereit',
    7: 'Zum Transportziel',
    8: 'Transportziel erreicht',
    9: 'Priorisierter Sprechwunsch',
};

const STATUS_COLORS: Record<number, 'success' | 'primary' | 'warning' | 'error' | 'default'> = {
    1: 'success',
    2: 'success',
    3: 'primary',
    4: 'primary',
    5: 'error',
    6: 'error',
    7: 'primary',
    8: 'success',
    9: 'error',
};

type SortField = 'name' | 'status' | 'group' | 'latitude' | 'longitude' | 'timestamp';
type SortOrder = 'asc' | 'desc';
const STATUS_FILTER_OPTIONS = [1, 2, 3, 4, 6, 7, 8] as const;

// ---------------------------------------------------------------------------

export function UnitsPage(): JSX.Element {
    const dp = DataProvider.getInstance();
    const navigate = useNavigate();

    const units = useContext(UnitsContext);

    const [nameFilter, setNameFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<number[]>([...STATUS_FILTER_OPTIONS]);
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

    // ── Edit dialog state ──────────────────────────────────────────────────
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
    const [editName, setEditName] = useState('');
    const [editStatus, setEditStatus] = useState<string>('');
    const [editSaving, setEditSaving] = useState(false);

    const openEditDialog = (unit: Unit, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingUnit(unit);
        setEditName(unit.getName());
        setEditStatus(unit.getStatus() != null ? String(unit.getStatus()) : '');
    };

    const closeEditDialog = () => setEditingUnit(null);

    const saveEditDialog = () => {
        if (!editingUnit) return;
        const status = editStatus !== '' ? parseInt(editStatus) : null;
        const updated = new Unit({
            id: editingUnit.getId() ?? undefined,
            name: editName.trim() || editingUnit.getName(),
            position: editingUnit.getPosition()?.record() as never ?? { latitude: 0, longitude: 0, accuracy: 0, timestamp: new Date().toISOString() },
            groupId: editingUnit.getGroupId(),
            unit_status: status,
            symbol: editingUnit.getSymbol() ?? undefined,
        });
        setEditSaving(true);
        ApiProvider.getInstance()
            .saveUnit(updated)
            .then((saved) => {
                dp.addUnit(saved);
                closeEditDialog();
            })
            .catch((e) => console.error('Failed to save unit:', e))
            .finally(() => setEditSaving(false));
    };

    // Sort toggle
    const handleSort = (field: SortField) => {
        if (field === sortField) {
            setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const sortDir = sortOrder === 'asc' ? 1 : -1;

    const filtered = useMemo(() => {
        let result = units;

        if (nameFilter.trim()) {
            const lower = nameFilter.toLowerCase();
            result = result.filter((u) => u.getName().toLowerCase().includes(lower));
        }

        if (statusFilter.length > 0) {
            result = result.filter((u) => {
                const status = u.getStatus();
                return status != null && statusFilter.includes(status);
            });
        }

        return [...result].sort((a, b) => {
            switch (sortField) {
                case 'name':
                    return a.getName().localeCompare(b.getName()) * sortDir;
                case 'status': {
                    const sa = a.getStatus() ?? 0;
                    const sb = b.getStatus() ?? 0;
                    return (sa - sb) * sortDir;
                }
                case 'group':
                    return (a.getGroupId() ?? '').localeCompare(b.getGroupId() ?? '') * sortDir;
                case 'latitude': {
                    const la = a.getPosition()?.getLatitude() ?? 0;
                    const lb = b.getPosition()?.getLatitude() ?? 0;
                    return (la - lb) * sortDir;
                }
                case 'longitude': {
                    const la = a.getPosition()?.getLongitude() ?? 0;
                    const lb = b.getPosition()?.getLongitude() ?? 0;
                    return (la - lb) * sortDir;
                }
                case 'timestamp': {
                    const ta = a.getPosition()?.getTimestamp().getTime() ?? 0;
                    const tb = b.getPosition()?.getTimestamp().getTime() ?? 0;
                    return (ta - tb) * sortDir;
                }
                default:
                    return 0;
            }
        });
    }, [units, nameFilter, statusFilter, sortField, sortOrder]);

    const col = (field: SortField, label: string) => (
        <TableCell sortDirection={sortField === field ? sortOrder : false}>
            <TableSortLabel
                active={sortField === field}
                direction={sortField === field ? sortOrder : 'asc'}
                onClick={() => handleSort(field)}
            >
                {label}
            </TableSortLabel>
        </TableCell>
    );

    return (
        <Box sx={{ overflowY: 'auto', height: '100%', py: 3 }}>
            <Container maxWidth="xl">
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2, flexWrap: 'wrap' }}>
                    <Typography variant="h4" sx={{ flexGrow: 1 }}>
                        Units
                    </Typography>
                    <Chip label={`${filtered.length} / ${units.length}`} variant="outlined" size="small" />
                    <TextField
                        size="small"
                        placeholder="Filter by name…"
                        value={nameFilter}
                        onChange={(e) => setNameFilter(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ width: 240 }}
                    />
                    <FormControl size="small" sx={{ minWidth: 300 }}>
                        <InputLabel id="units-status-filter-label">Status Filter</InputLabel>
                        <Select
                            labelId="units-status-filter-label"
                            multiple
                            label="Status Filter"
                            value={statusFilter.map(String)}
                            onChange={(e) => {
                                const value = e.target.value as string[];
                                setStatusFilter(
                                    value
                                        .map((v) => parseInt(v, 10))
                                        .filter((v) => !isNaN(v)),
                                );
                            }}
                            renderValue={(selected) => {
                                const values = selected as string[];
                                return values
                                    .map((v) => {
                                        const status = parseInt(v, 10);
                                        return `${status}`;
                                    })
                                    .join(', ');
                            }}
                        >
                            {STATUS_FILTER_OPTIONS.map((status) => (
                                <MenuItem key={status} value={String(status)}>
                                    <Checkbox checked={statusFilter.includes(status)} size="small" />
                                    {status} – {STATUS_LABELS[status]}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                {/* Table */}
                <TableContainer component={Paper}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ width: 48 }}>Symbol</TableCell>
                                {col('name', 'Name')}
                                {col('status', 'Status')}
                                {col('latitude', 'Latitude')}
                                {col('longitude', 'Longitude')}
                                {col('timestamp', 'Last Update')}
                                <TableCell sx={{ width: 56 }} />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center">
                                        <Typography color="text.secondary" variant="body2" sx={{ py: 4 }}>
                                            {units.length === 0 ? 'No units received yet.' : 'No units match the filter.'}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((unit) => {
                                    const pos = unit.getPosition();
                                    const status = unit.getStatus();
                                    const imgSrc = unit.getImgSrc();

                                    return (
                                        <TableRow key={unit.getId()} hover>
                                            {/* Symbol */}
                                            <TableCell>
                                                {imgSrc ? (
                                                    <Tooltip title={unit.getName()}>
                                                        <Avatar
                                                            src={imgSrc}
                                                            variant="square"
                                                            sx={{ width: 32, height: 32 }}
                                                        />
                                                    </Tooltip>
                                                ) : (
                                                    <Avatar variant="square" sx={{ width: 32, height: 32, fontSize: 12 }}>
                                                        {unit.getName().charAt(0).toUpperCase()}
                                                    </Avatar>
                                                )}
                                            </TableCell>

                                            {/* Name */}
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={500}>
                                                    {unit.getName()}
                                                </Typography>
                                            </TableCell>

                                            {/* Status */}
                                            <TableCell>
                                                {status != null ? (
                                                    <Chip
                                                        label={`${status} – ${STATUS_LABELS[status] ?? 'Unknown'}`}
                                                        size="small"
                                                        color={STATUS_COLORS[status] ?? 'default'}
                                                    />
                                                ) : (
                                                    <Typography variant="body2" color="text.disabled">—</Typography>
                                                )}
                                            </TableCell>

                                            {/* Lat / Lng */}
                                            <TableCell>
                                                <Typography variant="body2" fontFamily="monospace">
                                                    {pos ? pos.getLatitude().toFixed(5) : '—'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontFamily="monospace">
                                                    {pos ? pos.getLongitude().toFixed(5) : '—'}
                                                </Typography>
                                            </TableCell>

                                            {/* Timestamp */}
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary">
                                                    {pos
                                                        ? pos.getTimestamp().toLocaleString()
                                                        : '—'}
                                                </Typography>
                                            </TableCell>

                                            {/* Actions */}
                                            <TableCell align="center">
                                                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                                    <Tooltip title={pos ? 'Show on map' : 'No position available'}>
                                                        <span>
                                                            <IconButton
                                                                size="small"
                                                                disabled={!pos}
                                                                onClick={() => {
                                                                    if (!pos) return;
                                                                    const params = new URLSearchParams({
                                                                        unitId: unit.getId() || ''
                                                                    });
                                                                    void navigate(`/map?${params.toString()}`);
                                                                }}
                                                            >
                                                                <MapIcon fontSize="small" />
                                                            </IconButton>
                                                        </span>
                                                    </Tooltip>
                                                    <Tooltip title="Edit">
                                                        <IconButton size="small" onClick={(e) => openEditDialog(unit, e)}>
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Container>

            {/* ── Edit unit dialog ── */}
            <Dialog open={editingUnit !== null} onClose={closeEditDialog} fullWidth maxWidth="xs">
                <DialogTitle>Edit Unit</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
                    <TextField
                        label="Name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        fullWidth
                        size="small"
                    />
                    <FormControl fullWidth size="small">
                        <InputLabel>Status</InputLabel>
                        <Select
                            label="Status"
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                        >
                            <MenuItem value=""><em>None</em></MenuItem>
                            {Object.entries(STATUS_LABELS).map(([key, label]) => (
                                <MenuItem key={key} value={key}>{key} – {label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeEditDialog} disabled={editSaving}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={saveEditDialog}
                        disabled={editSaving || !editName.trim()}
                        startIcon={editSaving ? <CircularProgress size={16} color="inherit" /> : undefined}
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default UnitsPage;
