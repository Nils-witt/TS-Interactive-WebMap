import { type JSX, useContext, useMemo, useState } from 'react';
import {
    Box,
    Button,
    Chip,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
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
    Tooltip,
    Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { MissionGroupContext } from '../contexts/MissionGroupContext';
import type { MissionGroup } from '../enitities/MissionGroup';
import { MissionGroupEditDialog } from '../components/dialogs/MissionGroupEditDialog';
import { DataProvider } from '../dataProviders/DataProvider';
import { DataBaseContext } from '../contexts/DataBaseContext';
import { AssignUnitsDialog } from '../components/dialogs/AssignUnitsDialog';
import { AssignMapGroupsDialog } from '../components/dialogs/AssignMapGroups';
import { useApi } from '../contexts/ApiContext';

type SortField = 'name' | 'startTime' | 'endTime' | 'units' | 'mapGroups';
type SortOrder = 'asc' | 'desc';

export function MissionGroupsPage(): JSX.Element {
    const dp = DataProvider.getInstance();
    const databaseProvider = useContext(DataBaseContext)
    const apiProvider = useApi();

    const missionGroups = useContext(MissionGroupContext);

    const [nameFilter, setNameFilter] = useState('');
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    const [assignedUnitsMissionGroup, setAssignedUnitsMissionGroup] = useState<MissionGroup | null>(null);
    const [assignedMapGroupsMissionGroup, setAssignedMapGroupsMissionGroup] = useState<MissionGroup | null>(null);

    const [editingMissionGroup, setEditingMissionGroup] = useState<MissionGroup | null>(null);
    const [deletingMissionGroup, setDeletingMissionGroup] = useState<MissionGroup | null>(null);

    const handleSort = (field: SortField) => {
        if (field === sortField) {
            setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const saveEditedMissionGroup = (updated: MissionGroup) => {

        apiProvider
            .saveMissionGroup(updated)
            .then((response) => {
                dp.addMissionGroup(response);
                setEditingMissionGroup(null);
            }).catch((error) => {
                console.error('Failed to save mission group', error);
            });
    };

    const confirmDeleteMissionGroup = () => {
        if (!deletingMissionGroup) return;

        apiProvider
            .deleteMissionGroup(deletingMissionGroup.getId())
            .then(() => {
                dp.removeMissionGroup(deletingMissionGroup.getId());
                void databaseProvider?.deleteMissionGroup(deletingMissionGroup.getId());
                setDeletingMissionGroup(null);
            })
            .catch((error) => {
                console.error('Failed to delete mission group', error);
            });
    };


    const saveAssignedUnits = (mapGroup: MissionGroup) => {
        if (!mapGroup) return;

        apiProvider
            .saveMissionGroup(mapGroup)
            .then((response) => {
                dp.addMissionGroup(response);
            })
            .catch((error) => {
                console.error('Failed to save assigned units', error);
            });
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
                    return a.getStartTime().getTime() - b.getStartTime().getTime() * sortDir;
                case 'endTime': {
                    const ea = a.getEndTime() ?? new Date(0);
                    const eb = b.getEndTime() ?? new Date(0);
                    return ea.getTime() - eb.getTime() * sortDir;
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

    const formatDate = (timestamp: number | null) => {
        if (!timestamp) return '—';
        try {
            return new Date(timestamp).toLocaleString();
        } catch {
            return timestamp;
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
                                <TableCell align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
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
                                        <TableCell>{formatDate(mg.getStartTime().getTime())}</TableCell>
                                        <TableCell>{formatDate(mg.getEndTime()?.getTime() || null)}</TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={mg.getUnitIds().length}
                                                size="small"
                                                clickable={mg.getPermissions().includes('EDIT')}
                                                onClick={mg.getPermissions().includes('EDIT') ? () => setAssignedUnitsMissionGroup(mg) : undefined}
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={mg.getMapGroupIds().length}
                                                size="small"
                                                clickable={mg.getPermissions().includes('EDIT')}
                                                onClick={mg.getPermissions().includes('EDIT') ? () => setAssignedMapGroupsMissionGroup(mg) : undefined} />
                                        </TableCell>
                                        <TableCell>
                                            {mg.getPermissions().includes('EDIT') && (
                                                <Tooltip title="Edit">
                                                    <IconButton size="small"
                                                        onClick={() => setEditingMissionGroup(mg)}>
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            {mg.getPermissions().includes('DELETE') && (
                                                <Tooltip title="Delete">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => setDeletingMissionGroup(mg)}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Container>

            <AssignUnitsDialog
                open={assignedUnitsMissionGroup != null}
                missionGroup={assignedUnitsMissionGroup}
                onClose={() => setAssignedUnitsMissionGroup(null)}
                onEdit={saveAssignedUnits}
            />

            <AssignMapGroupsDialog
                open={assignedMapGroupsMissionGroup != null}
                missionGroup={assignedMapGroupsMissionGroup}
                onClose={() => setAssignedMapGroupsMissionGroup(null)}
                onEdit={saveAssignedUnits}
            />

            <MissionGroupEditDialog
                open={editingMissionGroup != null}
                missionGroup={editingMissionGroup}
                onClose={() => setEditingMissionGroup(null)}
                onSave={saveEditedMissionGroup}
            />

            <Dialog
                open={deletingMissionGroup != null}
                onClose={() => setDeletingMissionGroup(null)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>Delete Mission Group</DialogTitle>
                <Divider />
                <DialogContent sx={{ pt: 2 }}>
                    <Typography>
                        Are you sure you want to delete
                        {' '}
                        <strong>{deletingMissionGroup?.getName() ?? ''}</strong>
                        ?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeletingMissionGroup(null)}>Cancel</Button>
                    <Button color="error" variant="contained" onClick={confirmDeleteMissionGroup}>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

