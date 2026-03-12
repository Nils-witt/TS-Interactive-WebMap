import { type JSX, useContext, useMemo, useState } from 'react';
import {
    Box,
    Chip,
    Container,
    InputAdornment,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    TextField,
    Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { MissionGroupContext } from '../contexts/MissionGroupContext';

type SortField = 'name' | 'startTime' | 'endTime' | 'units' | 'mapGroups';
type SortOrder = 'asc' | 'desc';

export function MissionGroupsPage(): JSX.Element {

    const missionGroups = useContext(MissionGroupContext);

    const [nameFilter, setNameFilter] = useState('');
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

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
        let result = missionGroups;

        if (nameFilter.trim()) {
            const lower = nameFilter.toLowerCase();
            result = result.filter((mg) => mg.getName().toLowerCase().includes(lower));
        }

        return [...result].sort((a, b) => {
            switch (sortField) {
                case 'name':
                    return a.getName().localeCompare(b.getName()) * sortDir;
                case 'startTime':
                    return a.getStartTime().localeCompare(b.getStartTime()) * sortDir;
                case 'endTime': {
                    const ea = a.getEndTime() ?? '';
                    const eb = b.getEndTime() ?? '';
                    return ea.localeCompare(eb) * sortDir;
                }
                case 'units':
                    return (a.getUnitIds().length - b.getUnitIds().length) * sortDir;
                case 'mapGroups':
                    return (a.getMapGroupIds().length - b.getMapGroupIds().length) * sortDir;
                default:
                    return 0;
            }
        });
    }, [missionGroups, nameFilter, sortField, sortOrder]);

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

    const formatDate = (iso: string | null) => {
        if (!iso) return '—';
        try {
            return new Date(iso).toLocaleString();
        } catch {
            return iso;
        }
    };

    return (
        <Box sx={{ overflowY: 'auto', height: '100%', py: 3 }}>
            <Container maxWidth="xl">
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2, flexWrap: 'wrap' }}>
                    <Typography variant="h4" sx={{ flexGrow: 1 }}>
                        Mission Groups
                    </Typography>
                    <Chip label={`${filtered.length} / ${missionGroups.length}`} variant="outlined" size="small" />
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
                                {col('name', 'Name')}
                                {col('startTime', 'Start Time')}
                                {col('endTime', 'End Time')}
                                {col('units', 'Units')}
                                {col('mapGroups', 'Map Groups')}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
                                        <Typography color="text.secondary" variant="body2" sx={{ py: 4 }}>
                                            {missionGroups.length === 0
                                                ? 'No mission groups received yet.'
                                                : 'No mission groups match the filter.'}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((mg) => (
                                    <TableRow key={mg.getId()} hover>
                                        <TableCell>{mg.getName()}</TableCell>
                                        <TableCell>{formatDate(mg.getStartTime())}</TableCell>
                                        <TableCell>{formatDate(mg.getEndTime())}</TableCell>
                                        <TableCell align="center">
                                            <Chip label={mg.getUnitIds().length} size="small" />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip label={mg.getMapGroupIds().length} size="small" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Container>
        </Box>
    );
}
