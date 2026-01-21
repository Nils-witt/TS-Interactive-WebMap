import {DataProvider} from './DataProvider.ts';
import {NamedGeoReferencedObject} from '../enitities/NamedGeoReferencedObject.ts';
import {MapStyle} from '../enitities/MapStyle.ts';
import {MapGroup} from '../enitities/MapGroup.ts';
import {Overlay} from '../enitities/Overlay.ts';
import type {DBRecord} from '../enitities/Entity.ts';
import {ApplicationLogger} from '../ApplicationLogger.ts';
import {Unit} from '../enitities/Unit.ts';


export class WebSocketProvider {


    constructor() { /* empty */
    }

    getConnectionURL() {
        const base = DataProvider.getInstance().getApiUrl().replace('http', 'ws');
        const token = DataProvider.getInstance().getApiToken();

        return base + '/ws?token=' + token;
    }


    updateModel(modelType: string, data: object) {
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
        } else if (modelType === 'Unit') {
            const item = Unit.of(data as DBRecord);
            dataProvider.addUnit(item);
        } else {
            console.log('Unknown model type:', modelType);
        }
    }

    start() {
        ApplicationLogger.info('WebSocket Started', {service: 'WebSocket'});

        const socket = new WebSocket(this.getConnectionURL());

        socket.onopen = (event) => {
            ApplicationLogger.info('WebSocket connection opened', {service: 'WebSocket', event: event});
        };
        socket.onmessage = (event) => {
            ApplicationLogger.debug('WebSocket message received: ' + event.data, {service: 'WebSocket', event: event});
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