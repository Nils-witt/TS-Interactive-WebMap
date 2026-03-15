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
import type { ApiResponseStruct, MapItemStruct, MissionGroupStruct, PhotoStruct } from './structs/ApiResponseStruct.ts';
import { Photo } from '../enitities/Photo.ts';
import type { IPosition } from '../enitities/embeddables/EmbeddablePosition.ts';
import { User } from '../enitities/User.ts';
import { MissionGroup } from '../enitities/MissionGroup.ts';
import type { Notification } from '../enitities/Notification.ts';


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
    UNAUTHORIZED = 'unauthorized',
    FORBIDDEN = 'forbidden'
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
                const data: { token: string; userId: string } = await res.json() as { token: string; userId: string };
                DataProvider.getInstance().setApiToken(data.token); // Store the token for future requests
                localStorage.setItem('activeUser', data.userId);
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
            if (response.status === 401) {
                this.notifyListeners(ApiProviderEventTypes.UNAUTHORIZED, { message: `Unauthorized access - check your token. ${response.status}` });
            }else if (response.status === 403) {
                this.notifyListeners(ApiProviderEventTypes.FORBIDDEN, { message: `Forbidden - you don't have permission to access this resource. ${response.status}` });
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
                            createdAt: new Date(rawUnit.createdAt).getTime(),
                            updatedAt: new Date(rawUnit.updatedAt).getTime(),
                            name: rawUnit.name,
                            pos_latitude: rawUnit.position.latitude,
                            pos_longitude: rawUnit.position.longitude,
                            pos_accuracy: rawUnit.position.accuracy,
                            pos_timestamp: rawUnit.position.timestamp,
                            symbol: rawUnit.icon as never,
                            unit_status: rawUnit.status,
                            unit_status_timestamp: new Date().toISOString(),
                            route: null,
                            permissions: rawUnit.permissions
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
                            createdAt: new Date(rawUnit.createdAt).getTime(),
                            updatedAt: new Date(rawUnit.updatedAt).getTime(),
                            name: rawUnit.name,
                            permissions: rawUnit.permissions
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
                            createdAt: new Date(item.createdAt).getTime(),
                            updatedAt: new Date(item.updatedAt).getTime(),
                            name: item.name,
                            latitude: item.position.latitude,
                            longitude: item.position.longitude,
                            zoomLevel: item.zoomLevel,
                            symbol: null,
                            show_on_map: false,
                            group_id: item.mapGroupId,
                            permissions: item.permissions
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
                            createdAt: new Date(layer.createdAt).getTime(),
                            updatedAt: new Date(layer.updatedAt).getTime(),
                            name: layer.id,
                            url: layer.url,
                            cacheUrl: layer.cacheUrl,
                            permissions: layer.permissions
                        });
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
                                createdAt: new Date(layer.createdAt).getTime(),
                                updatedAt: new Date(layer.updatedAt).getTime(),
                                name: layer.name,
                                url: layer.fullTileUrl,
                                layerVersion: layer.layerVersion,
                                description: '',
                                order: 0,
                                opacity: 1.0,
                                permissions: layer.permissions 
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
                            createdAt: new Date(rawPhoto.createdAt).getTime(),
                            updatedAt: new Date(rawPhoto.updatedAt).getTime(),
                            name: rawPhoto.name,
                            position: rawPhoto.position ? {
                                latitude: rawPhoto.position.latitude,
                                longitude: rawPhoto.position.longitude,
                                accuracy: rawPhoto.position.accuracy,
                                timestamp: rawPhoto.position.timestamp
                            } : undefined,
                            authorId: rawPhoto.authorId,
                            missionGroupId: rawPhoto.missionGroupId,
                            permissions: rawPhoto.permissions
                        });
                    }
                    return resolve(pictures);
                })
                .catch(e => {
                    return reject(new Error('Error fetching photos', { cause: e }));
                });
        });
    }

    loadAllMissionGroups(): Promise<Record<string, MissionGroup>> {
        return new Promise<Record<string, MissionGroup>>((resolve, reject) => {
            const missionGroups: Record<string, MissionGroup> = {};
            const url = DataProvider.getInstance().getApiUrl() + '/missiongroups';

            this.fetchData(url)
                .then(raw => {
                    const data = raw as ApiResponseStruct;
                    if (data == null || data._embedded == undefined || data._embedded.missionGroupDtoList == undefined) {
                        return resolve(missionGroups);
                    }
                    for (const rawMissionGroup of data._embedded.missionGroupDtoList) {
                        missionGroups[rawMissionGroup.id] = MissionGroup.of({
                            id: rawMissionGroup.id,
                            createdAt: new Date(rawMissionGroup.createdAt).getTime(),
                            updatedAt: new Date(rawMissionGroup.updatedAt).getTime(),
                            name: rawMissionGroup.name,
                            startTime: rawMissionGroup.startTime,
                            endTime: rawMissionGroup.endTime,
                            mapGroupIds: rawMissionGroup.mapGroupIds,
                            unitIds: rawMissionGroup.unitIds,
                            position: rawMissionGroup.position,
                            permissions: rawMissionGroup.permissions
                        });
                    }
                    return resolve(missionGroups);
                })
                .catch(e => {
                    return reject(new Error('Error fetching mission groups', { cause: e }));
                });
        });
    }

    loadAllUsers(): Promise<Record<string, User>> {
        return new Promise<Record<string, User>>((resolve, reject) => {
            const users: Record<string, User> = {};
            const url = DataProvider.getInstance().getApiUrl() + '/users';

            this.fetchData(url)
                .then(raw => {
                    const data = raw as ApiResponseStruct;
                    if (data == null || data._embedded == undefined || data._embedded.userDtoList == undefined) {
                        return resolve(users);
                    }
                    for (const rawUser of data._embedded.userDtoList) {
                        users[rawUser.id] = new User({
                            id: rawUser.id,
                            createdAt: new Date(rawUser.createdAt).getTime(),
                            updatedAt: new Date(rawUser.updatedAt).getTime(),
                            email: rawUser.email,
                            firstName: rawUser.firstName,
                            lastName: rawUser.lastName,
                            unitId: rawUser.unitId,
                            username: rawUser.username,
                            permissions: rawUser.permissions
                        });
                    }
                    return resolve(users);
                })
                .catch(e => {
                    return reject(new Error('Error fetching users', { cause: e }));
                });
        });
    }

    loadAllNotifications(): Promise<Record<string, Notification>> {
        return Promise.reject(new Error('Method not implemented. (loadAllNotifications()))'));
    }


    //--- load Single Currently not implemented, as the app always loads all items at once. Can be implemented later if needed.
    loadMissionGroup(id: string): Promise<MissionGroup> {
        return Promise.reject(new Error(`Method not implemented. (loadMissionGroup(${id})))`));
    }

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

    loadUser(id: string): Promise<User> {
        return Promise.reject(new Error(`Method not implemented. (loadUser(${id}))`));
    }

    loadNotification(id: string): Promise<Notification> {
        return Promise.reject(new Error(`Method not implemented. (loadNotification(${id}))`));
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

    replaceAllUsers(users: User[]): Promise<void> {
        return Promise.reject(new Error(`Method not implemented. replaceAllUsers(${users.length})`));
    }

    replaceAllMissionGroups(missionGroups: MissionGroup[]): Promise<void> {
        return Promise.reject(new Error(`Method not implemented. replaceAllMissionGroups(${missionGroups.length})`));
    }

    replaceAllNotifications(notifications: Notification[]): Promise<void> {
        return Promise.reject(new Error(`Method not implemented. (replaceAllNotifications(${notifications.length}))`));
    }

    //-- Save Single
    saveUnit(unit: Unit): Promise<Unit> {
        return new Promise<Unit>((resolve, reject) => {
            const url = DataProvider.getInstance().getApiUrl() + '/units/' + unit.getId();
            const body: Record<string, unknown> = {
                name: unit.getName(),
                status: unit.getStatus(),
            };
            if (unit.getPosition()) {
                body['position'] = {
                    latitude: unit.getPosition()!.getLatitude(),
                    longitude: unit.getPosition()!.getLongitude(),
                    accuracy: unit.getPosition()!.getAccuracy(),
                    timestamp: unit.getPosition()!.getTimestamp().toISOString(),
                };
            }
            if (unit.getGroupId()) {
                body['groupId'] = unit.getGroupId();
            }
            this.callApi(url, 'PATCH', new Headers(), body)
                .then((raw) => {
                    const data = raw as { id: string; name: string; status?: number; position?: { latitude: number; longitude: number; accuracy: number; timestamp: string }; groupId?: string };
                    return resolve(Unit.of({
                        id: data.id,
                        name: data.name,
                        pos_latitude: data.position?.latitude ?? unit.getPosition()?.getLatitude() ?? 0,
                        pos_longitude: data.position?.longitude ?? unit.getPosition()?.getLongitude() ?? 0,
                        pos_accuracy: data.position?.accuracy ?? unit.getPosition()?.getAccuracy() ?? 0,
                        pos_timestamp: data.position?.timestamp ?? unit.getPosition()?.getTimestamp().toISOString() ?? new Date().toISOString(),
                        unit_status: data.status ?? unit.getStatus(),
                        group_id: data.groupId ?? unit.getGroupId(),
                        symbol: unit.getSymbol() ? JSON.stringify(unit.getSymbol()) : null,
                    }));
                })
                .catch((e) => reject(new Error('Failed to save unit', { cause: e })));
        });
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
            const url = DataProvider.getInstance().getApiUrl() + '/photos/' + photo.getId();
            const body: Record<string, unknown> = { name: photo.getName() };
            if (photo.getPosition()) {
                body['position'] = photo.getPosition()!.record();
            }
            void this.callApi(url, 'PATCH', new Headers(), body)
                .then((data) => {
                    const raw = data as PhotoStruct;
                    return resolve(new Photo({
                        id: raw.id,
                        createdAt: new Date(raw.createdAt).getTime(),
                        updatedAt: new Date(raw.updatedAt).getTime(),
                        permissions: raw.permissions,
                        name: raw.name,
                        position: raw.position ? {
                            latitude: raw.position.latitude,
                            longitude: raw.position.longitude,
                            accuracy: raw.position.accuracy,
                            timestamp: raw.position.timestamp,
                        } : undefined,
                        authorId: photo.getAuthorId(),
                        missionGroupId: photo.getMissionGroupId()
                    }));
                });
        });
    }

    savePhotoImage(img: File, position: IPosition | null, name: string, missionGroupId: string): Promise<Photo> {
        const url = DataProvider.getInstance().getApiUrl() + '/photos';

        const formData = new FormData();
        formData.append('file', img);
        formData.append('latitude', position ? position.latitude.toString() : '');
        formData.append('longitude', position ? position.longitude.toString() : '');
        formData.append('name', name);
        formData.append('missionGroupId', missionGroupId);


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
                        createdAt: new Date(data.createdAt).getTime(),
                        updatedAt: new Date(data.updatedAt).getTime(),
                        permissions: data.permissions,
                        name: data.name,
                        position: data.position ? {
                            latitude: data.position.latitude,
                            longitude: data.position.longitude,
                            accuracy: data.position.accuracy,
                            timestamp: data.position.timestamp
                        } : undefined,
                        authorId: data.authorId,
                        missionGroupId: data.missionGroupId
                    });
                    return resolve(photo);
                })
                .catch(error => {
                    return reject(new Error('Failed to upload photo', { cause: error }));
                });
        });
    }

    saveUser(user: User): Promise<User> {
        return Promise.reject(new Error(`Method not implemented. saveUser(${user.getId()})`));
    }

    saveMissionGroup(missionGroup: MissionGroup): Promise<MissionGroup> {
        return new Promise<MissionGroup>((resolve, reject) => {
            const data = missionGroup.record();
            const url = DataProvider.getInstance().getApiUrl() + '/mission-groups' + (missionGroup.getId() ? '/' + missionGroup.getId() : '');

            this.callApi(url, missionGroup.getId() ? 'PUT' : 'POST', new Headers(), data)
                .then((res) => {
                    const response = res as MissionGroupStruct;
                    return resolve(MissionGroup.of({
                        id: response.id,
                        name: response.name,
                        startTime: response.startTime,
                        endTime: response.endTime,
                        mapGroupIds: response.mapGroupIds,
                        unitIds: response.unitIds,
                        position: response.position,
                    }));
                })
                .catch(error => {
                    return reject(new Error('Failed to save mission group', { cause: error }));
                });
        });
    }

    saveNotification(notification: Notification): Promise<Notification> {
        return Promise.reject(new Error(`Method not implemented. saveNotification(${notification.getId()})`));
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

    deleteUser(id: string): Promise<void> {
        return Promise.reject(new Error(`Method not implemented. deleteUser(${id})`));
    }

    deleteMissionGroup(id: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const url = DataProvider.getInstance().getApiUrl() + '/mission-groups/' + id;
            void this.callApi(url, 'DELETE', new Headers())
                .then(() => {
                    return resolve();
                })
                .catch(error => {
                    return reject(new Error('Failed to delete mission group', { cause: error }));
                });
        });
    }

    deleteNotification(id: string): Promise<void> {
        return Promise.reject(new Error(`Method not implemented. deleteNotification(${id})`));
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

