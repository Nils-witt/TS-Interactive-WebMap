import {LayerInfo} from "../types/LayerInfo";
import {NamedGeoReferencedObject} from "../enitities/NamedGeoReferencedObject";
import {DataProvider} from "./DataProvider";
import {IMapGroup} from "../types/MapEntity";
import {GlobalEventHandler} from "./GlobalEventHandler";
import {TaktischesZeichen} from "taktische-zeichen-core/dist/types/types";


export class ApiProviderEvent extends Event {
    type: ApiProviderEventTypes;
    data: object;

    constructor(type: ApiProviderEventTypes, data: object) {
        super(type);
        this.type = type;
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

    private constructor() {

    }

    public static getInstance(): ApiProvider {
        if (!ApiProvider.instance) {
            ApiProvider.instance = new ApiProvider();
        }
        return ApiProvider.instance;
    }


    public async loadAllData(): Promise<void> {
        this.getMapStyles().then(styles => {
            if (styles.length > 0) {
                DataProvider.getInstance().setMapStyle(styles[0]);
            }
        });
        this.getOverlayLayers().then((overlays: LayerInfo[]) => {
            for (const overlay of overlays) {
                console.log("Adding overlay:", overlay);
                DataProvider.getInstance().addOverlay(overlay.getId(), overlay);
            }
        });
        this.getMapItems().then(items => {
            for (const item of items) {
                DataProvider.getInstance().addMapItem(item);
            }
        });
        this.getMapGroups().then(items => {
            for (const item of items) {
                DataProvider.getInstance().addMapGroup(item.id, item);
            }
        });
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
            console.log("Login response:", res.status, res.statusText);
            if (res.ok) {
                const data = await res.json();
                DataProvider.getInstance().setApiToken(data.access); // Store the token for future requests
                localStorage.setItem('authToken', data.access); // Store token in local storage
                this.notifyListeners(ApiProviderEventTypes.LOGIN_SUCCESS, {message: "Login successful"});
            } else {
                this.notifyListeners(ApiProviderEventTypes.LOGIN_FAILURE, {message: "Login failed"});
            }
        } catch (e) {
            console.error("Error preparing request options:", e);
        }
    }

    private async callApi(url: string, method: string, headers: Headers = new Headers(), body?: object): Promise<object> {

        if (DataProvider.getInstance().getApiToken()) {
            headers.append("Authorization", `Bearer ${DataProvider.getInstance().getApiToken()}`);
        }

        const requestOptions = {
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
            return await response.json();
        } catch (e) {
            console.error("Error parsing JSON:", e);
            return null;
        }
    }

    public async fetchData(url: string): Promise<object> {
        return this.callApi(url, 'GET');
    }

    public async getOverlayLayers(): Promise<LayerInfo[]> {
        const overlays: LayerInfo[] = [];

        try {
            const url = DataProvider.getInstance().getApiUrl() + '/overlays/'
            console.log("Fetching overlay layers from:", url);
            console.log("Using token:", DataProvider.getInstance().getApiToken());

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
                    groupId: item.group_id
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

    public async saveMapItem(item: NamedGeoReferencedObject, updateDataProvider: boolean = true): Promise<NamedGeoReferencedObject | null> {
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
                groupId: resData.group_id
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
            const resData = await this.callApi(url, method, new Headers());
            console.log("Delete response:", resData);
            return true;
        } catch (e) {
            console.error("Error preparing request options:", e);
            return false;
        }
    }

    private notifyListeners(event: ApiProviderEventTypes, data: { message: string }) {
        GlobalEventHandler.getInstance().emit(event, new ApiProviderEvent(event, data))
    }
}