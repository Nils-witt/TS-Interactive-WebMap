/*
 * ApiProvider.ts
 * ---------------
 * Remote API client used to load map styles, overlays and named objects from server.
 * Exports: ApiProvider singleton
 * Purpose: wrap fetch calls and present a StorageInterface-like API to the app.
 */

import {MapItem} from '../enitities/MapItem.ts';
import {DataProvider} from './DataProvider';
import {GlobalEventHandler} from './GlobalEventHandler';
import {MapOverlay} from '../enitities/MapOverlay.ts';
import {MapBaseLayer} from '../enitities/MapBaseLayer.ts';
import type {StorageInterface} from './StorageInterface.ts';
import {MapGroup} from '../enitities/MapGroup.ts';
import {Unit} from '../enitities/Unit.ts';
import type {ApiResponseStruct, MapItemStruct} from './structs/ApiResponseStruct.ts';


export class ApiProviderEvent extends Event {
    eventType: ApiProviderEventTypes;
    data: object;

    constructor(eventType: ApiProviderEventTypes, data: object) {
        super(eventType);
        this.eventType = eventType;
        this.data = data;
    }
}

export enum ApiProviderEventTypes {
    LOGIN_SUCCESS = 'login-success',
    LOGIN_FAILURE = 'login-failure',
    UNAUTHORIZED = 'unauthorized'
}


export class ApiProvider implements StorageInterface {

    private static instance: ApiProvider;

    private constructor() { /* empty */
    }

    setUp(): Promise<void> {
        throw new Error('Method not implemented.');
    }

    saveOverlay(overlay: MapOverlay): Promise<MapOverlay> {
        throw new Error(`Method not implemented: saveOverlays ${overlay.getId()}`,);
    }

    loadOverlay(id: string): Promise<MapOverlay | null> {
        throw new Error('Method not implemented: loadOverlay ' + id);
    }

    loadAllOverlays(): Promise<Record<string, MapOverlay>> {


        return new Promise<Record<string, MapOverlay>>(resolve => {
            const overlays: Record<string, MapOverlay> = {};

            try {
                const url = DataProvider.getInstance().getApiUrl() + '/map/overlays';
                this.fetchData(url)
                    .then(data => {
                        if (data == null || data._embedded == undefined|| data._embedded.mapOverlayList == undefined ) {
                            resolve(overlays);
                            return;
                        }
                        for (const layer of data._embedded.mapOverlayList) {
                            overlays[layer.id] = MapOverlay.of({
                                id: layer.id,
                                name: layer.name,
                                url: layer.fullTileUrl,
                                layerVersion: layer.layerVersion,
                                description: '',
                                order: 0,
                                opacity: 1.0
                            });
                        }
                        resolve(overlays);
                    })
                    .catch(e => {
                        console.error('Error fetching overlay layers:', e);
                    });
            } catch (error) {
                console.error('Error fetching overlay layers:', error);
            }
        });

    }

    deleteOverlay(id: string): Promise<boolean> {
        throw new Error(`Method not implemented. deleteOverlay ${id}`);
    }

    saveMapStyle(mapStyle: MapBaseLayer): Promise<MapBaseLayer> {
        throw new Error(`Method not implemented. saveMapStyle: ${mapStyle.getID()}`);
    }

    loadMapStyle(id: string): Promise<MapBaseLayer | null> {
        throw new Error(`Method not implemented. loadMapStyle: ${id}`);
    }

    loadAllMapStyles(): Promise<Record<string, MapBaseLayer>> {

        return new Promise<Record<string, MapBaseLayer>>(resolve => {
            const mapStyles: Record<string, MapBaseLayer> = {};
            const url = DataProvider.getInstance().getApiUrl() + '/map/baselayers';
            this.fetchData(url)
                .then(data => {
                    if (data == null || data._embedded == undefined|| data._embedded.mapBaseLayerList == undefined ) {
                        resolve(mapStyles);
                        return;
                    }
                    for (const layer of data._embedded.mapBaseLayerList) {
                        mapStyles[layer.id] = MapBaseLayer.of({
                            id: layer.id,
                            name: layer.id,
                            url: layer.url
                        });
                        const layerUrl = new URL(layer.url);
                        new BroadcastChannel('setMapServicesBase').postMessage(
                            {
                                url: layerUrl.protocol + '//' + layerUrl.hostname
                            }
                        );
                    }
                    resolve(mapStyles);
                })
                .catch(e => {
                    console.error('Error fetching overlay layers:', e);
                });
        });
    }

    deleteMapStyle(id: string): Promise<void> {
        throw new Error(`Method not implemented. deleteMapStyle: ${id}`);
    }

    saveNamedGeoReferencedObject(namedGeoReferencedObject: MapItem): Promise<MapItem> {
        throw new Error(`Method not implemented. saveNamedGeoReferencedObject: ${namedGeoReferencedObject.getId()}`);
    }

    loadNamedGeoReferencedObject(id: string): Promise<MapItem | null> {
        throw new Error(`Method not implemented. loadNamedGeoReferencedObject: ${id}`);
    }

    loadAllNamedGeoReferencedObjects(): Promise<Record<string, MapItem>> {
        return new Promise<Record<string, MapItem>>(resolve => {
            const items: Record<string, MapItem> = {};

            const url = DataProvider.getInstance().getApiUrl() + '/map/items';
            this.fetchData(url)
                .then(data => {
                    if (data == null || data._embedded == undefined ||data._embedded.mapItemList == undefined ) {
                        resolve(items);
                        return;
                    }
                    for (const item of data._embedded.mapItemList) {
                        items[item.id] = MapItem.of({
                            id: item.id,
                            name: item.name,
                            latitude: item.position.latitude,
                            longitude: item.position.longitude,
                            zoomLevel: 18,
                            symbol: null,
                            show_on_map: false,
                            groupId: null
                        });
                    }
                    resolve(items);
                })
                .catch(e => {
                    console.error('Error fetching overlay layers:', e);
                });
        });
    }

    deleteNamedGeoReferencedObject(id: string): Promise<void> {
        throw new Error(`Method not implemented. deleteNamedGeoReferencedObject: ${id}`);
    }

    public static getInstance(): ApiProvider {
        if (!ApiProvider.instance) {
            ApiProvider.instance = new ApiProvider();
        }
        return ApiProvider.instance;
    }


    public async testLogin(): Promise<void> {
        const url = DataProvider.getInstance().getApiUrl() + '/token';
        const headers = new Headers();
        headers.append('Authorization', `Bearer ${DataProvider.getInstance().getApiToken()}`);

        const requestOptions = {
            method: 'GET',
            headers: headers,
        };
        try {
            const res = await fetch(url, requestOptions);
            if (res.status == 401) {
                this.notifyListeners(ApiProviderEventTypes.UNAUTHORIZED, {message: 'Unauthorized access - check your token.'});
            }
        } catch (e) {
            console.error('Error preparing request options:', e);
        }
    }


    public async login(username: string, password: string): Promise<void> {
        const url = DataProvider.getInstance().getApiUrl() + '/token';
        const myHeaders = new Headers();
        myHeaders.append('Content-Type', 'application/json');

        const raw = JSON.stringify({username, password});

        const requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: raw
        };

        try {
            const res = await fetch(url, requestOptions);
            if (res.ok) {
                const data: { token: string } = await res.json() as { token: string };
                DataProvider.getInstance().setApiToken(data.token); // Store the token for future requests
                this.notifyListeners(ApiProviderEventTypes.LOGIN_SUCCESS, {message: 'Login successful'});
            } else {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
        } catch (e) {
            console.error('Error preparing request options:', e);
            throw e;
        }
    }

    public logout(): void {
        localStorage.removeItem('apiToken');
        window.location.reload();
    }

    private async callApi(url: string, method: string, headers: Headers = new Headers(), body?: object): Promise<ApiResponseStruct | null> {

        if (DataProvider.getInstance().getApiToken()) {
            headers.append('Authorization', `Bearer ${DataProvider.getInstance().getApiToken()}`);
        }

        const requestOptions: RequestInit = {
            method: method,
            headers: headers
        };
        if (body) {
            requestOptions['body'] = JSON.stringify(body);
            headers.append('Content-Type', 'application/json');
        }

        const response = await fetch(url, requestOptions);
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                this.notifyListeners(ApiProviderEventTypes.UNAUTHORIZED, {message: `Unauthorized access - check your token. ${response.status}`});
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return await response.json();
        } catch (e) {
            console.error('Error parsing JSON:', e);
            return null;
        }
    }

    public async fetchData(url: string): Promise<ApiResponseStruct | null> {
        return this.callApi(url, 'GET');
    }

    public async createMapItem(item: {
        name: string,
        latitude: number,
        longitude: number,
        zoomLevel?: number,
        showOnMap?: boolean,
        groupId?: string
    }): Promise<MapItem | null> {

        const data = {
            name: item.name,
            position: {
                latitude: item.latitude,
                longitude: item.longitude
            }
        };

        const url = DataProvider.getInstance().getApiUrl() + '/map/items';

        const response = await this.callApi(url, 'POST', new Headers(), data) as never as MapItemStruct;
        if (response != null) {
            return MapItem.of({
                id: response.id,
                name: response.name,
                latitude: response.position.latitude,
                longitude: response.position.longitude,
                zoomLevel: item.zoomLevel ?? 18,
                symbol: null,
                show_on_map: item.showOnMap ?? false,
                groupId: item.groupId ?? null
            });
        }
        throw Error('Failed to create map item');
    }

    public async saveMapItem(item: MapItem): Promise<MapItem | null> {
        const data = {
            name: item.getName(),
            position: {
                latitude: item.getLatitude(),
                longitude: item.getLongitude()
            }
        };

        const url = DataProvider.getInstance().getApiUrl() + '/map/items';

        const response = await this.callApi(url, 'POST', new Headers(), data) as never as MapItemStruct;
        if (response != null) {
            return MapItem.of({
                id: response.id,
                name: response.name,
                latitude: response.position.latitude,
                longitude: response.position.longitude,
                zoomLevel: 16,
                symbol: null,
                show_on_map: false,
                groupId: null
            });
        }
        throw Error('Failed to create map item');
    }

    public async getOverlayTiles(overlay: MapOverlay): Promise<string[]> {
        let url: URL | undefined;
        if (overlay.getUrl().startsWith('http')) {
            url = new URL(overlay.getUrl().substring(0, overlay.getUrl().search('{z}')));
        } else {
            url = new URL(overlay.getUrl().substring(0, overlay.getUrl().search('{z}')), window.location.origin); // Ensure the URL is absolute
        }

        const response = await fetch(url.href + '/index.json?accesstoken=' + DataProvider.getInstance().getApiToken(), {
            cache: 'no-store',
            headers: {
                'cache': 'no-store',
                'cache-control': 'no-cache',
            },
        });
        if (response.ok) {
            const data = await response.json() as Record<string, Record<string, string[]>>;
            const filelist: string[] = [];

            for (const z of Object.keys(data)) {
                for (const x of Object.keys(data[z])) {
                    const yVals = Object.keys(data[z][x]);

                    for (let k = 0; k < yVals.length; k++) {
                        const y = data[z][x][k];
                        const tileUrl = `${url.href}${z}/${x}/${y}`;
                        filelist.push(tileUrl);
                    }
                }
            }
            return filelist;
        }

        return [];
    }

    private notifyListeners(event: ApiProviderEventTypes, data: { message: string }): void {
        GlobalEventHandler.getInstance().emit(event, new ApiProviderEvent(event, data));
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    replaceOverlays(_overlays: MapOverlay[]): Promise<void> {
        throw new Error('Not implemented');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    replaceMapStyles(_mapStyles: MapBaseLayer[]): Promise<void> {
        throw new Error('Not implemented');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    replaceNamedGeoReferencedObjects(_namedGeoReferencedObjects: MapItem[]): Promise<void> {
        throw new Error('replaceNamedGeoReferencedObjects not implemented');
    }

    loadMapGroup(id: string): Promise<MapGroup | null> {
        throw new Error('loadMapGroup not implemented: ' + id);
    }

    loadAllMapGroups(): Promise<Record<string, MapGroup>> {
        throw new Error('loadAllMapGroups not implemented');
    }

    saveMapGroup(mapGroup: MapGroup): Promise<MapGroup> {
        throw new Error(`Method not implemented. saveMapGroup: ${mapGroup.getID()}`);
    }

    replaceMapGroups(mapGroups: MapGroup[]): Promise<void> {
        throw new Error('Not Available on this Provider : replaceMapGroups ' + mapGroups.length);
    }

    deleteMapGroup(id: string): Promise<void> {
        throw new Error(`Method not implemented. deleteMapGroup: ${id}`);
    }

    loadUnit(id: string): Promise<Unit | null> {
        throw new Error('loadMapGroup not implemented: ' + id);
    }

    loadAllUnits(): Promise<Record<string, Unit>> {
        return new Promise<Record<string, Unit>>(resolve => {
            const units: Record<string, Unit> = {};
            const url = DataProvider.getInstance().getApiUrl() + '/units';

            this.fetchData(url)
                .then(data => {
                    if (data == null || data._embedded == undefined|| data._embedded.unitList == undefined ) {
                        resolve(units);
                        return;
                    }
                    for (const rawUnit of data._embedded.unitList){
                        units[rawUnit.id] = Unit.of({
                            id: rawUnit.id,
                            name: rawUnit.name,
                            latitude: rawUnit.position.latitude,
                            longitude: rawUnit.position.longitude,
                            symbol: null,
                            unit_status: rawUnit.status,
                            unit_status_timestamp: new Date().toISOString(),
                            route: null,
                        });
                    }
                    resolve(units);
                })
                .catch(e => {
                    console.error('Error fetching overlay layers:', e);
                });
        });
    }

    saveUnit(unit: Unit): Promise<Unit> {
        throw new Error(`Method not implemented. saveMapGroup: ${unit.getId()}`);
    }

    replaceUnits(units:Unit[]): Promise<void> {
        throw new Error('Not Available on this Provider : replaceUnits ' + units.length);
    }

    deleteUnit(id: string): Promise<void> {
        throw new Error(`Method not implemented. deleteUnit: ${id}`);
    }



}

