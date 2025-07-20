import type {LayerInfo} from "../types/LayerInfo.ts";
import {NamedGeoReferencedObject} from "../enitites/NamedGeoReferencedObject.ts";
import type {DataProvider} from "./DataProvider.ts";
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

    public async loadAllData(dataProvider: DataProvider): Promise<void> {
        this.getMapStyles().then(styles => {
            if (styles.length > 0) {
                dataProvider.setMapStyle(styles[0]);
            }
        });
        this.getOverlayLayers().then(overlays => {
            for (const overlay of overlays) {
                dataProvider.addOverlay(overlay.id, overlay);
            }
        });
        this.getMapItems().then(items => {
            for (const item of items) {
                dataProvider.addMapLocation(item.id, item);
            }
        });
        this.getMapGroups().then(items => {
            for (const item of items) {
                dataProvider.addMapGroup(item.id, item);
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
                console.log("Login successful, token:", this.token);
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

    public async fetchData(url: string): Promise<any> {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
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
        const url = ApiProvider.BASE_URL + '/items/';

        let data = await fetch(url);

        if (data.ok) {
            let jsonData = await data.json();
            return jsonData.map((item: any) => {
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
        } else {
            console.error("Failed to fetch entities:", data.statusText);
        }
        return [];
    }

    public async getMapGroups(): Promise<IMapGroup[]> {
        const url = ApiProvider.BASE_URL + '/map_groups/';

        let data = await fetch(url);

        if (data.ok) {
            let jsonData = await data.json();
            return jsonData.map((item: any) => {
                return {
                    id: item.id,
                    name: item.name,
                    description: item.description
                }
            });
        } else {
            console.error("Failed to fetch entities:", data.statusText);
        }
        return [];
    }

    public async saveMapItem(item: NamedGeoReferencedObject): Promise<NamedGeoReferencedObject | null> {


        let url = ApiProvider.BASE_URL + `/items/${item.id}/`;
        let method = "PUT";

        if (!item.id) {
            url = ApiProvider.BASE_URL + '/items/';
            method = "POST"; // Use POST for creating new items
        }

        console.log("Saving item:", item, "to URL:", url);
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Authorization", `Bearer ${this.token}`);

        const raw = JSON.stringify({
            ...item,
            group: item.groupId ? ApiProvider.BASE_URL + '/map_groups/' + item.groupId + '/' : null,
        });

        console.log("Request body:", raw);

        const requestOptions = {
            method: method,
            headers: myHeaders,
            body: raw
        };
        try {
            let result = await fetch(url, requestOptions)
            console.log("Save result:", result.status, result.statusText);
            if (result.ok) {
                console.log("Item saved successfully:", item.id);
                let resData = await result.json();
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
            } else {
                if (result.status === 403) {
                    this.notifyListeners(ApiProviderEventTypes.UNAUTHORIZED, {message: "Unauthorized access - check your token."});
                    this.on('login-success', () => {
                        this.saveMapItem(item); // Retry saving after successful login
                    });
                }
            }
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