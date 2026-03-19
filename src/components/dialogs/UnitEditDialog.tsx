import DialogContent from '@mui/material/DialogContent';
import type { Unit } from '../../enitities/Unit';
import TextField from '@mui/material/TextField';
import {
  Dialog,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  DialogActions,
  Button,
} from '@mui/material';
import { STATUS_LABELS } from '../../gDefs';
import { useEffect, useState } from 'react';
import { EditIconDialog } from '../EditIconDialog';
import type { TaktischesZeichen } from 'taktische-zeichen-react';

export function UnitEditDialog(props: UnitEditDialogProps) {
  const [editName, setEditName] = useState<string>('');
  const [editStatus, setEditStatus] = useState<string>('');
  const [taktischesZeichen, setTaktischesZeichen] =
    useState<TaktischesZeichen | null>(null);

  const [isIconEdit, setIsIconEdit] = useState(false);

  const save = () => {
    if (!props.unit) return;
    const updatedUnit = props.unit;
    updatedUnit.setName(editName);
    updatedUnit.setStatus(parseInt(editStatus) || null);
    updatedUnit.setSymbol(taktischesZeichen);
    props.onSave(updatedUnit);
    props.onClose();
  };

  useEffect(() => {
    if (props.unit) {
      setEditName(props.unit.getName());
      setEditStatus(props.unit.getStatus()?.toString() || '');
      setTaktischesZeichen(props.unit.getSymbol());
    }
  }, [props.unit]);

  const iconSave = (symbol: TaktischesZeichen) => {
    if (!props.unit) return;
    setTaktischesZeichen(symbol);
    setIsIconEdit(false);
  };

  return (
    <>
      <Dialog open={props.open} onClose={props.onClose} fullWidth maxWidth="xs">
        <DialogTitle>{editName}</DialogTitle>
        <DialogContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            pt: '16px !important',
          }}
        >
          <TextField
            label="Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            fullWidth
            size="small"
          />
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <MenuItem key={key} value={key}>
                  {key} – {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsIconEdit(true)}>Edit Icon</Button>
          <Button onClick={props.onClose}>Cancel</Button>
          <Button variant="contained" onClick={save}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
      <EditIconDialog
        open={isIconEdit}
        entity={props.unit?.getSymbol()}
        onClose={() => setIsIconEdit(false)}
        onSave={iconSave}
        unitName={props.unit?.getName()}
      />
    </>
  );
}

export interface UnitEditDialogProps {
  open: boolean;
  unit: Unit | null;
  onClose: () => void;
  onSave: (unit: Unit) => void;
}
