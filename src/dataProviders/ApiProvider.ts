import {LayerInfo} from "../types/LayerInfo";
import {NamedGeoReferencedObject} from "../enitities/NamedGeoReferencedObject";
import {DataProvider} from "./DataProvider";
import {IMapGroup} from "../types/MapEntity";
import {GlobalEventHandler} from "./GlobalEventHandler";


export class ApiProviderEvent extends Event {
    type: ApiProviderEventTypes;
    data: any;

    constructor(type: ApiProviderEventTypes, data: any) {
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
        this.getOverlayLayers().then((overlays:LayerInfo[]) => {
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

        let data = {
            token: DataProvider.getInstance().getApiUrl()
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
            let res = await fetch(url, requestOptions);
            console.log("Login response:", res.status, res.statusText);
            if (res.ok) {
                let data = await res.json();
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

    private async callApi(url: string, method: string, headers: Headers = new Headers(), body?: any): Promise<any> {

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
            return null;
        }
    }

    public async fetchData(url: string): Promise<any> {
        return this.callApi(url, 'GET');
    }

    public async getOverlayLayers(): Promise<LayerInfo[]> {
        let overlays: LayerInfo[] = [];

        try {
            const url = DataProvider.getInstance().getApiUrl() + '/overlays/'
            console.log("Fetching overlay layers from:", url);
            console.log("Using token:", DataProvider.getInstance().getApiToken());

            for (const layer of (await this.fetchData(url))) {
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
        let overlays: LayerInfo[] = [];

        try {
            const url = DataProvider.getInstance().getApiUrl() + '/styles/'
            for (const layer of (await this.fetchData(url))) {
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
            const url = DataProvider.getInstance().getApiUrl() + '/map_groups/'
            return await this.fetchData(url);
        } catch (error) {
            console.error("Error fetching overlay layers:", error);
            return []; // Return empty array on error
        }
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
            let resData = await this.callApi(url, method, new Headers(), data);
            let item = new NamedGeoReferencedObject({
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
        let url = DataProvider.getInstance().getApiUrl() + `/items/${itemId}/`;
        let method = "DELETE";

        try {
            let resData = await this.callApi(url, method, new Headers());
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