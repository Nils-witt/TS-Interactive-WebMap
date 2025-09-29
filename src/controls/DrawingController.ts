import {Map as MapLibreMap, Marker} from 'maplibre-gl';
import {DataProviderEvent, DataProviderEventType} from "../dataProviders/DataProvider";
import type {NamedGeoReferencedObject} from "../enitities/NamedGeoReferencedObject";
import {DisplayHelper} from "../DisplayHelper";
import {GlobalEventHandler} from "../dataProviders/GlobalEventHandler";

export class DrawingController {

    private map: MapLibreMap | undefined;
    private markers: Map<string, Marker> = new Map<string, Marker>();

    public constructor() {

        GlobalEventHandler.getInstance().on(DataProviderEventType.MAP_ITEM_UPDATED, (e) => {
            const event = e as DataProviderEvent;
            let item = event.data as NamedGeoReferencedObject;

            if (this.markers.has(item.id)) {
                let marker = this.markers.get(item.id)!;

                if (item.symbol) {
                    DisplayHelper.updateTacMarker(marker.getElement()!, item.symbol);
                }
                marker.setLngLat([item.longitude, item.latitude]);

            } else {
                let newMarker: Marker;
                if (item.symbol) {
                    newMarker = new Marker({element: DisplayHelper.createTacMarker(item.symbol)});
                } else {
                    newMarker = new Marker()
                }
                newMarker.setLngLat([item.longitude, item.latitude]);

                this.markers.set(item.id, newMarker);
                if (this.map && item.showOnMap !== false) {
                    newMarker.addTo(this.map);
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