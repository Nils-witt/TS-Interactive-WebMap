import { type JSX, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Avatar,
    Box,
    Chip,
    Container,
    InputAdornment,
    IconButton,
    Paper,
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
import { DataProvider, DataProviderEventType } from '../dataProviders/DataProvider.ts';
import { GlobalEventHandler } from '../dataProviders/GlobalEventHandler.ts';
import { type Unit } from '../enitities/Unit.ts';

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

// ---------------------------------------------------------------------------

export function UnitsPage(): JSX.Element {
    const dp = DataProvider.getInstance();
    const navigate = useNavigate();

    const [units, setUnits] = useState<Unit[]>(() => Array.from(dp.getUnits().values()));
    const [nameFilter, setNameFilter] = useState('');
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

    // Subscribe to live updates
    useEffect(() => {
        const refresh = () => setUnits(Array.from(dp.getUnits().values()));

        const events = [
            DataProviderEventType.UNIT_ADDED,
            DataProviderEventType.UNIT_UPDATED,
            DataProviderEventType.UNIT_DELETED,
        ];
        events.forEach((e) => GlobalEventHandler.getInstance().on(e, refresh));
        return () => events.forEach((e) => GlobalEventHandler.getInstance().off(e, refresh));
    }, []);

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
    }, [units, nameFilter, sortField, sortOrder]);

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
                </Box>

                {/* Table */}
                <TableContainer component={Paper}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ width: 48 }}>Symbol</TableCell>
                                {col('name', 'Name')}
                                {col('status', 'Status')}
                                {col('group', 'Group')}
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

                                            {/* Group */}
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary">
                                                    {unit.getGroupId() ?? '—'}
                                                </Typography>
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

                                            {/* Show on map */}
                                            <TableCell align="center">
                                                <Tooltip title={pos ? 'Show on map' : 'No position available'}>
                                                    <span>
                                                        <IconButton
                                                            size="small"
                                                            disabled={!pos}
                                                            onClick={() => {
                                                                if (!pos) return;
                                                                const params = new URLSearchParams({
                                                                    lat: pos.getLatitude().toString(),
                                                                    lng: pos.getLongitude().toString(),
                                                                    zoom: '16',
                                                                });
                                                                void navigate(`/map?${params.toString()}`);
                                                            }}
                                                        >
                                                            <MapIcon fontSize="small" />
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Container>
        </Box>
    );
}

export default UnitsPage;
