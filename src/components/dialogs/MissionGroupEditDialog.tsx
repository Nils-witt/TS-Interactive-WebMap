import { Dialog, DialogTitle, Divider, DialogContent, TextField, DialogActions, Button } from "@mui/material";
import { useEffect, useState, type JSX } from "react";
import type { MissionGroup } from "../../enitities/MissionGroup";


export interface MissionGroupEditDialogProps {
    missionGroup: MissionGroup | null;
    open: boolean;
    onClose: () => void;
    onSave: (updated: MissionGroup) => void;
}

export function MissionGroupEditDialog(props: MissionGroupEditDialogProps): JSX.Element {
    const [editName, setEditName] = useState('');
    const [editStartTime, setEditStartTime] = useState('');
    const [editEndTime, setEditEndTime] = useState('');

    useEffect(() => {
        if (props.missionGroup) {
            setEditName(props.missionGroup.getName());
            setEditStartTime(props.missionGroup.getStartTime().toISOString().slice(0, 16));
            const end = props.missionGroup.getEndTime();
            setEditEndTime(end ? end.toISOString().slice(0, 16) : '');
        } else {
            setEditName('');
            setEditStartTime('');
            setEditEndTime('');
        }
    }, [props.missionGroup]);

    const save = () => {
        if (!props.missionGroup) return;

        const updated = props.missionGroup;
        updated.setName(editName.trim());
        updated.setStartTime(new Date(editStartTime));
        updated.setEndTime(editEndTime.trim() ? new Date(editEndTime) : null);

        props.onSave(updated);
    };

    return (
        <Dialog open={props.open} onClose={props.onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Edit Mission Group</DialogTitle>
            <Divider />
            <DialogContent sx={{ pt: 2, display: 'grid', gap: 2 }}>
                <TextField
                    label="Name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    fullWidth
                    required
                />
                <TextField
                    label="Start Time"
                    type="datetime-local"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    fullWidth
                    required
                    InputLabelProps={{ shrink: true }}
                />
                <TextField
                    label="End Time"
                    type="datetime-local"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    helperText="Optional"
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={props.onClose}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={save}
                >
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );


}