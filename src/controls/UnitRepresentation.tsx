import { useEffect, useState } from 'react';
import type { Unit } from '../enitities/Unit.ts';

import { Marker } from '@vis.gl/react-maplibre';
import Chip from '@mui/material/Chip';
import { STATUS_COLORS } from '../gDefs.ts';


import './css/UnitRepresentation.scss';

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
            if (interval) {
                clearInterval(interval);
            }
        }

    }, [props.showAlways, props.unit.getPosition(), props.unit.getStatus()]);


    return <>
        {show && props.unit.getImgSrc() != '' ? (
            <Marker latitude={props.unit.getPosition()!.latitude} longitude={props.unit.getPosition()!.longitude}>
                <div style={{ width: props.iconSize > 10 ? props.iconSize : 75 }} className='unit-respresentation-container'>
                    <img
                        src={props.unit.getImgSrc()}
                        alt={props.unit.getName()}
                        style={{ width: '100%', height: '100%' }} />
                    {props.showStatusBar ? (
                        <div>
                            <Chip
                                label={`${props.unit.getStatus()}`}
                                size="small"
                                color={STATUS_COLORS[props.unit.getStatus() || 10] ?? 'default'}
                            />
                        </div>
                    ) : (<></>)}
                </div>
            </Marker>
        ) : (<></>)}
    </>;

}