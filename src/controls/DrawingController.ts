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

            if (this.markers.has(item.getId())) {
                let marker = this.markers.get(item.getId())!;

                if (item.getSymbol()) {
                    DisplayHelper.updateTacMarker(marker.getElement()!, item.getSymbol());
                }
                marker.setLngLat([item.getLongitude(), item.getLatitude()]);

            } else {
                let newMarker: Marker;
                if (item.getSymbol()) {
                    newMarker = new Marker({element: DisplayHelper.createTacMarker(item.getSymbol())});
                } else {
                    newMarker = new Marker()
                }
                newMarker.setLngLat([item.getLongitude(), item.getLatitude()]);

                this.markers.set(item.getId(), newMarker);
                if (this.map && item.getShowOnMap() !== false) {
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