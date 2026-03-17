import { UnitRepresentation } from "./UnitRepresentation.tsx";
import { useContext, useState } from 'react';
import { UnitsContext } from "../contexts/UnitsContext.tsx"
import { MapConfigContext } from "../contexts/MapConfigContext.tsx";
import { ActiveUserContext } from "../contexts/ActiveUserContext.tsx";
import { MapUnitContextMenu } from "../components/contextMenu/MapUnitContextMenu.tsx";
import type { Unit } from "../enitities/Unit.ts";
import { ApiProvider } from "../dataProviders/ApiProvider.ts";
import { DataProvider } from "../dataProviders/DataProvider.ts";
import { DataBaseContext } from "../contexts/DataBaseContext.tsx";
export interface UnitDisplayProps {
    showId?: string | null;
    showOnly?: string[];
    showAlways?: boolean;
    iconSize?: number;
    showStatusBar?: boolean;
}

export function UnitDisplay(props: UnitDisplayProps): React.JSX.Element {
    const dp = DataProvider.getInstance();
    const databaseProvider = useContext(DataBaseContext);

    const units = useContext(UnitsContext);
    const mapConfig = useContext(MapConfigContext);
    const activeUser = useContext(ActiveUserContext);

    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
    const [contextMenuUnit, setContextMenuUnit] = useState<Unit | null>(null);


    const saveUnit = (updated: Unit) => {
        console.log('Saving unit', updated);
        ApiProvider.getInstance()
            .saveUnit(updated)
            .then((response) => {
                dp.addUnit(response);
                if (databaseProvider) {
                    databaseProvider.saveUnit(response);
                }
            });
    }

    return <>
        {units.map((unit) => {
            if (props.showOnly && !props.showOnly.includes(unit.getId())) {
                return null;
            }
            return <UnitRepresentation
                key={unit.getId()}
                unit={unit}
                iconSize={props.iconSize || mapConfig.getUnitIconSize()}
                showStatusBar={props.showStatusBar || mapConfig.getShowUnitStatus()}
                hideUnitsAfterPositionUpdate={mapConfig.getHideUnitsAfterPositionUpdate()}
                excludeStatuses={mapConfig.getExcludeStatuses()}
                showAlways={props.showAlways || unit.getId() == props.showId || activeUser?.getUnitId() == unit.getId()}
                onContextMenu={(e, unit) => {
                    setContextMenuPosition({ x: e.clientX, y: e.clientY });
                    setContextMenuUnit(unit);
                }}
            />;
        })}

        <MapUnitContextMenu unit={contextMenuUnit} open={contextMenuUnit != null} position={contextMenuPosition} onClose={() => setContextMenuUnit(null)} onEdit={saveUnit} onDelete={() => { }} />
    </>;
}