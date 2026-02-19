import {useMap} from "@vis.gl/react-maplibre";
import {useEffect, useState} from "react";
import {MapConfig} from "../enitities/MapConfig.ts";
import {DataProvider, DataProviderEventType} from "../dataProviders/DataProvider.ts";
import type {Unit} from "../enitities/Unit.ts";
import {ApplicationLogger} from "../ApplicationLogger.ts";
import {Marker, type MarkerOptions} from "maplibre-gl";
import {DataEvent, GlobalEventHandler} from "../dataProviders/GlobalEventHandler.ts";
import {EmbeddablePosition} from "../enitities/embeddables/EmbeddablePosition.ts";


export function UnitDisplay() {
    const mapRef = useMap();

    const [mapConfig, setMapConfig] = useState<MapConfig>(new MapConfig());
    const [iconSize, setIconSize] = useState<number>(mapConfig.getUnitIconSize());
    const [units] = useState<Map<string, Unit>>(new Map<string, Unit>());
    const [unitMarkers] = useState<Map<string, Marker>>(new Map<string, Marker>());
    const [unitTimeStampRefreshers] = useState<Map<string, NodeJS.Timeout>>(new Map<string, NodeJS.Timeout>());

    useEffect(() => {
        DataProvider.getInstance().on(DataProviderEventType.MAP_CONFIG_UPDATED, (event) => {
            const config: MapConfig = event.data as MapConfig;
            setMapConfig(config);
            setIconSize(config.getUnitIconSize())
        });
        setMapConfig(DataProvider.getInstance().getMapConfig());
        setIconSize(mapConfig.getUnitIconSize());

        DataProvider.getInstance().on(DataProviderEventType.UNIT_UPDATED, (event) => {
            ApplicationLogger.info('Unit updated, updating on map:' + (event.data as Unit).getName(), {service: 'UnitDisplay'});
            const item = event.data as Unit;
            units.set(item.getId() as string, item);
            updateUnit(item);
        });
        DataProvider.getInstance().on(DataProviderEventType.UNIT_ADDED, (event) => {
            ApplicationLogger.info('New unit added, showing on map:' + (event.data as Unit).getName(), {service: 'UnitDisplay'});
            const item = event.data as Unit;
            units.set(item.getId() as string, item);
            updateUnit(item);
        });
        DataProvider.getInstance().getUnits().forEach((item) => {
            ApplicationLogger.info('Showing existing unit on map:' + item.getName(), {service: 'UnitDisplay'});
            units.set(item.getId() as string, item);
            updateUnit(item);
        });
    }, []);

    useEffect(() => {
        updateAllUnits();
    }, [mapRef.current]);

    useEffect(() => {
        updateAllUnits();
    }, [iconSize]);

    const updateAllUnits = () => {
        ApplicationLogger.info('Updating all units (+' + units.size + ') on map', {service: 'UnitDisplay'});
        for (const unit of units) {
            updateUnit(unit[1]);
        }
    };

    const updateLocationTime = (unit: Unit) => {
        const marker = unitMarkers.get(unit.getId() as string);
        if (marker) {
            const status_time_labels = marker._element.getElementsByClassName('unit-status-time-label');
            if (status_time_labels && status_time_labels.length > 0) {
                const status_time_label = status_time_labels[0] as HTMLElement;
                const timestamp = unit.getPosition()?.getTimestamp().getTime();
                if (typeof timestamp === "number") {
                    const timeDiff = Date.now() - timestamp;
                    const minutes = Math.floor(timeDiff / 60000);
                    const seconds = Math.floor((timeDiff % 60000) / 1000);
                    status_time_label.innerText = `${minutes}m ${seconds}s ago`;
                } else {
                    status_time_label.innerText = 'No data';
                }
            }
        }
    }

    const updateUnit = (unit: Unit) => {
        if (mapRef.current) {
            ApplicationLogger.debug('Updated unit on map:' + unit.getName(), {service: 'UnitDisplay'});
            if (unit.getStatus() != null && mapConfig.getExcludeStatuses().indexOf(unit.getStatus() || 6) < 0 && unit.getPosition() != null) {
                if (!unitMarkers.has(unit.getId() as string)) {
                    const markerOptions: MarkerOptions = {};
                    unitMarkers.set(unit.getId() as string, new Marker());
                    if (unit.getIconElement()) {
                        const container = document.createElement('div');
                        container.className = 'unit-marker-container';
                        const imgContainer = document.createElement('div');
                        imgContainer.className = 'unit-icon-container';
                        imgContainer.appendChild(unit.getIconElement({width: iconSize}) as HTMLElement);
                        container.appendChild(imgContainer);
                        const status_div = document.createElement('div');
                        status_div.className = 'unit-status-indicator';

                        const status_num_div = document.createElement('div');
                        const status_num_label = document.createElement('label');
                        status_num_label.className = 'unit-status-num-label';
                        if (unit.getStatus() && unit.getStatus() != null) {
                            status_num_label.innerText = (unit.getStatus() as number).toString();
                        } else {
                            status_num_label.innerText = '-';
                        }
                        status_num_div.appendChild(status_num_label);
                        status_div.appendChild(status_num_div);

                        const status_time_div = document.createElement('div');
                        const status_time_label = document.createElement('label');
                        status_time_label.className = 'unit-status-time-label';
                        status_time_div.appendChild(status_time_label);
                        status_div.appendChild(status_time_div);
                        container.appendChild(status_div);
                        markerOptions.element = container;

                        container.addEventListener('click', () => {
                            console.log('Clicked unit marker: ' + unit.getName());
                            GlobalEventHandler.getInstance().emit('show-route', new DataEvent('show-route', unit));
                        });
                    }

                    const position: EmbeddablePosition = unit.getPosition() as EmbeddablePosition;
                    try {
                        const marker = new Marker(markerOptions)
                            .setLngLat([position.getLongitude(), position.getLatitude()])
                            .addTo(mapRef.current.getMap());

                        unitMarkers.set(unit.getId() as string, marker);
                    } catch {
                        //pass
                    }
                    if (unitTimeStampRefreshers.has(unit.getId() as string)) {
                        unitTimeStampRefreshers.get(unit.getId() as string)?.close();
                    }
                    const interval = setInterval(() => updateLocationTime(unit), 2000);
                    unitTimeStampRefreshers.set(unit.getId() as string, interval);
                    // updateLocationTime(unit);
                } else {
                    const marker = unitMarkers.get(unit.getId() as string);
                    if (marker && unit.getPosition() != null) {
                        const position: EmbeddablePosition = unit.getPosition() as EmbeddablePosition;
                        try {
                            marker.setLngLat([position.getLongitude(), position.getLatitude()]);
                        } catch  {
                            /* Pass */
                        }

                        if (unit.getIconElement()) {
                            console.log("Icon element exists for unit: " + unit.getName());
                            const iconContainers = marker._element.getElementsByClassName('unit-icon-container');
                            if (iconContainers) {
                                while (iconContainers.length > 1) {
                                    iconContainers[1].remove();
                                }
                                if (iconContainers[0]) {
                                    ApplicationLogger.info('Updating icon for unit: ' + unit.getName() + " to " + iconSize, {service: 'UnitDisplay'});
                                    const iconContainer = iconContainers[0];
                                    iconContainer.innerHTML = '';
                                    iconContainer.appendChild(unit.getIconElement({width: iconSize}) as HTMLElement);
                                }
                            }
                            const status_num_labels = marker._element.getElementsByClassName('unit-status-num-label');
                            if (status_num_labels && status_num_labels.length > 0) {
                                const status_num_label = status_num_labels[0] as HTMLElement;
                                if (unit.getStatus() && unit.getStatus() != null) {
                                    status_num_label.innerText = (unit.getStatus() as number).toString();
                                } else {
                                    status_num_label.innerText = '-';
                                }
                            }
                            if (unitTimeStampRefreshers.has(unit.getId() as string)) {
                                clearInterval(unitTimeStampRefreshers.get(unit.getId() as string))
                            }
                            const interval = setInterval(() => updateLocationTime(unit), 2000);
                            unitTimeStampRefreshers.set(unit.getId() as string, interval);
                        }
                    }
                }
            } else {
                if (unitMarkers.has(unit.getId() as string)) {
                    const marker = unitMarkers.get(unit.getId() as string);
                    if (marker) {
                        marker.remove();
                    }
                    unitMarkers.delete(unit.getId() as string);
                }
            }
        }
    };
    return <></>;
}