import { DataProvider } from './DataProvider.ts';
import { ApplicationLogger } from '../ApplicationLogger.ts';
import { Unit } from '../enitities/Unit.ts';
import type { MapBaseLayerStruct, MapItemStruct, MapOverlayStruct, UnitStruct } from './structs/ApiResponseStruct.ts';
import { MapOverlay } from '../enitities/MapOverlay.ts';
import { MapBaseLayer } from '../enitities/MapBaseLayer.ts';
import { MapItem } from '../enitities/MapItem.ts';
import { DatabaseProvider } from './DatabaseProvider.ts';
import { Notification } from '../enitities/Notification.ts';
/**
 * ToDo: Add update handling for map groups, users and photos if needed.
 * ToDo: Add error handling and reconnection logic for WebSocket connection. Including preauthentication disconnect.
 */



export class WebSocketProvider {
    private static instance: WebSocketProvider | null = null;

    private constructor() { 
    }

    private lastMessageRecived: number | null = null;
    private socket: WebSocket | null = null;
    private pingInterval: NodeJS.Timeout | null = null;

    private databaseProvider: DatabaseProvider | null = null;
    private dataProvider: DataProvider = DataProvider.getInstance();


    public static getInstance(): WebSocketProvider {
        if (!WebSocketProvider.instance) {
            WebSocketProvider.instance = new WebSocketProvider();
        }
        return WebSocketProvider.instance;
    }
    public setDatabaseProvider(databaseProvider: DatabaseProvider) {
        this.databaseProvider = databaseProvider;
    }

    getConnectionURL() {
        const base = DataProvider.getInstance().getApiUrl().replace('http', 'ws');
        const token = DataProvider.getInstance().getApiToken();

        return base + '/ws?token=' + token;
    }


    unitChangedSideEffects(oldUnit: Unit, newUnit: Unit){
        console.log('SideEffects', oldUnit, newUnit);

        if(newUnit.getStatus() != oldUnit.getStatus()){
            const notification = new Notification({
                id: window.crypto.randomUUID() as string,
                title: newUnit.getName(),
                timestamp: new Date().getTime(),
                content: `Status: ${oldUnit.getStatus()} -> ${newUnit.getStatus()}`
            });
            if(this.databaseProvider){
                void this.databaseProvider.saveNotification(notification);
            }
            this.dataProvider.addNotification(notification);
        }

    }


    updateModel(topic: string, data: { entity: never, changeType: 'CREATED' | 'UPDATED' | 'DELETED' }) {
        ApplicationLogger.info('received update for topic: ' + topic, { service: 'WebSocket' });
        const modelType = topic.replace('/updates/entities/', '');
        const parts = modelType.split('/');
        const entityType = parts[0].toLowerCase();
        const action = data.changeType;

        if (entityType === 'unit') {
            if (action === 'DELETED') {
                const itemId = (data.entity as UnitStruct).id;
                this.dataProvider.removeUnit(itemId);

                if(this.databaseProvider) {
                    void this.databaseProvider.deleteUnit(itemId);
                }
                return;
            }
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
            this.unitChangedSideEffects(this.dataProvider.getAllUnits().get(item.getId()) as Unit,item);
            this.dataProvider.addUnit(item);
            if(this.databaseProvider) {
                void this.databaseProvider.saveUnit(item);
            }
        } else if (entityType === 'mapoverlay') {
            if (action === 'DELETED') {
                const itemId = (data.entity as MapOverlayStruct).id;
                this.dataProvider.removeMapOverlay(itemId);
                if(this.databaseProvider) {
                    void this.databaseProvider.deleteMapOverlay(itemId);
                }
                return;
            }
            const overlayData = data.entity as MapOverlayStruct;
            const item = new MapOverlay(
                {
                    id: overlayData.id,
                    name: overlayData.name,
                    url: overlayData.fullTileUrl,
                    layerVersion: overlayData.layerVersion,
                }
            );
            this.dataProvider.addMapOverlay(item);

            if(this.databaseProvider) {
                void this.databaseProvider.saveMapOverlay(item);
            }
        } else if (entityType === 'mapbaselayer') {
            if (action === 'DELETED') {
                const itemId = (data.entity as MapBaseLayerStruct).id;
                if(this.databaseProvider) {
                    void this.databaseProvider.deleteMapStyle(itemId);
                }
                return;
            }
            const layerData = data.entity as MapBaseLayerStruct;
            const item = new MapBaseLayer({
                id: layerData.id,
                name: layerData.name,
                url: layerData.url,
            });
            this.dataProvider.setMapStyle(item);
            if(this.databaseProvider) {
                void this.databaseProvider.saveMapStyle(item);
            }
        } else if (entityType === 'mapitem') {
            if (action === 'DELETED') {
                const itemId = (data.entity as MapItemStruct).id;
                this.dataProvider.deleteMapItem(itemId);
                if(this.databaseProvider) {
                    void this.databaseProvider.deleteMapItem(itemId);
                }
                return;
            }
            const itemData = data.entity as MapItemStruct;
            const item = new MapItem({
                id: itemData.id,
                name: itemData.name,
                latitude: itemData.position.latitude,
                longitude: itemData.position.longitude,
                zoomLevel: itemData.zoomLevel,
                groupId: itemData.mapGroupId
            });

            this.dataProvider.addMapItem(item);
            if(this.databaseProvider) {
                void this.databaseProvider.saveMapItem(item);
            }
        } else {
            console.log('Unknown entity type:', entityType);
        }
    }

    start() {
        ApplicationLogger.info('WebSocket Started', { service: 'WebSocket' });
        if (this.socket) {
            ApplicationLogger.info('WebSocket is already running', { service: 'WebSocket' });
            return;
        }

        this.socket = new WebSocket(this.getConnectionURL());
        const entityTypes = ['unit', 'mapoverlay', 'mapbaselayer', 'mapitem'];
        this.socket.onopen = (event) => {
            ApplicationLogger.info('WebSocket connection opened', { service: 'WebSocket', event: event });
            for (const entityType of entityTypes) {
                this.socket!.send('SUBSCRIBE /updates/entities/' + entityType);
            }
            if (this.lastMessageRecived != null) {
                ApplicationLogger.info('Requesting updates since last message received: ' + new Date(this.lastMessageRecived).toISOString(), { service: 'WebSocket' });
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
            if (event.data == 'ping' || event.data == 'pong') {
                return;
            }
            this.lastMessageRecived = Date.now();
            //ApplicationLogger.debug('WebSocket message received: ' + event.data, { service: 'WebSocket', event: event });
            if ((event.data as string).startsWith('Subscribed') || (event.data as string).startsWith('REQUEST_UPDATES_SINCE')) {
                ApplicationLogger.info('WebSocket subscription confirmed: ' + event.data, { service: 'WebSocket' });
                return;
            }
            try {
                const data = JSON.parse(event.data as string) as { topic: string, payload: never };
                if (data.topic.startsWith('/updates/entities/')) {
                    this.updateModel(data.topic, data.payload);
                }
            } catch {
                ApplicationLogger.info('Received message: ' + event.data, { service: 'WebSocket' });
            }
        };
        this.socket.onclose = (event) => {
            this.socket = null;
            ApplicationLogger.info('WebSocket connection closed', { service: 'WebSocket', event: event });
            this.start();
        };
        this.socket.onerror = (event) => {
            console.error('WebSocket error:', event);
        };
    }

    public stop() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
        ApplicationLogger.info('WebSocket Stopped', { service: 'WebSocket' });
    }
}