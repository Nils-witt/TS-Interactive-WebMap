import { Menu, MenuItem } from '@mui/material';
import { useState, type JSX } from 'react';
import type { Unit } from '../../enitities/Unit';
import { useMap } from '@vis.gl/react-maplibre';
import { EmbeddablePosition } from '../../enitities/embeddables/EmbeddablePosition';
import { UnitStatusDialog } from '../dialogs/UnitStatusDialog';

export function MapUnitContextMenu(
  props: MapUnitContextMenuProps,
): JSX.Element {
  const map = useMap();

  const [showStatusDialog, setShowStatusDialog] = useState(false);

  const onSetPosition = () => {
    if (!props.unit || !map) return;

    void map.current?.getMap().once('click', (e) => {
      const { lng, lat } = e.lngLat;
      const unit = props.unit!.clone();
      unit.setPosition(new EmbeddablePosition(lat, lng, 0.0, new Date()));
      props.onEdit(unit);
    });
    props.onClose();
  };

  const onSetStatus = (status: number) => {
    if (!props.unit) return;
    const unit = props.unit.clone();
    unit.setStatus(status);
    props.onEdit(unit);
    setShowStatusDialog(false);
    props.onClose();
  };

  return (
    <>
      <Menu
        open={props.open}
        onClose={props.onClose}
        anchorReference="anchorPosition"
        anchorPosition={{ top: props.position.y, left: props.position.x }}
      >
        <MenuItem onClick={() => setShowStatusDialog(true)}>
          Set Status
        </MenuItem>
        <MenuItem onClick={onSetPosition}>Set Position</MenuItem>
      </Menu>
      <UnitStatusDialog
        unit={props.unit}
        open={showStatusDialog}
        onClose={() => setShowStatusDialog(false)}
        onSave={onSetStatus}
      />
    </>
  );
}

interface MapUnitContextMenuProps {
  position: { x: number; y: number };
  open: boolean;
  unit: Unit | null;
  onClose: () => void;
  onEdit: (unit: Unit) => void;
}
