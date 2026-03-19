import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box } from "@mui/material";
import { useState, useEffect } from "react";
import { STATUS_COLORS, STATUS_LABELS } from "../../gDefs";
import type { Unit } from "../../enitities/Unit";




export function UnitStatusDialog(props: UnitStatusDialogProps) {

    const [status, setStatus] = useState<number>(-1);

    useEffect(() => {
        setStatus(props.unit?.getStatus() || -1);
    }, [props.unit]);


    return (<Dialog open={props.open} onClose={props.onClose}>
        <DialogTitle>{props.unit?.getName() || 'Einheit'}</DialogTitle>
        <DialogContent>
            <Box display={'flex'} flexDirection={'column'} gap={1} mt={1}>
                {Object.keys(STATUS_LABELS).map(key => (
                    <Button key={key} variant={status === parseInt(key) ? 'contained' : 'outlined'} onClick={() => { props.onSave(parseInt(key))}} color={STATUS_COLORS[parseInt(key)]}>
                        {key}: {STATUS_LABELS[parseInt(key)]}
                    </Button>
                ))}
            </Box>
        </DialogContent>
        <DialogActions>
            <Button onClick={props.onClose}>Abbrechen</Button>
        </DialogActions>
    </Dialog>
    );
}

interface UnitStatusDialogProps {
    open: boolean;
    unit: Unit | null;
    onClose: () => void;
    onSave: (status: number) => void;
}