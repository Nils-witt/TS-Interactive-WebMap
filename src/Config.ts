import UrlDataHandler from "./dataProviders/UrlDataHandler.ts";


export class Config {
    mapCenter: [number, number] = [10.0, 51.0]; // Default center of the map
    mapZoom: number = 3;
    editMode: boolean = (UrlDataHandler.getUrlParams().get('editor') != undefined); // Flag to indicate if the map is in edit mode
    iconSize: number = 50; // Default icon size for markers


    constructor() {

        if (localStorage.getItem('mapCenter')) {
            this.mapCenter = JSON.parse(localStorage.getItem('mapCenter') || '[0, 0]');
        }

        if (localStorage.getItem('mapZoom')) {
            this.mapZoom = parseFloat(localStorage.getItem('mapZoom') || '13');
        }
    }
}
