import { Dialog, DialogTitle, Divider, DialogContent, Typography, ListItem, ListItemButton, Checkbox, ListItemText, DialogActions, Button, TextField } from "@mui/material";
import { type JSX, useContext, useEffect, useState } from "react";
import { UnitsContext } from "../../contexts/UnitsContext";
import type { MissionGroup } from "../../enitities/MissionGroup";

export interface AssignUnitsDialogProps {
    open: boolean;
    onClose: () => void;
    onEdit: (missionGroup: MissionGroup) => void;
    missionGroup?: MissionGroup | null;
}

export function AssignUnitsDialog(props: AssignUnitsDialogProps): JSX.Element {
    const units = useContext(UnitsContext);
    const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);

    const [nameFilter, setNameFilter] = useState<string>('');

    const onSave = () => {
        if (!props.missionGroup) return;
        const mg = props.missionGroup.clone();
        mg.setUnitIds(selectedUnitIds);
        props.onEdit(mg);
        props.onClose();
    };

    const toggleAssignedUnit = (unitId: string) => {
        setSelectedUnitIds((prev) => (
            prev.includes(unitId)
                ? prev.filter((id) => id !== unitId)
                : [...prev, unitId]
        ));
    };

    useEffect(() => {
        if (!props.missionGroup) return;

        setSelectedUnitIds(props.missionGroup.getUnitIds());
    }, [props.missionGroup]);


    const filteredUnits = units.filter((unit) => unit.getName().toLowerCase().includes(nameFilter.toLowerCase()));

    return (
        <Dialog open={props.open} onClose={props.onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Assigned Units</DialogTitle>
            <Divider />
            <DialogContent sx={{ p: 0 }}>
                <TextField
                    label="Filter by name…"
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                    size="small"
                    sx={{ m: 2 }}
                />

                {filteredUnits.length === 0 ? (
                    <Typography color="text.secondary" variant="body2" sx={{ p: 2 }}>
                        No units available.
                    </Typography>
                ) : (
                    filteredUnits.map((unit) => {
                        const checked = selectedUnitIds.includes(unit.getId());
                        return (
                            <ListItem key={unit.getId()} disablePadding>
                                <ListItemButton onClick={() => toggleAssignedUnit(unit.getId())}>
                                    <Checkbox edge="start" checked={checked} tabIndex={-1} disableRipple />
                                    <ListItemText primary={unit.getName()} secondary={"Status: " + unit.getStatus()} />
                                </ListItemButton>
                            </ListItem>
                        );
                    })
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={props.onClose}>Cancel</Button>
                <Button variant="contained" onClick={onSave}>Save</Button>
            </DialogActions>
        </Dialog>
    )
}