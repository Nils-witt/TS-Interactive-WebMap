import { useContext, useEffect, useState, type JSX } from 'react';
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
import { DataProvider } from '../dataProviders/DataProvider';
import { PhotoContext } from '../contexts/PhotoContext';
import { MissionGroupContext } from '../contexts/MissionGroupContext'

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

    const dp = DataProvider.getInstance();

    const photos = useContext(PhotoContext);
    const [selected, setSelected] = useState<Photo | null>(null);

    const missionGroups = useContext(MissionGroupContext);
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
                dp.addPhoto(photo);
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
        setEditName(photo.getName());
        setEditLatitude(photo.getPosition() ? String(photo.getPosition()!.getLatitude()) : '');
        setEditLongitude(photo.getPosition() ? String(photo.getPosition()!.getLongitude()) : '');
    };

    const closeEditDialog = () => setEditingPhoto(null);

    const deleteEditDialog = () => {
        if (!editingPhoto || !editingPhoto.getId()) return;
        setConfirmDelete(true);
    };

    const confirmDeletePhoto = () => {
        if (!editingPhoto || !editingPhoto.getId()) return;
        ApiProvider.getInstance().deletePhoto(editingPhoto.getId())
            .then(() => {
                dp.removePhoto(editingPhoto.getId());
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
            id: editingPhoto.getId(),
            createdAt: editingPhoto.getCreatedAt().getTime(),
            updatedAt: Date.now(),
            permissions: editingPhoto.getPermissions(),
            name: editName.trim(),
            position: (!isNaN(lat) && !isNaN(lng) && editLatitude !== '' && editLongitude !== '')
                ? {
                    latitude: lat,
                    longitude: lng,
                    accuracy: editingPhoto.getPosition()?.getAccuracy() ?? 0,
                    timestamp: editingPhoto.getPosition()?.getTimestamp().toISOString() ?? new Date().toISOString(),
                }
                : undefined,
            authorId: editingPhoto.getAuthorId(),
            missionGroupId: editingPhoto.getMissionGroupId(),
        });
        setEditSaving(true);
        ApiProvider.getInstance()
            .savePhoto(updated)
            .then((saved) => {
                dp.addPhoto(saved);
                closeEditDialog();
            })
            .catch((e) => console.error('Failed to save photo:', e))
            .finally(() => setEditSaving(false));
    };

    const cols = isXs ? 2 : isSm ? 3 : 4;

    useEffect(() => {
        if (missionGroupFilter.trim() == '') {
            if (missionGroups.length > 0) {
                setMissionGroupFilter(missionGroups[0].getId());
            }
        } else if (missionGroups.filter(mg => mg.getId() === missionGroupFilter).length === 0) {
            if (missionGroups.length > 0) {
                setMissionGroupFilter(missionGroups[0].getId());
            } else {
                setMissionGroupFilter('');
            }
        }
    }, [missionGroups]);


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
                <Button variant="contained" onClick={openCreateDialog}>
                    Create
                </Button>
            </Box>

            {/* --- gallery --- */}
            <Box sx={{ flex: 1, overflowY: 'auto', px: 2, pb: 2 }}>
                {photos.length === 0 ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}>
                        <Typography color="text.secondary">No photos yet. Upload the first one!</Typography>
                    </Box>
                ) : (
                    <ImageList variant="masonry" cols={cols} gap={8}>
                        {photos.filter((photo) => photo.getMissionGroupId() === missionGroupFilter).map((photo) => (
                            <ImageListItem
                                key={photo.getId() ?? photo.getName()}
                                sx={{ cursor: 'pointer', borderRadius: 1, overflow: 'hidden' }}
                                onClick={() => setSelected(photo)}
                            >
                                <img
                                    src={photo.getImageSrc()}
                                    alt={photo.getName()}
                                    loading="lazy"
                                    style={{ display: 'block', width: '100%' }}
                                />
                                <ImageListItemBar
                                    title={photo.getName()}
                                    subtitle={
                                        photo.getPosition()
                                            ? `${photo.getPosition()!.getLatitude().toFixed(5)}, ${photo.getPosition()!.getLongitude().toFixed(5)}`
                                            : undefined
                                    }
                                    actionIcon={
                                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5 }}>
                                            {photo.getPosition() && (
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
                        Are you sure you want to delete <strong>{editingPhoto ? editingPhoto.getName() : ''}</strong>? This cannot be undone.
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
                            {selected.getName()}
                            {selected.getPosition() && (
                                <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                                    {selected.getPosition()!.getLatitude().toFixed(6)},{' '}
                                    {selected.getPosition()!.getLongitude().toFixed(6)}
                                    {selected.getPosition()!.getAccuracy()
                                        ? ` ±${selected.getPosition()!.getAccuracy()}m`
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
                                alt={selected.getName()}
                                style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
                            />
                        </DialogContent>
                    </>
                )}
            </Dialog>
        </Box>
    );
}
