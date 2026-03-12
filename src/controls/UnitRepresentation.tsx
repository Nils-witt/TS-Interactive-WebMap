import { useEffect, useState } from 'react';
import type { Unit } from '../enitities/Unit.ts';

import { Marker } from '@vis.gl/react-maplibre';

export interface UnitRepresentationProps {
    unit: Unit;
    iconSize: number;
    showStatusBar: boolean;
    hideUnitsAfterPositionUpdate: number;
    excludeStatuses: number[];
    showAlways: boolean;
}

export function UnitRepresentation(props: UnitRepresentationProps): React.JSX.Element {

    const [show, setShow] = useState<boolean>(false);


    const recheckTimeOut = () => {
        if (Date.now() - props.unit.getPosition()!.getTimestamp().getTime() >= (props.hideUnitsAfterPositionUpdate * 1000)) {
            setShow(false);
        }
    }

    useEffect(() => {

        const interval: NodeJS.Timeout | undefined = undefined;

        if (props.unit.getPosition()) {
            if (props.showAlways) {
                setShow(true);
                return;
            } else if (Date.now() - props.unit.getPosition()!.getTimestamp().getTime() < (props.hideUnitsAfterPositionUpdate * 1000)) {
                setShow(true);
                setInterval(recheckTimeOut, 1000);
                return;
            }
        }

        return () => {
            if(interval){
                clearInterval(interval);
            }
        }

    }, [props.showAlways, props.unit.getPosition(), props.unit.getStatus()]);


    return <>
        {show && props.unit.getImgSrc() != '' ? (
            <Marker latitude={props.unit.getPosition()!.latitude} longitude={props.unit.getPosition()!.longitude}>
                <div style={{ position: 'relative', width: props.iconSize, height: props.iconSize }}>
                    <img
                        src={props.unit.getImgSrc()}
                        alt={props.unit.getName()}
                        style={{ width: '100%', height: '100%' }} />
                </div>
            </Marker>
        ) : <></>}
    </>;

}