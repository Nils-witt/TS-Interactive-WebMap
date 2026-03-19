import {
  Dialog,
  DialogTitle,
  Divider,
  DialogContent,
  Typography,
  ListItem,
  ListItemButton,
  Checkbox,
  ListItemText,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import { type JSX, useContext, useEffect, useState } from 'react';
import type { MissionGroup } from '../../enitities/MissionGroup';
import { MapGroupContext } from '../../contexts/MapGroupContext';

export interface AssignMapGroupsDialogProps {
  open: boolean;
  onClose: () => void;
  onEdit: (missionGroup: MissionGroup) => void;
  missionGroup?: MissionGroup | null;
}

export function AssignMapGroupsDialog(
  props: AssignMapGroupsDialogProps,
): JSX.Element {
  const units = useContext(MapGroupContext);
  const [selectedMapGroupIds, setSelectedMapGroupIds] = useState<string[]>([]);

  const [nameFilter, setNameFilter] = useState<string>('');

  const onSave = () => {
    if (!props.missionGroup) return;
    const mg = props.missionGroup.clone();
    mg.setMapGroupIds(selectedMapGroupIds);
    props.onEdit(mg);
    props.onClose();
  };

  const toggleAssignedMapGroup = (mapGroupId: string) => {
    setSelectedMapGroupIds((prev) =>
      prev.includes(mapGroupId)
        ? prev.filter((id) => id !== mapGroupId)
        : [...prev, mapGroupId],
    );
  };

  useEffect(() => {
    if (!props.missionGroup) return;

    setSelectedMapGroupIds(props.missionGroup.getMapGroupIds());
  }, [props.missionGroup]);

  const filteredMapGroups = units.filter((mapGroup) =>
    mapGroup.getName().toLowerCase().includes(nameFilter.toLowerCase()),
  );

  return (
    <Dialog open={props.open} onClose={props.onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Assigned Map Groups</DialogTitle>
      <Divider />
      <DialogContent sx={{ p: 0 }}>
        <TextField
          label="Filter by name…"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          size="small"
          sx={{ m: 2 }}
        />

        {filteredMapGroups.length === 0 ? (
          <Typography color="text.secondary" variant="body2" sx={{ p: 2 }}>
            No map groups available.
          </Typography>
        ) : (
          filteredMapGroups.map((mapGroup) => {
            const checked = selectedMapGroupIds.includes(mapGroup.getId());
            return (
              <ListItem key={mapGroup.getId()} disablePadding>
                <ListItemButton
                  onClick={() => toggleAssignedMapGroup(mapGroup.getId())}
                >
                  <Checkbox
                    edge="start"
                    checked={checked}
                    tabIndex={-1}
                    disableRipple
                  />
                  <ListItemText primary={mapGroup.getName()} secondary={''} />
                </ListItemButton>
              </ListItem>
            );
          })
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>Cancel</Button>
        <Button variant="contained" onClick={onSave}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
