/*
 * ApiProvider.ts
 * ---------------
 * Remote API client used to load map styles, overlays and named objects from server.
 * Exports: ApiProvider singleton
 * Purpose: wrap fetch calls and present a StorageInterface-like API to the app.
 */

import {NamedGeoReferencedObject} from '../enitities/NamedGeoReferencedObject';
import {DataProvider} from './DataProvider';
import type {TaktischesZeichen} from 'taktische-zeichen-core/dist/types/types';
import {GlobalEventHandler} from './GlobalEventHandler';
import {Overlay} from '../enitities/Overlay.ts';
import {MapStyle} from '../enitities/MapStyle.ts';
import type {StorageInterface} from './StorageInterface.ts';
import {MapGroup} from '../enitities/MapGroup.ts';
import {Unit} from "../enitities/Unit.ts";


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

    saveOverlay(overlay: Overlay): Promise<Overlay> {
        throw new Error(`Method not implemented: saveOverlays ${overlay.getId()}`,);
    }

    loadOverlay(id: string): Promise<Overlay | null> {
        return new Promise<Overlay | null>(resolve => {
            try {
                const url = DataProvider.getInstance().getApiUrl() + '/overlays/' + id + '/';

                this.fetchData(url)
                    .then(data => {
                        if (data) {
                            const overlay = Overlay.of({
                                id: (data as { id: string }).id,
                                name: (data as { name: string }).name,
                                url: (data as { url: string }).url,
                                description: (data as { description: string }).description,
                                order: 0,
                                opacity: 1.0
                            });
                            resolve(overlay);
                        } else {
                            resolve(null);
                        }
                    })
                    .catch(e => {
                        console.error('Error fetching overlay layer:', e);
                        resolve(null);
                    });
            } catch (error) {
                console.error('Error fetching overlay layer:', error);
                resolve(null);
            }
        });
    }

    loadAllOverlays(): Promise<Record<string, Overlay>> {


        return new Promise<Record<string, Overlay>>(resolve => {
            const overlays: Record<string, Overlay> = {};

            try {
                const url = DataProvider.getInstance().getApiUrl() + '/overlays/';
                this.fetchData(url)
                    .then(data => {
                        for (const layer of data as {
                            id: string,
                            name: string,
                            url: string,
                            description: string
                        }[]) {
                            overlays[layer.id] = Overlay.of({
                                id: layer.id,
                                name: layer.name,
                                url: layer.url,
                                description: layer.description,
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

    saveMapStyle(mapStyle: MapStyle): Promise<MapStyle> {
        throw new Error(`Method not implemented. saveMapStyle: ${mapStyle.getID()}`);
    }

    loadMapStyle(id: string): Promise<MapStyle | null> {
        throw new Error(`Method not implemented. loadMapStyle: ${id}`);
    }

    loadAllMapStyles(): Promise<Record<string, MapStyle>> {

        return new Promise<Record<string, MapStyle>>(resolve => {
            const mapStyles: Record<string, MapStyle> = {};

            const url = DataProvider.getInstance().getApiUrl() + '/styles/';


            this.fetchData(url)
                .then(data => {
                    for (const layer of data as {
                        id: string,
                        name: string,
                        url: string,
                        description: string
                    }[]) {
                        mapStyles[layer.id] = MapStyle.of({
                            id: layer.id,
                            name: layer.id,
                            url: layer.url
                        });
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

    saveNamedGeoReferencedObject(namedGeoReferencedObject: NamedGeoReferencedObject): Promise<NamedGeoReferencedObject> {
        throw new Error(`Method not implemented. saveNamedGeoReferencedObject: ${namedGeoReferencedObject.getId()}`);
    }

    loadNamedGeoReferencedObject(id: string): Promise<NamedGeoReferencedObject | null> {
        throw new Error(`Method not implemented. loadNamedGeoReferencedObject: ${id}`);
    }

    loadAllNamedGeoReferencedObjects(): Promise<Record<string, NamedGeoReferencedObject>> {
        return new Promise<Record<string, NamedGeoReferencedObject>>(resolve => {
            const items: Record<string, NamedGeoReferencedObject> = {};

            const url = DataProvider.getInstance().getApiUrl() + '/items/';
            this.fetchData(url)
                .then(data => {
                    for (const item of data as {
                        id: string,
                        name: string,
                        latitude: number,
                        longitude: number,
                        zoom_level: number,
                        symbol: never,
                        show_on_map: boolean,
                        group_id: number
                    }[]) {
                        items[item.id] = NamedGeoReferencedObject.of({
                            id: item.id,
                            name: item.name,
                            latitude: item.latitude,
                            longitude: item.longitude,
                            zoomLevel: item.zoom_level,
                            symbol: item.symbol,
                            show_on_map: item.show_on_map,
                            groupId: item.group_id
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
        const url = DataProvider.getInstance().getApiUrl() + '/token/verify/';
        const myHeaders = new Headers();
        myHeaders.append('Content-Type', 'application/json');

        const data = {
            token: DataProvider.getInstance().getApiUrl()
        };
        const requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: JSON.stringify(data)
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
        const url = DataProvider.getInstance().getApiUrl() + '/token/';
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
                const data: { access: string } = await res.json() as { access: string };
                DataProvider.getInstance().setApiToken(data.access); // Store the token for future requests
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

    private async callApi(url: string, method: string, headers: Headers = new Headers(), body?: object): Promise<object | null> {

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

    public async fetchData(url: string): Promise<object | null> {
        return this.callApi(url, 'GET');
    }

    public async createMapItem(item: {
        name: string,
        latitude: number,
        longitude: number,
        zoomLevel?: number,
        showOnMap?: boolean,
        groupId?: string
    }, updateDataProvider = true): Promise<NamedGeoReferencedObject | null> {
        const url = DataProvider.getInstance().getApiUrl() + '/items/';
        const method = 'POST';

        const data = {
            ...item
        };

        try {
            const resData = await this.callApi(url, method, new Headers(), data) as {
                id: string,
                name: string,
                latitude: number,
                longitude: number,
                zoom_level: number,
                show_on_map: boolean,
                group_id: string | null
            };
            const item = new NamedGeoReferencedObject({
                id: resData.id,
                name: resData.name,
                latitude: resData.latitude,
                longitude: resData.longitude,
                zoomLevel: resData.zoom_level,
                showOnMap: resData.show_on_map,
                groupId: resData.group_id || undefined
            });
            if (updateDataProvider) {
                DataProvider.getInstance().addMapItem(item);
            }
            return item;
        } catch (e) {
            console.error('Error preparing request options:', e);
        }
        return null;
    }

    public async saveMapItem(item: NamedGeoReferencedObject, updateDataProvider = true): Promise<NamedGeoReferencedObject | null> {
        const url = DataProvider.getInstance().getApiUrl() + `/items/${item.getId()}/`;
        const method = 'PUT';

        const data = item.record();
        data['group'] = item.getGroupId() ? `${DataProvider.getInstance().getApiUrl()}/map_groups/${item.getGroupId()}/` : null;

        try {
            const resData = await this.callApi(url, method, new Headers(), data) as {
                id: string,
                name: string,
                latitude: number,
                longitude: number,
                zoom_level: number,
                show_on_map: boolean,
                group_id: string | null
            };
            const item = new NamedGeoReferencedObject({
                id: resData.id,
                name: resData.name,
                latitude: resData.latitude,
                longitude: resData.longitude,
                zoomLevel: resData.zoom_level,
                showOnMap: resData.show_on_map,
                groupId: resData.group_id || undefined
            });
            if (updateDataProvider) {
                DataProvider.getInstance().addMapItem(item);
            }
            return item;
        } catch (e) {
            console.error('Error preparing request options:', e);
        }
        return null;
    }

    public async getOverlayTiles(overlay: Overlay): Promise<string[]> {
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
    replaceOverlays(_overlays: Overlay[]): Promise<void> {
        throw new Error('Not implemented');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    replaceMapStyles(_mapStyles: MapStyle[]): Promise<void> {
        throw new Error('Not implemented');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    replaceNamedGeoReferencedObjects(_namedGeoReferencedObjects: NamedGeoReferencedObject[]): Promise<void> {
        throw new Error('replaceNamedGeoReferencedObjects not implemented');
    }

    loadMapGroup(id: string): Promise<MapGroup | null> {
        throw new Error('loadMapGroup not implemented: ' + id);
    }

    loadAllMapGroups(): Promise<Record<string, MapGroup>> {
        return new Promise<Record<string, MapGroup>>(resolve => {
            const mapGroups: Record<string, MapGroup> = {};
            const url = DataProvider.getInstance().getApiUrl() + '/map_groups/';

            this.fetchData(url)
                .then(data => {
                    for (const rawGroup of data as {
                        id: string,
                        name: string,
                        description: string
                    }[]) {
                        mapGroups[rawGroup.id] = MapGroup.of({
                            id: rawGroup.id,
                            name: rawGroup.name,
                            description: rawGroup.description
                        });
                    }
                    resolve(mapGroups);
                })
                .catch(e => {
                    console.error('Error fetching overlay layers:', e);
                });
        });
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
            const url = DataProvider.getInstance().getApiUrl() + '/units/';

            this.fetchData(url)
                .then(data => {
                    for (const rawUnit of data as {
                        id: string,
                        name: string,
                        description: string,
                        latitude: number,
                        longitude: number,
                        symbol: TaktischesZeichen,
                        group_id: string | null
                    }[]) {
                        units[rawUnit.id] = Unit.of({
                            id: rawUnit.id,
                            name: rawUnit.name,
                            latitude: rawUnit.latitude,
                            longitude: rawUnit.longitude,
                            symbol: rawUnit.symbol,
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