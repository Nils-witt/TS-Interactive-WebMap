import {useMap} from "@vis.gl/react-maplibre";
import {useEffect, useState} from "react";
import {DataEvent, GlobalEventHandler} from "../dataProviders/GlobalEventHandler.ts";
import type {Unit} from "../enitities/Unit.ts";
import {DataProvider, DataProviderEventType} from "../dataProviders/DataProvider.ts";
import {Marker} from "maplibre-gl";

export function RouteDisplay() {
    const mapRef = useMap();
    const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([] as [number, number][]);
    const [unitId, setUnitId] = useState<string | null>(null);
    const [endPoint, setEndPoint] = useState<[number, number] | null>(null);

    const markerEnd = new Marker()

    useEffect(() => {
        GlobalEventHandler.getInstance().on('show-route', (event: Event) => {
            const dataEvent = event as DataEvent;
            const unit = dataEvent.data as Unit;
            setUnitId(unit.getId());
            if (unit.getRoute()) {
                setRouteCoordinates((DataProvider.getInstance().getUnits().get(unit.getId()!)?.getRoute() || []).map(coord => [coord.longitude, coord.latitude]))
            }

        });
        GlobalEventHandler.getInstance().on('hide-route', () => {
            setRouteCoordinates([] as [number, number][]);
            setUnitId(null);
        });
        DataProvider.getInstance().on(DataProviderEventType.UNIT_UPDATED, (e) => {
            const updatedEvent = e as DataEvent;
            const updatedUnit = updatedEvent.data as Unit;
            if (updatedUnit.getId() === unitId) {
                if (updatedUnit.getRoute()) {
                    setRouteCoordinates((updatedUnit.getRoute() || []).map(coord => [coord.longitude, coord.latitude]))
                } else {
                    setRouteCoordinates([] as [number, number][]);
                }
            }
        });
    }, []);


    const updateRoute = () => {
        const map = mapRef.current?.getMap();
        if (!map) {
            return;
        }
        setEndPoint(
            routeCoordinates.length > 0 ? routeCoordinates[routeCoordinates.length - 1] : null
        );

        if (map.isStyleLoaded()) {
            if (map.getLayer('route')) {
                map.removeLayer('route');
            }
            if (map.getSource('uploaded-source')) {
                map.removeSource('uploaded-source');
            }

            // Add as source to the map
            map.addSource('uploaded-source', {
                'type': 'geojson',
                'data': {
                    'type': 'Feature',
                    'properties': {},
                    'geometry': {
                        'type': 'LineString',
                        'coordinates': routeCoordinates
                    }
                }
            });
            map.addLayer({
                'id': 'route',
                'type': 'line',
                'source': 'uploaded-source',
                'layout': {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                'paint': {
                    'line-color': 'red',
                    'line-width': 3
                }
            });
        }
    };

    useEffect(() => {
        const map = mapRef.current?.getMap();
        if (!map) {
            return;
        }

        if (map.isStyleLoaded()) {
            updateRoute();
        } else {
            map.on('style.load', () => {
                updateRoute();
            });
        }
    }, [mapRef, routeCoordinates]);

    useEffect(() => {
        const map = mapRef.current?.getMap();
        if (map) {
            if (endPoint) {
                markerEnd.setLngLat(endPoint);
                markerEnd.addTo(map);
            } else {
                markerEnd.remove();
            }
        }
    }, [endPoint]);

    return <></>;
}