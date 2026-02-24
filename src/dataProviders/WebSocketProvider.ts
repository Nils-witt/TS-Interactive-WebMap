import {DataProvider} from './DataProvider.ts';
import {ApplicationLogger} from '../ApplicationLogger.ts';
import {Unit} from '../enitities/Unit.ts';
import type {MapBaseLayerStruct, MapItemStruct, MapOverlayStruct, UnitStruct} from './structs/ApiResponseStruct.ts';
import {MapOverlay} from '../enitities/MapOverlay.ts';
import {MapBaseLayer} from '../enitities/MapBaseLayer.ts';
import {MapItem} from '../enitities/MapItem.ts';
import {DatabaseProvider} from './DatabaseProvider.ts';


export class WebSocketProvider {


    constructor() { /* empty */
    }

    private lastMessageRecived: number | null = null;
    private socket: WebSocket | null = null;
    private pingInterval: NodeJS.Timeout | null = null;

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
        const entityType = parts[0].toLowerCase();

        if (entityType === 'unit') {
            const unitData = data.entity as UnitStruct;
            const item = new Unit({
                id: unitData.id,
                position: {
                    latitude: unitData.position.latitude,
                    longitude: unitData.position.longitude,
                    accuracy: unitData.position.accuracy,
                    timestamp: unitData.position.timestamp
                },
                name: unitData.name,
                unit_status: unitData.status,
                symbol: unitData.icon as never
            });
            dataProvider.addUnit(item);
            void DatabaseProvider.getInstance().then(instance => {
                void instance.saveUnit(item);
            });
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

        this.socket = new WebSocket(this.getConnectionURL());
        const entityTypes = ['unit', 'mapoverlay', 'mapbaselayer', 'mapitem'];
        this.socket.onopen = (event) => {
            ApplicationLogger.info('WebSocket connection opened', {service: 'WebSocket', event: event});
            for (const entityType of entityTypes) {
                this.socket!.send('SUBSCRIBE /updates/entities/' + entityType);
            }
            if (this.lastMessageRecived != null) {
                ApplicationLogger.info('Requesting updates since last message received: ' + new Date(this.lastMessageRecived).toISOString(), {service: 'WebSocket'});
                this.socket!.send('REQUEST_UPDATES_SINCE ' + this.lastMessageRecived);
            }
            if (this.pingInterval) {
                clearInterval(this.pingInterval);
            }
            this.pingInterval = setInterval(() => {
                if (this.socket?.readyState === WebSocket.OPEN) {
                    this.socket.send('ping');
                }
            }, 3000);
        };
        this.socket.onmessage = (event) => {
            if (event.data == 'ping') {
                return;
            }
            this.lastMessageRecived = Date.now();
            ApplicationLogger.debug('WebSocket message received: ' + event.data, {service: 'WebSocket', event: event});
            if ((event.data as string).startsWith('Subscribed') || (event.data as string).startsWith('REQUEST_UPDATES_SINCE')) {
                ApplicationLogger.info('WebSocket subscription confirmed: ' + event.data, {service: 'WebSocket'});
                return;
            }
            try {
                const data = JSON.parse(event.data as string) as { topic: string, payload: never };
                if (data.topic.startsWith('/updates/entities/')) {
                    this.updateModel(data.topic, data.payload);
                }
            } catch {
                ApplicationLogger.info('Received message: ' + event.data, {service: 'WebSocket'});
            }
        };
        this.socket.onclose = (event) => {
            this.start();
            setTimeout(() => {
                console.log('Reconnecting WebSocket...', event);
            }, 1000);
        };
        this.socket.onerror = (event) => {
            console.error('WebSocket error:', event);
        };
    }

}