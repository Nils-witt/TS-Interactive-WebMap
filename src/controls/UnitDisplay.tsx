import { UnitRepresentation } from "./UnitRepresentation.tsx";
import { useContext } from 'react';
import { UnitsContext } from "../contexts/UnitsContext.tsx" 
import { MapConfigContext } from "../contexts/MapConfigContext.tsx";
import { ActiveUserContext } from "../contexts/ActiveUserContext.tsx";
export interface UnitDisplayProps {
    showId?: string | null;
}

export function UnitDisplay(props: UnitDisplayProps): React.JSX.Element {

    const units = useContext(UnitsContext);
    const mapConfig = useContext(MapConfigContext);
    const activeUser = useContext(ActiveUserContext);


    console.log('Rendering UnitDisplay with activeUser: ' + (activeUser ? activeUser.getUsername() : 'null') );

    return <>
        {units.map((unit) => {
            return <UnitRepresentation 
            key={unit.getId()} 
            unit={unit} 
            iconSize={mapConfig.getUnitIconSize()} 
            showStatusBar={mapConfig.getShowUnitStatus()} 
            hideUnitsAfterPositionUpdate={mapConfig.getHideUnitsAfterPositionUpdate()} 
            excludeStatuses={mapConfig.getExcludeStatuses()} 
            showAlways={unit.getId() == props.showId || activeUser?.getUnitId() == unit.getId()} />;
        })}
    </>;
}