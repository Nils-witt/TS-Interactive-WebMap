import { UnitRepresentation } from "./UnitRepresentation.tsx";
import { useContext } from 'react';
import { UnitsContext } from "../contexts/UnitsContext.tsx"
import { MapConfigContext } from "../contexts/MapConfigContext.tsx";
import { ActiveUserContext } from "../contexts/ActiveUserContext.tsx";
export interface UnitDisplayProps {
    showId?: string | null;
    showOnly?: string[];
    showAlways?: boolean;
    iconSize?: number;
    showStatusBar?: boolean;
}

export function UnitDisplay(props: UnitDisplayProps): React.JSX.Element {

    const units = useContext(UnitsContext);
    const mapConfig = useContext(MapConfigContext);
    const activeUser = useContext(ActiveUserContext);

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
                showAlways={props.showAlways || unit.getId() == props.showId || activeUser?.getUnitId() == unit.getId()} />;
        })}
    </>;
}