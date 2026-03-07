import { useEffect, useState, useCallback, type JSX } from 'react';
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    ImageList,
    ImageListItem,
    ImageListItemBar,
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
    const [uploading, setUploading] = useState<boolean>(false);
    const [selected, setSelected] = useState<Photo | null>(null);

    // ── Edit dialog state ──────────────────────────────────────────────────
    const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
    const [editName, setEditName] = useState('');
    const [editLatitude, setEditLatitude] = useState('');
    const [editLongitude, setEditLongitude] = useState('');
    const [editSaving, setEditSaving] = useState(false);
    const [geolocating, setGeolocating] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

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
        });
        setEditSaving(true);
        ApiProvider.getInstance()
            .updatePhoto(updated)
            .then((saved) => {
                setPhotos((prev) => prev.map((p) => p.id === saved.id ? saved : p));
                closeEditDialog();
            })
            .catch((e) => console.error('Failed to save photo:', e))
            .finally(() => setEditSaving(false));
    };

    const cols = isXs ? 2 : isSm ? 3 : 4;

    const loadPhotos = useCallback(() => {
        setLoading(true);
        ApiProvider.getInstance()
            .loadAllPictures()
            .then((pictures) => {
                setPhotos(Object.values(pictures));
            })
            .catch((e) => console.error('Failed to load photos:', e))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        loadPhotos();
    }, [loadPhotos]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;
        setUploading(true);
        Promise.all(
            Array.from(files).map((file) => ApiProvider.getInstance().createPhoto(file))
        )
            .then(() => loadPhotos())
            .catch((e) => console.error('Upload failed:', e))
            .finally(() => {
                setUploading(false);
                // Reset input so the same file can be re-uploaded
                event.target.value = '';
            });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* --- toolbar --- */}
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                <Typography variant="h5" sx={{ flexGrow: 1 }}>
                    Photos
                </Typography>
                <Button onClick={loadPhotos}>Refresh</Button>
                <Button
                    component="label"
                    variant="contained"
                    startIcon={uploading ? <CircularProgress size={18} color="inherit" /> : <CloudUploadIcon />}
                    disabled={uploading}
                >
                    {uploading ? 'Uploading…' : 'Upload'}
                    <VisuallyHiddenInput type="file" accept="image/*" onChange={handleFileChange} multiple />
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
                        {photos.map((photo) => (
                            <ImageListItem
                                key={photo.id ?? photo.name}
                                sx={{ cursor: 'pointer', borderRadius: 1, overflow: 'hidden' }}
                                onClick={() => setSelected(photo)}
                            >
                                <img
                                    src={photo.id ? ApiProvider.getInstance().getPhotoImageSrc(photo.id) : ''}
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
                                src={ApiProvider.getInstance().getPhotoImageSrc(selected.id!)}
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
