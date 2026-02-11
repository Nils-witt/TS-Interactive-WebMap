import {DataProvider} from './DataProvider.ts';
import {ApplicationLogger} from '../ApplicationLogger.ts';
import {Unit} from '../enitities/Unit.ts';
import type {MapBaseLayerStruct, MapItemStruct, MapOverlayStruct, UnitStruct} from './structs/ApiResponseStruct.ts';
import {MapOverlay} from '../enitities/MapOverlay.ts';
import {MapBaseLayer} from '../enitities/MapBaseLayer.ts';
import {MapItem} from '../enitities/MapItem.ts';


export class WebSocketProvider {


    constructor() { /* empty */
    }

    getConnectionURL() {
        const base = DataProvider.getInstance().getApiUrl().replace('http', 'ws');
        const token = DataProvider.getInstance().getApiToken();

        return base + '/ws?token=' + token;
    }


    updateModel(topic: string, data: { entity: never }) {
        const dataProvider = DataProvider.getInstance();

        ApplicationLogger.info('received update for topic: ' + topic, {service: 'WebSocket'});
        const modelType = topic.replace('/updates/entities/', '');
        const parts = modelType.split('/');
        const entityType = parts[0];

        if (entityType === 'unit') {
            const unitData = data.entity as UnitStruct;
            const item = new Unit({
                id: unitData.id,
                latitude: unitData.position.latitude,
                longitude: unitData.position.longitude,
                name: unitData.name,
                unit_status: unitData.status,
                unit_status_time: unitData.updatedAt,
                symbol: unitData.icon as never
            });
            dataProvider.addUnit(item);
        } else if (entityType === 'mapoverlay') {
            const overlayData = data.entity as MapOverlayStruct;
            const item = new MapOverlay(
                {
                    id: overlayData.id,
                    name: overlayData.name,
                    url: overlayData.fullTileUrl,
                    layerVersion: overlayData.layerVersion,
                }
            );
            dataProvider.addOverlay(item);
        } else if (entityType === 'mapbaselayer') {
            const layerData = data.entity as MapBaseLayerStruct;
            const item = new MapBaseLayer({
                id: layerData.id,
                name: layerData.name,
                url: layerData.url,
            });
            dataProvider.setMapStyle(item);
        } else if (entityType === 'mapitem') {
            const itemData = data.entity as MapItemStruct;
            const item = new MapItem({
                id: itemData.id,
                name: itemData.name,
                latitude: itemData.position.latitude,
                longitude: itemData.position.longitude,
            });
            dataProvider.addMapItem(item);

        } else {
            console.log('Unknown entity type:', entityType);
        }
    }

    start() {
        ApplicationLogger.info('WebSocket Started', {service: 'WebSocket'});

        const socket = new WebSocket(this.getConnectionURL());
        const entityTypes = ['unit', 'mapoverlay', 'mapbaselayer', 'mapitem'];
        socket.onopen = (event) => {
            ApplicationLogger.info('WebSocket connection opened', {service: 'WebSocket', event: event});
            for (const entityType of entityTypes) {
                socket.send('SUBSCRIBE /updates/entities/' + entityType);
            }
        };
        socket.onmessage = (event) => {
            if (event.data == 'ping') {
                return;
            }
            ApplicationLogger.debug('WebSocket message received: ' + event.data, {service: 'WebSocket', event: event});
            try {
                const data = JSON.parse(event.data as string) as { topic: string, payload: never };
                if (data.topic.startsWith('/updates/entities/')) {
                    this.updateModel(data.topic, data.payload);
                }
            } catch {
                ApplicationLogger.info('Received message: ' + event.data, {service: 'WebSocket'});
            }
        };
        socket.onclose = (event) => {
            this.start();
            setTimeout(() => {
                console.log('Reconnecting WebSocket...', event);
            }, 1000);
        };
        socket.onerror = (event) => {
            console.error('WebSocket error:', event);
        };
    }

}