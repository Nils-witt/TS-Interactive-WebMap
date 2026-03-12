import { type JSX, useEffect, useState } from 'react';
import {
    Box,
    Button,
    Chip,
    Container,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';

interface CacheEntry {
    name: string;
    count: number;
}

async function loadCaches(): Promise<CacheEntry[]> {
    const names = await caches.keys();
    return Promise.all(
        names.map(async (name) => {
            const cache = await caches.open(name);
            const keys = await cache.keys();
            return { name, count: keys.length };
        }),
    );
}

export function CachePage(): JSX.Element {
    const [entries, setEntries] = useState<CacheEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const refresh = () => {
        setLoading(true);
        void loadCaches().then((data) => {
            setEntries(data);
            setLoading(false);
        });
    };

    useEffect(() => {
        refresh();
    }, []);

    const handleDelete = async (name: string) => {
        await caches.delete(name);
        refresh();
    };

    const handleDeleteAll = async () => {
        const names = await caches.keys();
        await Promise.all(names.map((n) => caches.delete(n)));
        refresh();
    };

    const totalTiles = entries.reduce((sum, e) => sum + e.count, 0);

    return (
        <Container maxWidth="lg" sx={{ py: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                <Typography variant="h5" sx={{ flexGrow: 1 }}>
                    Local Caches
                </Typography>
                <Chip label={`${totalTiles} total entries`} size="small" />
                <IconButton onClick={refresh} title="Refresh" size="small">
                    <RefreshIcon />
                </IconButton>
                <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<DeleteIcon />}
                    onClick={() => void handleDeleteAll()}
                    disabled={entries.length === 0}
                >
                    Clear All
                </Button>
            </Box>

            {loading ? (
                <Typography color="text.secondary">Loading…</Typography>
            ) : entries.length === 0 ? (
                <Typography color="text.secondary">No caches found.</Typography>
            ) : (
                <TableContainer component={Paper}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Cache Name</TableCell>
                                <TableCell align="right">Entries</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {entries.map((entry) => (
                                <TableRow key={entry.name} hover>
                                    <TableCell>
                                        <Typography
                                            variant="body2"
                                            sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}
                                        >
                                            {entry.name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">{entry.count}</TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            size="small"
                                            color="error"
                                            title="Delete cache"
                                            onClick={() => void handleDelete(entry.name)}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Container>
    );
}
