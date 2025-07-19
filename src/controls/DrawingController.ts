import {Map as MapLibreMap, Marker} from 'maplibre-gl';
import {type DataProvider, DataProviderEventType} from "../dataProviders/DataProvider.ts";
import type {NamedGeoReferencedObject} from "../enitites/NamedGeoReferencedObject.ts";
import {DisplayHelper} from "../DisplayHelper.ts";

export class DrawingController {

    private map: MapLibreMap | undefined;
    private markers: Map<string, Marker> = new Map<string, Marker>();

    public constructor(dataProvider: DataProvider) {

        dataProvider.on(DataProviderEventType.MAP_LOCATIONS_UPDATED, (event) => {
            let data = event.data as NamedGeoReferencedObject[];
            for (const item of data) {
                if (this.markers.has(item.id)) {
                    // If the marker already exists, update its position
                    const marker = this.markers.get(item.id);
                    if (marker) {
                        marker.setLngLat([item.longitude, item.latitude]);
                    }
                } else {
                    let newMarker: Marker;
                    if (item.symbol) {
                        newMarker = new Marker({element: DisplayHelper.createTacMarker(item.symbol)})
                            .setLngLat([item.longitude, item.latitude]);
                    }else {
                        newMarker = new Marker()
                            .setLngLat([item.longitude, item.latitude]);
                    }
                    // If the marker does not exist, create a new one

                    this.markers.set(item.id, newMarker);
                    if (this.map && item.showOnMap !== false) {
                        newMarker.addTo(this.map);
                    }
                }
            }
        });
    }

    public addTo(map: MapLibreMap): void {
        this.map = map;
        for (const marker of this.markers.values()) {
            marker.addTo(map);
        }
    }

    public remove(): void {
        for (const marker of this.markers.values()) {
            marker.remove();
        }
        this.map = undefined;
    }
}