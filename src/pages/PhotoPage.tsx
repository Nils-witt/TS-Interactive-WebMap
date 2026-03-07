import { useEffect, useState, useCallback, type JSX } from 'react';
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    ImageList,
    ImageListItem,
    ImageListItemBar,
    Tooltip,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import PlaceIcon from '@mui/icons-material/Place';
import { styled } from '@mui/material/styles';
import { ApiProvider } from '../dataProviders/ApiProvider';
import { DataProvider } from '../dataProviders/DataProvider';
import { type Photo } from '../enitities/Photo';

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
                                        photo.position ? (
                                            <Tooltip title="Has location">
                                                <PlaceIcon sx={{ color: 'rgba(255,255,255,0.7)', mr: 1 }} fontSize="small" />
                                            </Tooltip>
                                        ) : undefined
                                    }
                                    actionPosition="right"
                                />
                            </ImageListItem>
                        ))}
                    </ImageList>
                )}
            </Box>

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
