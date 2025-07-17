import type {LayerInfo} from "../types/LayerInfo.ts";
import type {MapEntity} from "../types/MapEntity.ts";


export class ApiProvider {

    private static readonly BASE_URL = 'https://map.nils-witt.de/api'

    private static instance: ApiProvider;

    private constructor() {
        // Private constructor to prevent instantiation
    }

    public static getInstance(): ApiProvider {
        if (!ApiProvider.instance) {
            ApiProvider.instance = new ApiProvider();
        }
        return ApiProvider.instance;
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

    public async getMapObjects(): Promise<MapEntity[]> {
        const url = ApiProvider.BASE_URL + '/mapobjects/';

        let data = await fetch(url);

        if (data.ok) {
            let jsonData = await data.json();
            return jsonData.map((item: any) => ({
                name: item.name,
                id: item.id,
                description: item.description,
                latitude: item.latitude,
                longitude: item.longitude,
                zoomLevel: item.zoom,
                groups: []
            }) as MapEntity);
        } else {
            console.error("Failed to fetch entities:", data.statusText);
        }
        return [];
    }
}