import { type JSX, useContext, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Avatar,
    Box,
    Checkbox,
    Chip,
    Container,
    FormControl,
    IconButton,
    InputAdornment,
    InputLabel,
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
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MapIcon from '@mui/icons-material/Map';
import EditIcon from '@mui/icons-material/Edit';
import { DataProvider } from '../dataProviders/DataProvider.ts';
import { Unit } from '../enitities/Unit.ts';
import { ApiProvider } from '../dataProviders/ApiProvider.ts';
import { UnitsContext } from '../contexts/UnitsContext.tsx';
import { STATUS_COLORS, STATUS_LABELS } from '../gDefs.ts';
import { UnitStatusDialog } from '../components/dialogs/UnitStatusDialog.tsx';
import { UnitEditDialog } from '../components/dialogs/UnitEditDialog.tsx';

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

type SortField = 'name' | 'status' | 'group' | 'latitude' | 'longitude' | 'timestamp';
type SortOrder = 'asc' | 'desc';
const STATUS_FILTER_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

// ---------------------------------------------------------------------------

export function UnitsPage(): JSX.Element {
    const dp = DataProvider.getInstance();

    const units = useContext(UnitsContext);

    const [nameFilter, setNameFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<number[]>([...STATUS_FILTER_OPTIONS]);
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

    // ── Edit dialog state ──────────────────────────────────────────────────
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
    const [editStatusUnit, setEditStatusUnit] = useState<Unit | null>(null);

    const openEditDialog = (unit: Unit) => {
        setEditingUnit(unit);
    };

    const updateUnitStatus = (status: number) => {
        if (!editStatusUnit) return;
        const edited = editStatusUnit;
        edited.setStatus(status);
        console.log('Saving unit with new status:', status);
        ApiProvider.getInstance()
            .saveUnit(edited)
            .then((saved) => {
                dp.addUnit(saved);
                setEditStatusUnit(null);
            })
            .catch((e) => console.error('Failed to save unit:', e));
    }


    const saveEditDialog = (updated: Unit) => {
        if (!editingUnit) return;
        ApiProvider.getInstance()
            .saveUnit(updated)
            .then((saved) => {
                dp.addUnit(saved);
                setEditingUnit(null);
            })
            .catch((e) => console.error('Failed to save unit:', e));
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
            <Container maxWidth="lg">
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
                                const values = selected;
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
                                filtered.map((unit) => <UnitTableRow key={unit.getId()} unit={unit} setEditStatusUnit={setEditStatusUnit} openEditDialog={openEditDialog} />)
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Container>

            {/* ── Edit unit dialog ── */}
            <UnitEditDialog open={editingUnit != null} unit={editingUnit} onClose={() => setEditingUnit(null)} onSave={saveEditDialog} />
            <UnitStatusDialog open={editStatusUnit != null} unit={editStatusUnit} onClose={() => { setEditStatusUnit(null) }} onSave={updateUnitStatus} />
        </Box>
    );
}



interface UnitTableRowProps {
    unit: Unit;
    setEditStatusUnit: (unit: Unit) => void;
    openEditDialog: (unit: Unit) => void;
}

function UnitTableRow({ unit, setEditStatusUnit, openEditDialog }: UnitTableRowProps) {
    const navigate = useNavigate();
    const pos = unit.getPosition();
    const status = unit.getStatus();
    const imgSrc = unit.getImgSrc();

    return (<TableRow key={unit.getId()} hover>
        {/* Symbol */}
        <TableCell>
            {imgSrc ? (
                <Avatar
                    src={imgSrc}
                    variant="square"
                    sx={{ width: 40, height: 28 }}
                />
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
        <TableCell onClick={() => { setEditStatusUnit(unit) }}>
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
                {unit.getPermissions().includes('EDIT') && (
                    <Tooltip title="Edit">
                        <IconButton size="small"
                            onClick={() => openEditDialog(unit)}>
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>
        </TableCell>
    </TableRow>);
}
export default UnitsPage;
