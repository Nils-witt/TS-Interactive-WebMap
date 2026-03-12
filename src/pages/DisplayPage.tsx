import { useContext, useEffect, useState } from 'react';
import {
    Box,
    Button,
} from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import { DisplayMapComponent } from '../components/DisplayMapComponent';
import { NotificationList } from '../components/NotificationList.tsx';
import { MapOverlayContext } from '../contexts/MapOverlayContext.tsx';

import './css/displayPage.scss';
import { SettingsDialog } from '../components/display/SettingsDialog.tsx';
import { UnitsContext } from '../contexts/UnitsContext.tsx';

export function DisplayPage() {
    const overlays = useContext(MapOverlayContext);
    const [selectedOverlayIds, setSelectedOverlayIds] = useState<string[]>(JSON.parse(localStorage.getItem('displayOverlaysShown') || '[]') as string[]);

    const units = useContext(UnitsContext);
    const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>(JSON.parse(localStorage.getItem('displayUnitsShown') || '[]') as string[]);

    const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);


    useEffect(() => {
        localStorage.setItem('displayOverlaysShown', JSON.stringify(selectedOverlayIds));
    }, [selectedOverlayIds]);

    useEffect(() => {
        localStorage.setItem('displayUnitsShown', JSON.stringify(selectedUnitIds));
    }, [selectedUnitIds]);

    return (
        <div className="display-page" >
            <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                <DisplayMapComponent visibleOverlayIds={selectedOverlayIds} visibleUnitIds={selectedUnitIds} />
                <Button
                    variant="contained"
                    size="small"
                    startIcon={<TuneIcon />}
                    onClick={() => setSettingsDialogOpen(true)}
                    sx={{
                        position: 'absolute',
                        top: 12,
                        left: 12,
                        zIndex: 10,
                    }}
                >
                </Button>
            </Box>

            <NotificationList />
            <SettingsDialog
                open={settingsDialogOpen}
                onClose={() => setSettingsDialogOpen(false)}
                overlays={overlays}
                selectedOverlys={selectedOverlayIds}
                onUpdateSelectedOverlayIds={setSelectedOverlayIds}
                units={units}
                selectedUnitIds={selectedUnitIds}
                onUpdateSelectedUnitIds={setSelectedUnitIds}
            />
        </div>
    );
}