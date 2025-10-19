import {LayerInfo} from "../types/LayerInfo";
import {NamedGeoReferencedObject} from "../enitities/NamedGeoReferencedObject";
import {DataProvider} from "./DataProvider";
import type {IMapGroup} from "../types/MapEntity";
import type {TaktischesZeichen} from "taktische-zeichen-core/dist/types/types";
import {GlobalEventHandler} from "./GlobalEventHandler";


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


export class ApiProvider {

    private static instance: ApiProvider;

    private constructor() { /* empty */ }

    public static getInstance(): ApiProvider {
        if (!ApiProvider.instance) {
            ApiProvider.instance = new ApiProvider();
        }
        return ApiProvider.instance;
    }


    public async testLogin(): Promise<void> {
        const url = DataProvider.getInstance().getApiUrl() + '/token/verify/';
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        const data = {
            token: DataProvider.getInstance().getApiUrl()
        };
        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: JSON.stringify(data)
        };
        try {
            const res = await fetch(url, requestOptions);
            if (res.status == 401) {
                this.notifyListeners(ApiProviderEventTypes.UNAUTHORIZED, {message: "Unauthorized access - check your token."});
            }
        } catch (e) {
            console.error("Error preparing request options:", e);
        }
    }


    public async login(username: string, password: string): Promise<void> {
        const url = DataProvider.getInstance().getApiUrl() + '/token/';
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        const raw = JSON.stringify({username, password});

        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw
        };

        try {
            const res = await fetch(url, requestOptions);
            if (res.ok) {
                const data: { access: string } = await res.json() as { access: string };
                DataProvider.getInstance().setApiToken(data.access); // Store the token for future requests
                this.notifyListeners(ApiProviderEventTypes.LOGIN_SUCCESS, {message: "Login successful"});
            } else {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
        } catch (e) {
            console.error("Error preparing request options:", e);
            throw e;
        }
    }

    public logout(): void {
        localStorage.removeItem('apiToken');
        window.location.reload();
    }

    private async callApi(url: string, method: string, headers: Headers = new Headers(), body?: object): Promise<object | null> {

        if (DataProvider.getInstance().getApiToken()) {
            headers.append("Authorization", `Bearer ${DataProvider.getInstance().getApiToken()}`);
        }

        const requestOptions: RequestInit = {
            method: method,
            headers: headers
        };
        if (body) {
            requestOptions['body'] = JSON.stringify(body);
            headers.append("Content-Type", "application/json");
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
            console.error("Error parsing JSON:", e);
            return null;
        }
    }

    public async fetchData(url: string): Promise<object | null> {
        return this.callApi(url, 'GET');
    }

    public async getOverlayLayers(): Promise<LayerInfo[]> {
        const overlays: LayerInfo[] = [];

        try {
            const url = DataProvider.getInstance().getApiUrl() + '/overlays/'

            for (const layer of (await this.fetchData(url)) as {
                id: string,
                name: string,
                url: string,
                description: string
            }[]) {
                overlays.push(new LayerInfo({
                    id: layer.id,
                    name: layer.name,
                    url: layer.url,
                    description: layer.description
                }));
            }
        } catch (error) {
            console.error("Error fetching overlay layers:", error);
        }
        return overlays; // Return empty array on error
    }

    public async getMapStyles(): Promise<LayerInfo[]> {
        const overlays: LayerInfo[] = [];

        try {
            const url = DataProvider.getInstance().getApiUrl() + '/styles/'
            for (const layer of (await this.fetchData(url)) as {
                id: string,
                name: string,
                url: string,
                description: string
            }[]) {
                overlays.push(new LayerInfo({
                    id: layer.id,
                    name: layer.id,
                    url: layer.url,
                    description: layer.description
                }));
            }
        } catch (error) {
            console.error("Error fetching overlay layers:", error);
        }
        return overlays; // Return empty array on error
    }

    public async getMapItems(): Promise<NamedGeoReferencedObject[]> {

        try {
            const url = DataProvider.getInstance().getApiUrl() + '/items/'
            const data = (await this.fetchData(url)) as {
                id: string,
                name: string,
                latitude: number,
                longitude: number,
                zoom_level: number,
                symbol: TaktischesZeichen,
                show_on_map: boolean,
                group_id: string | null
            }[];
            return data.map((item) => {
                return new NamedGeoReferencedObject({
                    id: item.id,
                    name: item.name,
                    latitude: item.latitude,
                    longitude: item.longitude,
                    zoomLevel: item.zoom_level,
                    symbol: item.symbol,
                    showOnMap: item.show_on_map,
                    groupId: item.group_id || undefined
                });
            });
        } catch (error) {
            console.error("Error fetching items:", error);
            return []; // Return empty array on error
        }

    }

    public async getMapGroups(): Promise<IMapGroup[]> {
        const groups: IMapGroup[] = [];
        try {
            const url = DataProvider.getInstance().getApiUrl() + '/map_groups/'

            for (const group of (await this.fetchData(url)) as { id: string, name: string, description: string }[]) {
                groups.push({
                    id: group.id,
                    name: group.name,
                    description: group.description
                })
            }
        } catch (error) {
            console.error("Error fetching overlay layers:", error);
        }
        return groups;
    }

    public async saveMapItem(item: NamedGeoReferencedObject, updateDataProvider = true): Promise<NamedGeoReferencedObject | null> {
        let url = DataProvider.getInstance().getApiUrl() + `/items/${item.getId()}/`;
        let method = "PUT";

        if (!item.getId()) {
            url = DataProvider.getInstance().getApiUrl() + '/items/';
            method = "POST"; // Use POST for creating new items
        }

        const data = {
            ...item,
            group: item.getGroupId() ? DataProvider.getInstance().getApiUrl() + '/map_groups/' + item.getGroupId() + '/' : null,
        }

        try {
            const resData = await this.callApi(url, method, new Headers(), data) as {
                id: string,
                name: string,
                latitude: number,
                longitude: number,
                zoom_level: number,
                symbol: TaktischesZeichen,
                show_on_map: boolean,
                group_id: string | null
            };
            const item = new NamedGeoReferencedObject({
                id: resData.id,
                name: resData.name,
                latitude: resData.latitude,
                longitude: resData.longitude,
                zoomLevel: resData.zoom_level,
                symbol: resData.symbol,
                showOnMap: resData.show_on_map,
                groupId: resData.group_id || undefined
            });
            if (updateDataProvider) {
                DataProvider.getInstance().addMapItem(item);
            }
            return item;
        } catch (e) {
            console.error("Error preparing request options:", e);
        }
        return null;
    }

    public async deleteMapItem(itemId: string): Promise<boolean> {
        const url = DataProvider.getInstance().getApiUrl() + `/items/${itemId}/`;
        const method = "DELETE";

        try {
            await this.callApi(url, method, new Headers());
            return true;
        } catch (e) {
            console.error("Error preparing request options:", e);
            return false;
        }
    }

    public async getOverlayTiles(overlay: LayerInfo): Promise<string[]> {
        let url: URL | undefined;
        if (overlay.getUrl().startsWith('http')) {
            url = new URL(overlay.getUrl().substring(0, overlay.getUrl().search("{z}"))); // Ensure the URL is absolute
        } else {
            url = new URL(overlay.getUrl().substring(0, overlay.getUrl().search("{z}")), window.location.origin); // Ensure the URL is absolute
        }

        const response = await fetch(url.href + "/index.json?accesstoken=" + DataProvider.getInstance().getApiToken());
        if (response.ok){
            const data = await response.json() as Record<string, Record<string, string[]>>;
            const filelist: string[] = []

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
        GlobalEventHandler.getInstance().emit(event, new ApiProviderEvent(event, data))
    }
}