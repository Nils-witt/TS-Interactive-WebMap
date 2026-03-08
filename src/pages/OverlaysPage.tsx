import { type JSX, useEffect, useMemo, useRef, useState } from 'react';
import * as React from 'react';
import {
    Box,
    Button,
    ButtonGroup,
    Chip,
    Input,
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
import { DataProvider, DataProviderEventType } from '../dataProviders/DataProvider.ts';
import { GlobalEventHandler } from '../dataProviders/GlobalEventHandler.ts';
import { type MapOverlay } from '../enitities/MapOverlay.ts';
import CacheProvider from '../dataProviders/CacheProvider.ts';

type SortField = 'name' | 'url' | 'opacity' | 'order';
type SortOrder = 'asc' | 'desc';

function OverlayTableRow({ overlay }: { overlay: MapOverlay }): JSX.Element {
    const btnRef = useRef<HTMLButtonElement | null>(null);
    const [order, setOrder] = React.useState<number>(overlay.getOrder());

    const downloadLayer = async () => {
        if (btnRef.current) {
            btnRef.current.disabled = true;
            btnRef.current.innerText = 'Downloading…';
            await CacheProvider.getInstance().cacheOverlay(overlay, btnRef.current);
        } else {
            await CacheProvider.getInstance().cacheOverlay(overlay);
        }
    };

    useEffect(() => {
        void CacheProvider.getInstance().getOverlayCacheState(overlay).then((res) => {
            if (btnRef.current) {
                if (res.missing.length === 0) {
                    btnRef.current.disabled = true;
                    btnRef.current.innerText = 'Downloaded';
                } else {
                    btnRef.current.disabled = false;
                    btnRef.current.innerText = `Download (${res.missing.length} / ${res.remoteTiles.length} tiles)`;
                }
            }
        });
    }, []);

    useEffect(() => {
        if (order !== overlay.getOrder()) {
            overlay.setOrder(order);
        }
    }, [order]);


    const clearCacheOverlay = async (overlay: MapOverlay) => {
        await CacheProvider.getInstance().clearOverlayCache(overlay);
    };


    return (
        <TableRow key={overlay.getId()} hover>
            <TableCell>{overlay.getName()} ({overlay.getLayerVersion()})</TableCell>
            <TableCell
                sx={{
                    maxWidth: 280,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}
            >
                <Typography
                    variant="body2"
                    title={overlay.getUrl()}
                    sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                >
                    {overlay.getUrl()}
                </Typography>
            </TableCell>
            <TableCell align="right">{(overlay.getOpacity() * 100).toFixed(0)} %</TableCell>
            <TableCell align="right">
                <Input
                    type="number"
                    defaultValue={order}
                    onChange={(e) => setOrder(parseInt(e.target.value))}
                    sx={{ width: 64 }}
                />
            </TableCell>
            <TableCell align="center">
                <ButtonGroup size="small">
                    <Button ref={btnRef} onClick={() => void downloadLayer()}>Download</Button>
                    <Button onClick={() => void clearCacheOverlay(overlay)}>Delete Offline Cache</Button>
                </ButtonGroup>
            </TableCell>
        </TableRow>
    );
}

export function OverlaysPage(): JSX.Element {
    const dp = DataProvider.getInstance();
    const [overlays, setOverlays] = useState<MapOverlay[]>(() =>
        Array.from(dp.getOverlays().values())
    );
    const [nameFilter, setNameFilter] = useState('');
    const [sortField, setSortField] = useState<SortField>('order');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

    useEffect(() => {
        const refresh = () => setOverlays(Array.from(DataProvider.getInstance().getOverlays().values()));
        const events = [
            DataProviderEventType.OVERLAY_ADDED,
            DataProviderEventType.OVERLAY_UPDATED,
            DataProviderEventType.OVERLAY_DELETED,
        ] as const;
        events.forEach((e) => GlobalEventHandler.getInstance().on(e, refresh));
        return () => events.forEach((e) => GlobalEventHandler.getInstance().off(e, refresh));
    }, []);

    const filtered = useMemo(() => {
        let result = overlays;

        if (nameFilter.trim()) {
            const lower = nameFilter.toLowerCase();
            result = result.filter((o) => o.getName().toLowerCase().includes(lower));
        }

        result = [...result].sort((a, b) => {
            let aVal: string | number;
            let bVal: string | number;

            if (sortField === 'name') {
                aVal = a.getName().toLowerCase();
                bVal = b.getName().toLowerCase();
            } else if (sortField === 'url') {
                aVal = a.getUrl().toLowerCase();
                bVal = b.getUrl().toLowerCase();
            } else if (sortField === 'opacity') {
                aVal = a.getOpacity();
                bVal = b.getOpacity();
            } else {
                aVal = a.getOrder();
                bVal = b.getOrder();
            }

            if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [overlays, nameFilter, sortField, sortOrder]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2, gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" sx={{ flexGrow: 1 }}>Overlays</Typography>
                <Chip label={`${filtered.length} / ${overlays.length}`} size="small" variant="outlined" />
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
                            <TableCell sortDirection={sortField === 'url' ? sortOrder : false}>
                                <TableSortLabel
                                    active={sortField === 'url'}
                                    direction={sortField === 'url' ? sortOrder : 'asc'}
                                    onClick={() => handleSort('url')}
                                >
                                    URL
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sortDirection={sortField === 'opacity' ? sortOrder : false} align="right">
                                <TableSortLabel
                                    active={sortField === 'opacity'}
                                    direction={sortField === 'opacity' ? sortOrder : 'asc'}
                                    onClick={() => handleSort('opacity')}
                                >
                                    Opacity
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sortDirection={sortField === 'order' ? sortOrder : false} align="right">
                                <TableSortLabel
                                    active={sortField === 'order'}
                                    direction={sortField === 'order' ? sortOrder : 'asc'}
                                    onClick={() => handleSort('order')}
                                >
                                    Order
                                </TableSortLabel>
                            </TableCell>
                            <TableCell align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ color: 'text.secondary', py: 4 }}>
                                    No overlays match the current filter.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((overlay) => (
                                <OverlayTableRow key={overlay.getId()} overlay={overlay} />
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
