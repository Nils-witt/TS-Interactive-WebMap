import { DialogContent, Box, FormControlLabel, Checkbox, DialogActions, Button, Accordion, AccordionDetails, AccordionSummary, Typography } from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import type { ChangeEvent, JSX } from "react";
import type { MapOverlay } from "../../enitities/MapOverlay";
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import type { Unit } from "../../enitities/Unit";


export interface SettingsDialogProps {
    open: boolean;
    onClose: () => void;
    overlays: MapOverlay[];
    selectedOverlys: string[];
    onUpdateSelectedOverlayIds: (ids: string[]) => void;

    units: Unit[];
    selectedUnitIds: string[];
    onUpdateSelectedUnitIds: (ids: string[]) => void;

    showUnitsStatusBar: boolean;
    onUpdateUnitsStatusBar: (active: boolean) => void;
}

export function SettingsDialog(props: SettingsDialogProps): JSX.Element {
    const toggleOverlay = (overlayId: string) => {
        props.onUpdateSelectedOverlayIds(
            props.selectedOverlys.includes(overlayId)
                ? props.selectedOverlys.filter((id) => id !== overlayId)
                : [...props.selectedOverlys, overlayId]
        );
    };


    const onSelectAll = () => {
        const allOverlayIds = props.overlays.map((overlay) => overlay.getId());
        props.onUpdateSelectedOverlayIds(allOverlayIds);
        const allUnitIds = props.units.map((unit) => unit.getId());
        props.onUpdateSelectedUnitIds(allUnitIds);
    };

    const onDeselectAll = () => {
        props.onUpdateSelectedOverlayIds([]);
        props.onUpdateSelectedUnitIds([]);
    };

    return <Dialog open={props.open} onClose={props.onClose} fullWidth maxWidth="sm">
        <DialogTitle>Select overlays for display map</DialogTitle>
        <DialogContent>
            <Accordion>
                <AccordionSummary
                    expandIcon={<ArrowDownwardIcon />}
                    aria-controls="panel1-content"
                    id="panel1-header"
                >
                    <Typography component="span">Overlays</Typography>
                </AccordionSummary>
                <AccordionDetails>

                    <Box sx={{ display: 'flex', flexDirection: 'column', mt: 1 }}>
                        {props.overlays.length === 0 ? (
                            <Box>No overlays available.</Box>
                        ) : (
                            props.overlays
                                .slice()
                                .sort((a, b) => {
                                    if (a.getOrder() !== b.getOrder()) {
                                        return a.getOrder() - b.getOrder();
                                    }
                                    return a.getName().localeCompare(b.getName());
                                })
                                .map((overlay) => (
                                    <FormControlLabel
                                        key={overlay.getId()}
                                        control={
                                            <Checkbox
                                                checked={props.selectedOverlys.includes(overlay.getId())}
                                                onChange={() => toggleOverlay(overlay.getId())}
                                            />
                                        }
                                        label={`${overlay.getName()} (v${overlay.getLayerVersion()})`}
                                    />
                                ))
                        )}
                    </Box>
                </AccordionDetails>
            </Accordion>
            <Accordion>
                <AccordionSummary
                    expandIcon={<ArrowDownwardIcon />}
                    aria-controls="panel2-content"
                    id="panel2-header"
                >
                    <Typography component="span">Units</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <FormControlLabel
                        key={"showStatusBar"}
                        control={<Checkbox
                            checked={props.showUnitsStatusBar}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => props.onUpdateUnitsStatusBar(e.target.checked)} />}
                        label="Show status bar"
                    />
                    <Box sx={{ display: 'flex', flexDirection: 'column', mt: 1 }}>
                        {props.units.length === 0 ? (
                            <Box>No units available.</Box>
                        ) : (
                            props.units
                                .slice()
                                .sort((a, b) => a.getName().localeCompare(b.getName()))
                                .map((unit) => (
                                    <FormControlLabel
                                        key={unit.getId()}
                                        control={
                                            <Checkbox
                                                checked={props.selectedUnitIds.includes(unit.getId())}
                                                onChange={() => props.onUpdateSelectedUnitIds(
                                                    props.selectedUnitIds.includes(unit.getId())
                                                        ? props.selectedUnitIds.filter((id) => id !== unit.getId())
                                                        : [...props.selectedUnitIds, unit.getId()]
                                                )}
                                            />
                                        }
                                        label={unit.getName()}
                                    />
                                ))
                        )}
                    </Box>
                </AccordionDetails>
            </Accordion>
        </DialogContent>
        <DialogActions>
            <Button
                onClick={() => {
                    if (document.fullscreenElement) {
                        document.exitFullscreen();
                    } else {
                        document.documentElement.requestFullscreen();
                    }
                }}
            >
                Full Screen
            </Button>
            <Button
                onClick={onSelectAll}
                disabled={props.overlays.length === 0}
            >
                Select all
            </Button>
            <Button onClick={onDeselectAll} disabled={props.overlays.length === 0}>
                Clear
            </Button>
            <Button variant="contained" onClick={props.onClose}>
                Close
            </Button>
        </DialogActions>
    </Dialog>;
}