import type {LayerInfo} from "../types/LayerInfo.ts";
import {NamedGeoReferencedObject} from "../enitites/NamedGeoReferencedObject.ts";
import {DataProvider} from "./DataProvider.ts";
import {IMapGroup} from "../types/MapEntity.ts";


export enum ApiProviderEventTypes {
    LOGIN_SUCCESS = 'login-success',
    LOGIN_FAILURE = 'login-failure',
    UNAUTHORIZED = 'unauthorized'
}


export class ApiProvider {

    private static readonly BASE_URL = 'https://map.nils-witt.de/api'

    private static instance: ApiProvider;
    private token: string | undefined = undefined;


    private listeners: Map<string, ((event: any) => void)[]> = new Map();

    private constructor() {
        this.token = localStorage.getItem('authToken') || undefined; // Load token from local storage if available
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
        this.getOverlayLayers().then(overlays => {
            for (const overlay of overlays) {
                DataProvider.getInstance().addOverlay(overlay.id, overlay);
            }
        });
        this.getMapItems().then(items => {
            for (const item of items) {
                DataProvider.getInstance().addMapLocation(item.id, item);
            }
        });
        this.getMapGroups().then(items => {
            for (const item of items) {
                DataProvider.getInstance().addMapGroup(item.id, item);
            }
        });
    }

    public async testLogin(): Promise<void> {
        const url = ApiProvider.BASE_URL + '/token/verify/';
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        let data = {
            token: this.token
        };
        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: JSON.stringify(data)
        };
        try {
            let res = await fetch(url, requestOptions);
            if (res.status == 401) {
                this.notifyListeners(ApiProviderEventTypes.UNAUTHORIZED, {message: "Unauthorized access - check your token."});
            }
        } catch (e) {
            console.error("Error preparing request options:", e);
        }
    }


    public async login(username: string, password: string): Promise<void> {
        const url = ApiProvider.BASE_URL + '/token/';
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        const raw = JSON.stringify({username, password});

        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw
        };

        try {
            let res = await fetch(url, requestOptions);
            console.log("Login response:", res.status, res.statusText);
            if (res.ok) {
                let data = await res.json();
                this.token = data.access; // Store the token for future requests
                localStorage.setItem('authToken', data.access); // Store token in local storage
                this.notifyListeners(ApiProviderEventTypes.LOGIN_SUCCESS, {message: "Login successful"});
            } else {
                this.notifyListeners(ApiProviderEventTypes.LOGIN_FAILURE, {message: "Login failed"});
            }
        } catch (e) {
            console.error("Error preparing request options:", e);
        }
    }

    public on(event: string, callback: (event: any) => void): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)?.push(callback);
    }


    private async callApi(url: string, method: string, headers: Headers = new Headers(), body?: any): Promise<any> {

        if (this.token) {
            headers.append("Authorization", `Bearer ${this.token}`);
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
        return response.json();
    }

    public async fetchData(url: string): Promise<any> {
        return this.callApi(url, 'GET');
    }

    public async getOverlayLayers(): Promise<LayerInfo[]> {
        let overlays: LayerInfo[] = [];

        try {
            const url = ApiProvider.BASE_URL + '/overlays/'
            return await this.fetchData(url);
        } catch (error) {
            console.error("Error fetching overlay layers:", error);
            return overlays; // Return empty array on error
        }
    }

    public async getMapStyles(): Promise<LayerInfo[]> {
        let overlays: LayerInfo[] = [];

        try {
            const url = ApiProvider.BASE_URL + '/styles/'
            return await this.fetchData(url);
        } catch (error) {
            console.error("Error fetching overlay layers:", error);
            return overlays; // Return empty array on error
        }
    }

    public async getMapItems(): Promise<NamedGeoReferencedObject[]> {

        try {
            const url = ApiProvider.BASE_URL + '/items/'
            let data = await this.fetchData(url);
            return data.map((item: any) => {
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

    public async getMapGroups()
        :
        Promise<IMapGroup[]> {
        try {
            const url = ApiProvider.BASE_URL + '/map_groups/'
            return await this.fetchData(url);
        } catch (error) {
            console.error("Error fetching overlay layers:", error);
            return []; // Return empty array on error
        }
    }

    public async saveMapItem(item: NamedGeoReferencedObject): Promise<NamedGeoReferencedObject | null> {


        let url = ApiProvider.BASE_URL + `/items/${item.id}/`;
        let method = "PUT";

        if (!item.id) {
            url = ApiProvider.BASE_URL + '/items/';
            method = "POST"; // Use POST for creating new items
        }

        const data = {
            ...item,
            group: item.groupId ? ApiProvider.BASE_URL + '/map_groups/' + item.groupId + '/' : null,
        }

        try {
            let resData = await this.callApi(url, method, new Headers(), data);
            return new NamedGeoReferencedObject({
                id: resData.id,
                name: resData.name,
                latitude: resData.latitude,
                longitude: resData.longitude,
                zoomLevel: resData.zoom_level,
                symbol: resData.symbol,
                showOnMap: resData.show_on_map,
                groupId: resData.group_id
            });
        } catch (e) {
            console.error("Error preparing request options:", e);
        }
        return null;
    }

    private notifyListeners(event: string, data: { message: string }) {
        for (const callback of this.listeners.get(event) || []) {
            callback(data);
        }
    }
}