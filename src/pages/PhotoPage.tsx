import { useEffect, useState, type JSX } from 'react';
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    IconButton,
    ImageList,
    ImageListItem,
    ImageListItemBar,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Tooltip,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import PlaceIcon from '@mui/icons-material/Place';
import { styled } from '@mui/material/styles';
import { ApiProvider } from '../dataProviders/ApiProvider';
import { Photo } from '../enitities/Photo';
import type { MissionGroup } from '../enitities/MissionGroup';
import { DataProvider, DataProviderEventType } from '../dataProviders/DataProvider';
import { GlobalEventHandler } from '../dataProviders/GlobalEventHandler';

const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
});

export function PhotoPage(): JSX.Element {
    const theme = useTheme();
    const isXs = useMediaQuery(theme.breakpoints.down('sm'));
    const isSm = useMediaQuery(theme.breakpoints.down('md'));

    const [photos, setPhotos] = useState<Photo[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [selected, setSelected] = useState<Photo | null>(null);

    const [missionGroups, setMissionGroups] = useState<MissionGroup[]>([]);
    const [missionGroupFilter, setMissionGroupFilter] = useState<string>('');

    // ── Edit dialog state ──────────────────────────────────────────────────
    const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
    const [editName, setEditName] = useState('');
    const [editLatitude, setEditLatitude] = useState('');
    const [editLongitude, setEditLongitude] = useState('');
    const [editSaving, setEditSaving] = useState(false);
    const [geolocating, setGeolocating] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    // ── Create dialog state ────────────────────────────────────────────────
    const [createOpen, setCreateOpen] = useState(false);
    const [createFile, setCreateFile] = useState<File | null>(null);
    const [createName, setCreateName] = useState('');
    const [createLatitude, setCreateLatitude] = useState('');
    const [createLongitude, setCreateLongitude] = useState('');
    const [createGeolocating, setCreateGeolocating] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createPreview, setCreatePreview] = useState<string | null>(null);

    const openCreateDialog = () => {
        setCreateFile(null);
        setCreateName('');
        setCreateLatitude('');
        setCreateLongitude('');
        setCreatePreview(null);
        setCreateOpen(true);
    };

    const closeCreateDialog = () => {
        setCreateOpen(false);
        if (createPreview) URL.revokeObjectURL(createPreview);
        setCreatePreview(null);
    };

    const handleCreateFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setCreateFile(file);
        if (file) {
            setCreateName(file.name.replace(/\.[^.]+$/, ''));
            if (createPreview) URL.revokeObjectURL(createPreview);
            setCreatePreview(URL.createObjectURL(file));
        }
    };

    const useCurrentLocationCreate = () => {
        if (!window.navigator.geolocation) return;
        setCreateGeolocating(true);
        window.navigator.geolocation.getCurrentPosition(
            (pos: GeolocationPosition) => {
                setCreateLatitude(String(pos.coords.latitude));
                setCreateLongitude(String(pos.coords.longitude));
                setCreateGeolocating(false);
            },
            (err: GeolocationPositionError) => {
                console.error('Geolocation error:', err);
                setCreateGeolocating(false);
            },
            { enableHighAccuracy: true }
        );
    };

    const submitCreateDialog = () => {
        if (!createFile) return;
        setCreating(true);
        ApiProvider.getInstance()
            .savePhotoImage(createFile, createLatitude || createLongitude ? { latitude: parseFloat(createLatitude), longitude: parseFloat(createLongitude), accuracy: 0, timestamp: new Date().toISOString() } : null, createName.trim(), missionGroupFilter)
            .then((photo) => {
                setPhotos((prev) => [photo, ...prev]);
                closeCreateDialog();
            })
            .catch((e) => console.error('Failed to create photo:', e))
            .finally(() => setCreating(false));
    };

    const useCurrentLocation = () => {
        if (!window.navigator.geolocation) return;
        setGeolocating(true);
        window.navigator.geolocation.getCurrentPosition(
            (pos: GeolocationPosition) => {
                setEditLatitude(String(pos.coords.latitude));
                setEditLongitude(String(pos.coords.longitude));
                setGeolocating(false);
            },
            (err: GeolocationPositionError) => {
                console.error('Geolocation error:', err);
                setGeolocating(false);
            },
            { enableHighAccuracy: true }
        );
    };

    const openEditDialog = (photo: Photo, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingPhoto(photo);
        setEditName(photo.name);
        setEditLatitude(photo.position ? String(photo.position.getLatitude()) : '');
        setEditLongitude(photo.position ? String(photo.position.getLongitude()) : '');
    };

    const closeEditDialog = () => setEditingPhoto(null);

    const deleteEditDialog = () => {
        if (!editingPhoto || !editingPhoto.id) return;
        setConfirmDelete(true);
    };

    const confirmDeletePhoto = () => {
        if (!editingPhoto || !editingPhoto.id) return;
        ApiProvider.getInstance().deletePhoto(editingPhoto.id)
            .then(() => {
                setPhotos((prev) => prev.filter((p) => p.id !== editingPhoto.id));
                setConfirmDelete(false);
                closeEditDialog();
            })
            .catch((e) => console.error('Failed to delete photo:', e));
    };

    const saveEditDialog = () => {
        if (!editingPhoto) return;
        const lat = parseFloat(editLatitude);
        const lng = parseFloat(editLongitude);
        const updated = new Photo({
            id: editingPhoto.id ?? undefined,
            name: editName.trim(),
            position: (!isNaN(lat) && !isNaN(lng) && editLatitude !== '' && editLongitude !== '')
                ? {
                    latitude: lat,
                    longitude: lng,
                    accuracy: editingPhoto.position?.getAccuracy() ?? 0,
                    timestamp: editingPhoto.position?.getTimestamp().toISOString() ?? new Date().toISOString(),
                }
                : undefined,
            authorId: editingPhoto.authorId,
            missionGroupId: editingPhoto.missionGroupId,
        });
        setEditSaving(true);
        ApiProvider.getInstance()
            .savePhoto(updated)
            .then((saved) => {
                setPhotos((prev) => prev.map((p) => p.id === saved.id ? saved : p));
                closeEditDialog();
            })
            .catch((e) => console.error('Failed to save photo:', e))
            .finally(() => setEditSaving(false));
    };

    const cols = isXs ? 2 : isSm ? 3 : 4;

    const dp = DataProvider.getInstance();

    const refresh = () => {
        const pMissionGroups = Array.from(dp.getAllMissionGroups().values());
        setPhotos(Array.from(dp.getAllPhotos().values()));
        setMissionGroups(pMissionGroups);
        setLoading(false);
        console.log('PhotoPage refreshed, ', missionGroupFilter, pMissionGroups);
        if (missionGroupFilter.trim() == '' && pMissionGroups.length > 0) {
            setMissionGroupFilter(pMissionGroups[0].getId());
        }
    };

    useEffect(() => {
        const events = [
            DataProviderEventType.PHOTO_UPDATED,
            DataProviderEventType.PHOTO_DELETED,
            DataProviderEventType.PHOTO_CREATED,
            DataProviderEventType.MISSION_GROUPS_CREATED,
            DataProviderEventType.MISSION_GROUPS_UPDATED,
            DataProviderEventType.MISSION_GROUPS_DELETED,
        ];
        refresh();
        events.forEach((event) => GlobalEventHandler.getInstance().on(event, refresh));
        return () => events.forEach((event) => GlobalEventHandler.getInstance().off(event, refresh));
    }, []);


    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* --- toolbar --- */}
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                <Typography variant="h5" sx={{ flexGrow: 1 }}>
                    Photos
                </Typography>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Filter by Mission Group</InputLabel>
                    <Select
                        value={missionGroupFilter}
                        label="Filter by Group"
                        onChange={(e) => setMissionGroupFilter(e.target.value)}
                    >
                        {missionGroups.map((g) => (
                            <MenuItem key={g.getId()} value={g.getId()}>
                                {g.getName()}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Button onClick={refresh}>Refresh</Button>
                <Button variant="contained" onClick={openCreateDialog}>
                    Create
                </Button>
            </Box>

            {/* --- gallery --- */}
            <Box sx={{ flex: 1, overflowY: 'auto', px: 2, pb: 2 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}>
                        <CircularProgress />
                    </Box>
                ) : photos.length === 0 ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}>
                        <Typography color="text.secondary">No photos yet. Upload the first one!</Typography>
                    </Box>
                ) : (
                    <ImageList variant="masonry" cols={cols} gap={8}>
                        {photos.filter((photo) => photo.missionGroupId === missionGroupFilter).map((photo) => (
                            <ImageListItem
                                key={photo.id ?? photo.name}
                                sx={{ cursor: 'pointer', borderRadius: 1, overflow: 'hidden' }}
                                onClick={() => setSelected(photo)}
                            >
                                <img
                                    src={photo.getImageSrc()}
                                    alt={photo.name}
                                    loading="lazy"
                                    style={{ display: 'block', width: '100%' }}
                                />
                                <ImageListItemBar
                                    title={photo.name}
                                    subtitle={
                                        photo.position
                                            ? `${photo.position.getLatitude().toFixed(5)}, ${photo.position.getLongitude().toFixed(5)}`
                                            : undefined
                                    }
                                    actionIcon={
                                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5 }}>
                                            {photo.position && (
                                                <Tooltip title="Has location">
                                                    <PlaceIcon sx={{ color: 'rgba(255,255,255,0.7)' }} fontSize="small" />
                                                </Tooltip>
                                            )}
                                            <Tooltip title="Edit">
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => openEditDialog(photo, e)}
                                                    sx={{ color: 'rgba(255,255,255,0.7)' }}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    }
                                    actionPosition="right"
                                />
                            </ImageListItem>
                        ))}
                    </ImageList>
                )}
            </Box>

            {/* --- create dialog --- */}
            <Dialog open={createOpen} onClose={closeCreateDialog} fullWidth maxWidth="xs">
                <DialogTitle>Create Photo</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
                    <Button
                        component="label"
                        variant="outlined"
                        startIcon={<CloudUploadIcon />}
                        fullWidth
                    >
                        {createFile ? createFile.name : 'Select image…'}
                        <VisuallyHiddenInput type="file" accept="image/*" onChange={handleCreateFileChange} />
                    </Button>
                    {createPreview && (
                        <Box
                            component="img"
                            src={createPreview}
                            alt="preview"
                            sx={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}
                        />
                    )}
                    <TextField
                        label="Name"
                        value={createName}
                        onChange={(e) => setCreateName(e.target.value)}
                        fullWidth
                        size="small"
                    />
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                            <TextField
                                label="Latitude"
                                type="number"
                                value={createLatitude}
                                onChange={(e) => setCreateLatitude(e.target.value)}
                                fullWidth
                                size="small"
                                slotProps={{ htmlInput: { step: 'any' } }}
                                helperText="Optional"
                            />
                            <TextField
                                label="Longitude"
                                type="number"
                                value={createLongitude}
                                onChange={(e) => setCreateLongitude(e.target.value)}
                                fullWidth
                                size="small"
                                slotProps={{ htmlInput: { step: 'any' } }}
                            />
                        </Box>
                        <Tooltip title="Use current location">
                            <span>
                                <IconButton
                                    onClick={useCurrentLocationCreate}
                                    disabled={createGeolocating || !window.navigator.geolocation}
                                    sx={{ mt: 0.5 }}
                                >
                                    {createGeolocating
                                        ? <CircularProgress size={20} />
                                        : <GpsFixedIcon />}
                                </IconButton>
                            </span>
                        </Tooltip>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeCreateDialog} disabled={creating}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={submitCreateDialog}
                        disabled={creating || !createFile}
                        startIcon={creating ? <CircularProgress size={16} color="inherit" /> : undefined}
                    >
                        Create
                    </Button>
                </DialogActions>
            </Dialog>

            {/* --- confirm delete dialog --- */}
            <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
                <DialogTitle>Delete Photo</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete <strong>{editingPhoto?.name}</strong>? This cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDelete(false)}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={confirmDeletePhoto}>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* --- edit dialog --- */}
            <Dialog open={editingPhoto !== null} onClose={closeEditDialog} fullWidth maxWidth="xs">
                <DialogTitle>Edit Photo</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
                    <TextField
                        label="Name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        fullWidth
                        size="small"
                    />
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                            <TextField
                                label="Latitude"
                                type="number"
                                value={editLatitude}
                                onChange={(e) => setEditLatitude(e.target.value)}
                                fullWidth
                                size="small"
                                slotProps={{ htmlInput: { step: 'any' } }}
                                helperText="Leave blank to remove location"
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
                        <Tooltip title="Use current location">
                            <span>
                                <IconButton
                                    onClick={useCurrentLocation}
                                    disabled={geolocating || !window.navigator.geolocation}
                                    sx={{ mt: 0.5 }}
                                >
                                    {geolocating
                                        ? <CircularProgress size={20} />
                                        : <GpsFixedIcon />}
                                </IconButton>
                            </span>
                        </Tooltip>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={deleteEditDialog} color="error" disabled={editSaving}>
                        Delete
                    </Button>
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

            {/* --- lightbox --- */}
            <Dialog
                open={Boolean(selected)}
                onClose={() => setSelected(null)}
                maxWidth="lg"
                fullWidth
            >
                {selected && (
                    <>
                        <DialogTitle sx={{ display: 'flex', alignItems: 'center', pr: 6 }}>
                            {selected.name}
                            {selected.position && (
                                <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                                    {selected.position.getLatitude().toFixed(6)},{' '}
                                    {selected.position.getLongitude().toFixed(6)}
                                    {selected.position.getAccuracy()
                                        ? ` ±${selected.position.getAccuracy()}m`
                                        : ''}
                                </Typography>
                            )}
                            <IconButton
                                onClick={() => setSelected(null)}
                                sx={{ position: 'absolute', right: 8, top: 8 }}
                            >
                                <CloseIcon />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent sx={{ p: 0, textAlign: 'center', backgroundColor: '#000' }}>
                            <img
                                src={selected.getImageSrc()}
                                alt={selected.name}
                                style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
                            />
                        </DialogContent>
                    </>
                )}
            </Dialog>
        </Box>
    );
}
