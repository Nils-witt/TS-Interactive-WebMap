import {DataProvider} from './DataProvider.ts';
import {NamedGeoReferencedObject} from '../enitities/NamedGeoReferencedObject.ts';
import {MapStyle} from '../enitities/MapStyle.ts';
import {MapGroup} from '../enitities/MapGroup.ts';
import {Overlay} from '../enitities/Overlay.ts';
import type {DBRecord} from '../enitities/Entity.ts';


export class WebSocketProvider {


    constructor() { /* empty */
    }

    getConnectionURL() {
        const base = DataProvider.getInstance().getApiUrl().replace('http', 'ws');
        const token = DataProvider.getInstance().getApiToken();

        return base + '/ws/?token=' + token;
    }


    updateModel(modelType: string, data: object) {
        console.log('WebSocket updateModel called for', modelType, data);
        const dataProvider = DataProvider.getInstance();

        if (modelType === 'NamedGeoReferencedItem') {
            const item = NamedGeoReferencedObject.of(data as DBRecord);
            dataProvider.addMapItem(item);
        } else if (modelType === 'MapStyle') {
            const item = MapStyle.of(data as DBRecord);
            dataProvider.setMapStyle(item);
        } else if (modelType === 'MapGroup') {
            const item = MapGroup.of(data as DBRecord);
            dataProvider.addMapGroup(item);
        } else if (modelType === 'MapOverlay') {
            const item = Overlay.of(data as DBRecord);
            dataProvider.addOverlay(item);
        } else {
            console.log('Unknown model type:', modelType);
        }
    }

    start() {
        console.log('WebSocket Started');

        const socket = new WebSocket(this.getConnectionURL());

        socket.onopen = (event) => {
            console.log('WebSocket connection opened', event);
        };
        socket.onmessage = (event) => {
            console.log('WebSocket message received:', event.data);
            try {
                const data = JSON.parse(event.data as string) as { event: string, model_type: string, data: object };
                if (data.event === 'model.update') {
                    this.updateModel(data.model_type, data.data);
                }
            } catch (e) {
                console.error('Error parsing JSON WebSocket message:', e);
                /* empty */
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