import { type JSX, useEffect, useState } from 'react';
import {
    Box,
    Button,
    Chip,
    Container,
    IconButton,
    List,
    ListItem,
    ListItemText,
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

interface CacheRequestEntry {
    url: string;
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

async function loadCacheRequests(name: string): Promise<CacheRequestEntry[]> {
    const cache = await caches.open(name);
    const keys = await cache.keys();

    return keys
        .map((request) => ({ url: request.url }))
        .sort((left, right) => left.url.localeCompare(right.url));
}

export function CachePage(): JSX.Element {
    const [entries, setEntries] = useState<CacheEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCacheName, setSelectedCacheName] = useState<string | null>(null);
    const [selectedCacheEntries, setSelectedCacheEntries] = useState<CacheRequestEntry[]>([]);
    const [selectedCacheLoading, setSelectedCacheLoading] = useState(false);

    const refresh = () => {
        setLoading(true);
        void loadCaches().then((data) => {
            setEntries(data);

            if (selectedCacheName != null && !data.some((entry) => entry.name === selectedCacheName)) {
                setSelectedCacheName(null);
                setSelectedCacheEntries([]);
                setSelectedCacheLoading(false);
            }

            setLoading(false);
        });
    };

    useEffect(() => {
        refresh();
    }, []);

    useEffect(() => {
        if (selectedCacheName == null) {
            setSelectedCacheEntries([]);
            setSelectedCacheLoading(false);
            return;
        }

        let ignore = false;
        setSelectedCacheLoading(true);

        void loadCacheRequests(selectedCacheName).then((requests) => {
            if (ignore) {
                return;
            }

            setSelectedCacheEntries(requests);
            setSelectedCacheLoading(false);
        });

        return () => {
            ignore = true;
        };
    }, [selectedCacheName]);

    const handleDelete = async (name: string) => {
        await caches.delete(name);
        refresh();
    };

    const handleDeleteAll = async () => {
        const names = await caches.keys();
        await Promise.all(names.map((name) => caches.delete(name)));
        refresh();
    };

    const totalTiles = entries.reduce((sum, entry) => sum + entry.count, 0);

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
                <Typography color="text.secondary">Loading...</Typography>
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
                                <TableRow
                                    key={entry.name}
                                    hover
                                    selected={selectedCacheName === entry.name}
                                    onClick={() => setSelectedCacheName(entry.name)}
                                    sx={{ cursor: 'pointer' }}
                                >
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
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                void handleDelete(entry.name);
                                            }}
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

            {selectedCacheName != null ? (
                <Paper sx={{ mt: 3, p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                        <Typography variant="h6" sx={{ flexGrow: 1 }}>
                            Cache Entries
                        </Typography>
                        <Chip label={selectedCacheName} size="small" />
                        <Chip label={`${selectedCacheEntries.length} requests`} size="small" />
                    </Box>

                    {selectedCacheLoading ? (
                        <Typography color="text.secondary">Loading cache entries...</Typography>
                    ) : selectedCacheEntries.length === 0 ? (
                        <Typography color="text.secondary">This cache has no entries.</Typography>
                    ) : (
                        <List dense sx={{ maxHeight: 420, overflow: 'auto', bgcolor: 'background.default' }}>
                            {selectedCacheEntries.map((requestEntry) => (
                                <ListItem key={requestEntry.url} divider>
                                    <ListItemText
                                        primary={requestEntry.url}
                                        primaryTypographyProps={{
                                            variant: 'body2',
                                            sx: {
                                                fontFamily: 'monospace',
                                                wordBreak: 'break-all',
                                            },
                                        }}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    )}
                </Paper>
            ) : null}
        </Container>
    );
}
