/*
 * ApiProvider.ts
 * ---------------
 * Remote API client used to load map styles, overlays and named objects from server.
 * Exports: ApiProvider singleton
 * Purpose: wrap fetch calls and present a StorageInterface-like API to the app.
 */

import { MapItem } from '../enitities/MapItem.ts';
import { DataProvider } from './DataProvider';
import { GlobalEventHandler } from './GlobalEventHandler';
import { MapOverlay } from '../enitities/MapOverlay.ts';
import { MapBaseLayer } from '../enitities/MapBaseLayer.ts';
import type { StorageInterface } from './StorageInterface.ts';
import { MapGroup } from '../enitities/MapGroup.ts';
import { Unit } from '../enitities/Unit.ts';
import type { ApiResponseStruct, MapItemStruct, PhotoStruct } from './structs/ApiResponseStruct.ts';
import { Photo } from '../enitities/Photo.ts';
import type { IPosition } from '../enitities/embeddables/EmbeddablePosition.ts';


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

    public static getInstance(): ApiProvider {
        if (!ApiProvider.instance) {
            ApiProvider.instance = new ApiProvider();
        }
        return ApiProvider.instance;
    }

    private notifyListeners(event: ApiProviderEventTypes, data: { message: string }): void {
        GlobalEventHandler.getInstance().emit(event, new ApiProviderEvent(event, data));
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
                this.notifyListeners(ApiProviderEventTypes.UNAUTHORIZED, { message: 'Unauthorized access - check your token.' });
            }
        } catch (e) {
            console.error('Error preparing request options:', e);
        }
    }


    public async login(username: string, password: string): Promise<void> {
        const url = DataProvider.getInstance().getApiUrl() + '/token';
        const myHeaders = new Headers();
        myHeaders.append('Content-Type', 'application/json');

        const raw = JSON.stringify({ username, password });

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
                this.notifyListeners(ApiProviderEventTypes.LOGIN_SUCCESS, { message: 'Login successful' });
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

    private async callApi(url: string, method: string, headers: Headers = new Headers(), body?: object): Promise<unknown> {

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
                this.notifyListeners(ApiProviderEventTypes.UNAUTHORIZED, { message: `Unauthorized access - check your token. ${response.status}` });
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        try {

            return await response.json();
        } catch (e) {
            console.error('Error parsing JSON:', e);
            return null;
        }
    }

    public async fetchData(url: string): Promise<unknown> {
        return this.callApi(url, 'GET');
    }

    //-- Load All
    loadAllUnits(): Promise<Record<string, Unit>> {
        return new Promise<Record<string, Unit>>((resolve, reject) => {
            const units: Record<string, Unit> = {};
            const url = DataProvider.getInstance().getApiUrl() + '/units';

            this.fetchData(url)
                .then(raw => {
                    const data = raw as ApiResponseStruct;
                    if (data == null || data._embedded == undefined || data._embedded.unitDtoList == undefined) {
                        return resolve(units);
                    }
                    for (const rawUnit of data._embedded.unitDtoList) {
                        units[rawUnit.id] = Unit.of({
                            id: rawUnit.id,
                            name: rawUnit.name,
                            pos_latitude: rawUnit.position.latitude,
                            pos_longitude: rawUnit.position.longitude,
                            pos_accuracy: rawUnit.position.accuracy,
                            pos_timestamp: rawUnit.position.timestamp,
                            symbol: rawUnit.icon as never,
                            unit_status: rawUnit.status,
                            unit_status_timestamp: new Date().toISOString(),
                            route: null,
                        });
                    }
                    return resolve(units);
                })
                .catch(e => {
                    return reject(new Error('Error fetching units', { cause: e }));
                });
        });
    }

    loadAllMapGroups(): Promise<Record<string, MapGroup>> {
        return new Promise<Record<string, MapGroup>>((resolve, reject) => {
            const groups: Record<string, MapGroup> = {};
            const url = DataProvider.getInstance().getApiUrl() + '/map/groups';

            this.fetchData(url)
                .then(raw => {
                    const data = raw as ApiResponseStruct;
                    if (data == null || data._embedded == undefined || data._embedded.mapGroupDtoList == undefined) {
                        return resolve(groups);
                    }
                    for (const rawUnit of data._embedded.mapGroupDtoList) {
                        groups[rawUnit.id] = MapGroup.of({
                            id: rawUnit.id,
                            name: rawUnit.name,
                        });
                    }
                    return resolve(groups);
                })
                .catch(e => {
                    return reject(new Error('Error fetching map groups', { cause: e }));
                });
        });
    }

    loadAllMapItems(): Promise<Record<string, MapItem>> {
        return new Promise<Record<string, MapItem>>((resolve, reject) => {
            const items: Record<string, MapItem> = {};

            const url = DataProvider.getInstance().getApiUrl() + '/map/items';
            this.fetchData(url)
                .then(raw => {
                    const data = raw as ApiResponseStruct;
                    if (data == null || data._embedded == undefined || data._embedded.mapItemDtoList == undefined) {
                        return resolve(items);
                    }
                    for (const item of data._embedded.mapItemDtoList) {

                        items[item.id] = MapItem.of({
                            id: item.id,
                            name: item.name,
                            latitude: item.position.latitude,
                            longitude: item.position.longitude,
                            zoomLevel: item.zoomLevel,
                            symbol: null,
                            show_on_map: false,
                            group_id: item.mapGroupId
                        });
                    }
                    return resolve(items);
                })
                .catch(e => {
                    return reject(new Error('Error fetching map items', { cause: e }));
                });
        });
    }

    loadAllMapStyles(): Promise<Record<string, MapBaseLayer>> {

        return new Promise<Record<string, MapBaseLayer>>((resolve, reject) => {
            const mapStyles: Record<string, MapBaseLayer> = {};
            const url = DataProvider.getInstance().getApiUrl() + '/map/baselayers';
            this.fetchData(url)
                .then(raw => {
                    const data = raw as ApiResponseStruct;
                    if (data == null || data._embedded == undefined || data._embedded.mapBaseLayerDtoList == undefined) {
                        return resolve(mapStyles);
                    }
                    for (const layer of data._embedded.mapBaseLayerDtoList) {
                        mapStyles[layer.id] = MapBaseLayer.of({
                            id: layer.id,
                            name: layer.id,
                            url: layer.url,
                            cacheUrl: layer.cacheUrl
                        });
                        new BroadcastChannel('addVectorCacheUrl').postMessage(
                            {
                                id: layer.id,
                                url: layer.cacheUrl
                            }
                        );
                    }
                    return resolve(mapStyles);
                })
                .catch(e => {
                    return reject(new Error('Error fetching base layers', { cause: e }));
                });
        });
    }

    loadAllMapOverlays(): Promise<Record<string, MapOverlay>> {
        return new Promise<Record<string, MapOverlay>>((resolve, reject) => {
            const overlays: Record<string, MapOverlay> = {};

            try {
                const url = DataProvider.getInstance().getApiUrl() + '/map/overlays';
                this.fetchData(url)
                    .then(raw => {
                        const data = raw as ApiResponseStruct;
                        if (data == null || data._embedded == undefined || data._embedded.mapOverlayDtoList == undefined) {
                            return resolve(overlays);
                        }
                        for (const layer of data._embedded.mapOverlayDtoList) {
                            overlays[layer.id] = MapOverlay.of({
                                id: layer.id,
                                name: layer.name,
                                url: layer.fullTileUrl,
                                layerVersion: layer.layerVersion,
                                description: '',
                                order: 0,
                                opacity: 1.0
                            });
                            new BroadcastChannel('addOverlayCacheUrl').postMessage(
                                {
                                    id: layer.id + '_' + layer.layerVersion,
                                    url: layer.fullTileUrl
                                });

                            new BroadcastChannel('removeOtherOverlayCaches').postMessage(
                                {
                                    id: layer.id,
                                    version: layer.layerVersion
                                });
                        
                        }
                        return resolve(overlays);
                    })
                    .catch(e => {
                        return reject(new Error('Error fetching overlay layers', { cause: e }));
                    });
            } catch (error) {
                return reject(new Error('Error fetching overlay layers', { cause: error }));
            }
        });

    }

    loadAllPhotos(): Promise<Record<string, Photo>> {
        return new Promise<Record<string, Photo>>((resolve, reject) => {
            const pictures: Record<string, Photo> = {};
            const url = DataProvider.getInstance().getApiUrl() + '/photos';

            this.fetchData(url)
                .then(raw => {
                    const data = raw as ApiResponseStruct;
                    if (data == null || data._embedded == undefined || data._embedded.photoDtoList == undefined) {
                        return resolve(pictures);
                    }
                    for (const rawPhoto of data._embedded.photoDtoList) {
                        pictures[rawPhoto.id] = new Photo({
                            id: rawPhoto.id,
                            name: rawPhoto.name,
                            position: rawPhoto.position ? {
                                latitude: rawPhoto.position.latitude,
                                longitude: rawPhoto.position.longitude,
                                accuracy: rawPhoto.position.accuracy,
                                timestamp: rawPhoto.position.timestamp
                            } : undefined
                        });
                    }
                    return resolve(pictures);
                })
                .catch(e => {
                    return reject(new Error('Error fetching photos', { cause: e }));
                });
        });
    }

    //--- load Single Currently not implemented, as the app always loads all items at once. Can be implemented later if needed.
    loadUnit(id: string): Promise<Unit> {
        return Promise.reject(new Error(`Method not implemented. (loadUnit(${id}))`));
    }

    loadMapGroup(id: string): Promise<MapGroup> {
        return Promise.reject(new Error(`Method not implemented. (loadMapGroup(${id}))`));
    }

    loadMapItem(id: string): Promise<MapItem> {
        return Promise.reject(new Error(`Method not implemented. (loadMapItem(${id}))`));
    }

    loadMapStyle(id: string): Promise<MapBaseLayer> {
        return Promise.reject(new Error(`Method not implemented. (loadMapStyle(${id}))`));
    }

    loadMapOverlay(id: string): Promise<MapOverlay> {
        return Promise.reject(new Error(`Method not implemented. (loadMapOverlay(${id}))`));
    }

    loadPhoto(id: string): Promise<Photo> {
        return Promise.reject(new Error(`Method not implemented. (loadPhoto(${id}))`));
    }

    //-- Replace All Currently not implemented, as the app always loads all items at once and does not support bulk updates. Can be implemented later if needed.
    replaceAllUnits(units: Unit[]): Promise<void> {
        return Promise.reject(new Error(`Method not implemented. replaceAllUnits(${units.length})`));
    }

    replaceAllMapGroups(mapGroups: MapGroup[]): Promise<void> {
        return Promise.reject(new Error(`Method not implemented. replaceAllMapGroups(${mapGroups.length})`));
    }

    replaceAllMapItems(mapItems: MapItem[]): Promise<void> {
        return Promise.reject(new Error(`Method not implemented. replaceAllMapItems(${mapItems.length})`));
    }

    replaceAllMapStyles(mapStyles: MapBaseLayer[]): Promise<void> {
        return Promise.reject(new Error(`Method not implemented. replaceAllMapStyles(${mapStyles.length})`));
    }

    replaceAllMapOverlays(mapOverlays: MapOverlay[]): Promise<void> {
        return Promise.reject(new Error(`Method not implemented. replaceAllMapOverlays(${mapOverlays.length})`));
    }

    replaceAllPhotos(photos: Photo[]): Promise<void> {
        return Promise.reject(new Error(`Method not implemented. replaceAllPhotos(${photos.length})`));
    }



    //-- Save Single
    saveUnit(unit: Unit): Promise<Unit> {
        return Promise.reject(new Error(`Method not implemented. saveUnit(${unit.getId()})`));
    }

    saveMapGroup(mapGroup: MapGroup): Promise<MapGroup> {
        return Promise.reject(new Error(`Method not implemented. saveMapGroup(${mapGroup.getId()})`));
    }

    saveMapItem(mapItem: MapItem): Promise<MapItem> {
        return new Promise<MapItem>((resolve, reject) => {
            const data = {
                name: mapItem.getName(),
                mapGroupId: mapItem.getGroupId(),
                zoomLevel: mapItem.getZoomLevel(),
                position: {
                    latitude: mapItem.getLatitude(),
                    longitude: mapItem.getLongitude()
                }
            };

            const url = DataProvider.getInstance().getApiUrl() + '/map/items' + (mapItem.getId() ? '/' + mapItem.getId() : '');

            this.callApi(url, mapItem.getId() ? 'PUT' : 'POST', new Headers(), data)
                .then((res) => {
                    const response = res as MapItemStruct;
                    return resolve(MapItem.of({
                        id: response.id,
                        name: response.name,
                        latitude: response.position.latitude,
                        longitude: response.position.longitude,
                        zoomLevel: response.zoomLevel,
                        symbol: null,
                        show_on_map: false,
                        groupId: response.mapGroupId
                    }));
                }).catch(error => {
                    return reject(new Error('Failed to save map item', { cause: error }));
                });
        });
    }

    saveMapStyle(mapStyle: MapBaseLayer): Promise<MapBaseLayer> {
        return Promise.reject(new Error(`Method not implemented. saveMapStyle(${mapStyle.getId()})`));
    }

    saveMapOverlay(mapOverlay: MapOverlay): Promise<MapOverlay> {
        return Promise.reject(new Error(`Method not implemented. saveMapOverlay(${mapOverlay.getId()})`));
    }

    savePhoto(photo: Photo): Promise<Photo> {
        return new Promise<Photo>((resolve) => {
            const url = DataProvider.getInstance().getApiUrl() + '/photos/' + photo.id;
            const body: Record<string, unknown> = { name: photo.name };
            if (photo.position) {
                body['position'] = photo.position.record();
            }
            void this.callApi(url, 'PATCH', new Headers(), body)
                .then((data) => {
                    const raw = data as { id: string; name: string; position?: IPosition };
                    return resolve(new Photo({
                        id: raw.id,
                        name: raw.name,
                        position: raw.position ? {
                            latitude: raw.position.latitude,
                            longitude: raw.position.longitude,
                            accuracy: raw.position.accuracy,
                            timestamp: raw.position.timestamp,
                        } : undefined,
                    }));
                });
        });
    }

    savePhotoImage(img: File): Promise<Photo> {
        const url = DataProvider.getInstance().getApiUrl() + '/photos';

        const formData = new FormData();
        formData.append('file', img);

        return new Promise<Photo>((resolve, reject) => {
            fetch(url, {
                method: 'POST',
                headers: DataProvider.getInstance().getApiToken() ? { 'Authorization': `Bearer ${DataProvider.getInstance().getApiToken()}` } : undefined,
                body: formData
            })
                .then(response => {
                    if (!response.ok) {
                        return reject(new Error(`HTTP error! status: ${response.status}`));
                    }
                    return response.json();
                })
                .then((data: PhotoStruct) => {
                    const photo = new Photo({
                        id: data.id,
                        name: data.name,
                        position: data.position ? {
                            latitude: data.position.latitude,
                            longitude: data.position.longitude,
                            accuracy: data.position.accuracy,
                            timestamp: data.position.timestamp
                        } : undefined
                    });
                    return resolve(photo);
                })
                .catch(error => {
                    return reject(new Error('Failed to upload photo', { cause: error }));
                });
        });
    }


    //-- Delete Single

    deleteUnit(id: string): Promise<void> {
        return Promise.reject(new Error(`Method not implemented. deleteUnit(${id})`));
    }

    deleteMapGroup(id: string): Promise<void> {
        return Promise.reject(new Error(`Method not implemented. deleteMapGroup(${id})`));
    }

    deleteMapItem(id: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const url = DataProvider.getInstance().getApiUrl() + '/map/items/' + id;
            void this.callApi(url, 'DELETE', new Headers())
                .then(() => {
                    return resolve();
                })
                .catch(error => {
                    return reject(new Error('Failed to delete map item', { cause: error }));
                });
        });
    }
    deleteMapStyle(id: string): Promise<void> {
        return Promise.reject(new Error(`Method not implemented. deleteMapStyle(${id})`));
    }

    deleteMapOverlay(id: string): Promise<void> {
        return Promise.reject(new Error(`Method not implemented. deleteMapOverlay(${id})`));
    }

    deletePhoto(id: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const url = DataProvider.getInstance().getApiUrl() + '/photos/' + id;
            void this.callApi(url, 'DELETE', new Headers())
                .then(() => {
                    return resolve();
                })
                .catch(error => {
                    return reject(new Error('Failed to delete photo', { cause: error }));
                });
        });
    }


    //--


    public async getMapOverlayTiles(overlay: MapOverlay): Promise<string[]> {
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
}

