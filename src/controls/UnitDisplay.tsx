import {useMap} from "@vis.gl/react-maplibre";
import {useEffect, useState} from "react";
import {MapConfigEvents} from "../enitities/MapConfig.ts";
import {DataProvider, DataProviderEvent, DataProviderEventType} from "../dataProviders/DataProvider.ts";
import type {Unit} from "../enitities/Unit.ts";
import {ApplicationLogger} from "../ApplicationLogger.ts";
import {GlobalEventHandler} from "../dataProviders/GlobalEventHandler.ts";
import {UnitRepresentation} from "./UnitRepresentation.ts";


export function UnitDisplay() {
    const mapRef = useMap();

    const [iconSize, setIconSize] = useState<number>(75);
    const [units] = useState<Map<string, UnitRepresentation>>(new Map<string, UnitRepresentation>());

    const [excludeStatuses, setExcludeStatuses] = useState<number[]>([6]);
    const [hideUnitsAfterPositionUpdate, setHideUnitsAfterPositionUpdate] = useState<number>(21600);
    const [showUnitStatus, setShowUnitStatus] = useState<boolean>(false);

    useEffect(() => {
        const tmpConf = DataProvider.getInstance().getMapConfig();
        setIconSize(tmpConf.getUnitIconSize());
        setExcludeStatuses(tmpConf.getExcludeStatuses());
        setHideUnitsAfterPositionUpdate(tmpConf.getHideUnitsAfterPositionUpdate());
        setShowUnitStatus(tmpConf.getShowUnitStatus());

        const onUnitIconSizeChanged = (event: Event) => {
            const newSize = (event as DataProviderEvent).data as number;
            setIconSize(newSize);
        };
        const onShowUnitStatusChanged = (event: Event) => {
            const newSize = (event as DataProviderEvent).data as boolean;
            setShowUnitStatus(newSize);
            updateHiddenState(newSize);
        };
        const onExcludeStatusesChanged = (event: Event) => {
            const newSize = (event as DataProviderEvent).data as number[];
            setExcludeStatuses(newSize);
        };
        const onHideUnitsAfterPositionUpdateChanged = (event: Event) => {
            const newTimout = (event as DataProviderEvent).data as number;
            setHideUnitsAfterPositionUpdate(newTimout);
        };
        const onUnitUpdated = (event: DataProviderEvent) => {
            ApplicationLogger.info('Unit updated, updating on map:' + (event.data as Unit).getName(), {service: 'UnitDisplay'});
            updateUnit(event.data as Unit);
        };
        const onUnitAdded = (event: DataProviderEvent) => {
            ApplicationLogger.info('New unit added, showing on map:' + (event.data as Unit).getName(), {service: 'UnitDisplay'});
            updateUnit(event.data as Unit);
        };

        GlobalEventHandler.getInstance().on(MapConfigEvents.UnitIconSizeChanged, onUnitIconSizeChanged);
        GlobalEventHandler.getInstance().on(MapConfigEvents.ShowUnitStatusChanged, onShowUnitStatusChanged);
        GlobalEventHandler.getInstance().on(MapConfigEvents.ExcludeStatusesChanged, onExcludeStatusesChanged);
        GlobalEventHandler.getInstance().on(MapConfigEvents.HideUnitsAfterPositionUpdateChanged, onHideUnitsAfterPositionUpdateChanged);
        DataProvider.getInstance().on(DataProviderEventType.UNIT_UPDATED, onUnitUpdated);
        DataProvider.getInstance().on(DataProviderEventType.UNIT_ADDED, onUnitAdded);

        DataProvider.getInstance().getUnits().forEach((item) => {
            ApplicationLogger.info('Showing existing unit on map:' + item.getName(), {service: 'UnitDisplay'});
            updateUnit(item);
        });

        return () => {
            GlobalEventHandler.getInstance().off(MapConfigEvents.UnitIconSizeChanged, onUnitIconSizeChanged);
            GlobalEventHandler.getInstance().off(MapConfigEvents.ShowUnitStatusChanged, onShowUnitStatusChanged);
            GlobalEventHandler.getInstance().off(MapConfigEvents.ExcludeStatusesChanged, onExcludeStatusesChanged);
            GlobalEventHandler.getInstance().off(MapConfigEvents.HideUnitsAfterPositionUpdateChanged, onHideUnitsAfterPositionUpdateChanged);
            DataProvider.getInstance().off(DataProviderEventType.UNIT_UPDATED, onUnitUpdated);
            DataProvider.getInstance().off(DataProviderEventType.UNIT_ADDED, onUnitAdded);
        };
    }, []);

    useEffect(() => {
        units.forEach(unit => {
            unit.setMap(mapRef.current?.getMap());
        });
    }, [mapRef.current]);

    useEffect(() => {
        units.forEach(unit => {
            unit.setExcludeStatuses(excludeStatuses);
        });
    }, [excludeStatuses]);

    useEffect(() => {
        units.forEach(unit => {
            unit.setIconSize(iconSize);
        });
    }, [iconSize]);

    useEffect(() => {
        units.forEach(unit => {
            unit.setShowIconTimeout(hideUnitsAfterPositionUpdate);
        });
    }, [hideUnitsAfterPositionUpdate]);

    useEffect(() => {
        units.forEach(unit => {
            unit.setShowStatusBar(showUnitStatus);
        });
    }, [showUnitStatus]);

    const updateUnit = (unit: Unit) => {
        const unitRep = units.get(unit.getId() as string);
        if (unitRep) {
            unitRep.update(unit);
        } else {
            const newRep = new UnitRepresentation(unit, mapRef.current?.getMap());
            newRep.setIconSize(iconSize);
            newRep.setShowStatusBar(showUnitStatus);
            newRep.setShowIconTimeout(hideUnitsAfterPositionUpdate);
            newRep.setExcludeStatuses(excludeStatuses);
            units.set(unit.getId() as string, newRep);
        }
    }

    const updateHiddenState = (shown: boolean) => {
        const containers = document.getElementsByClassName('unit-status-indicator');
        for (const container of containers) {
            if (!shown) {
                (container as HTMLElement).style.visibility = 'hidden';
            } else {
                (container as HTMLElement).style.visibility = 'visible';
            }
        }
    }

    return <></>;
}