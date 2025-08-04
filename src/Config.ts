/**
 * Import the URL data handler to process URL parameters
 */
import UrlDataHandler from "./dataProviders/UrlDataHandler.ts";

/**
 * Config class
 *
 * This class manages the configuration settings for the MapLibre web map application.
 * It follows the Singleton pattern to ensure only one instance exists throughout the application.
 * Configuration includes map center coordinates, zoom level, edit mode status, and API URL.
 */
export class Config {

    /**
     * Singleton instance of the Config class
     * Created when the class is loaded
     */
    public static instance: Config = new Config(); // Singleton instance of Config

    /**
     * Default center coordinates of the map [longitude, latitude]
     */
    mapCenter: [number, number] = [10.0, 51.0]; // Default center of the map

    /**
     * Default zoom level of the map
     */
    mapZoom: number = 3;

    /**
     * Flag to indicate if the map is in edit mode
     * Determined by checking if 'editor' parameter exists in the URL
     */
    editMode: boolean = (UrlDataHandler.getUrlParams().get('editor') != undefined); // Flag to indicate if the map is in edit mode

    /**
     * Default icon size for markers in pixels
     */
    iconSize: number = 50; // Default icon size for markers

    /**
     * API URL for data requests
     */
    apiUrl: string; // Default API URL

    /**
     * Private constructor to prevent direct instantiation
     * Initializes configuration values from localStorage if available
     */
    private constructor() {
        // Set API URL from localStorage or default to current origin + '/api'
        this.apiUrl = localStorage.getItem('apiUrl') || window.location.origin + '/api'

        // Log the API URL for debugging purposes
        console.log("API URL: " + this.apiUrl);

        // Load map center from localStorage if available
        if (localStorage.getItem('mapCenter')) {
            this.mapCenter = JSON.parse(localStorage.getItem('mapCenter') || '[0, 0]');
        }

        // Load map zoom from localStorage if available
        if (localStorage.getItem('mapZoom')) {
            this.mapZoom = parseFloat(localStorage.getItem('mapZoom') || '13');
        }
    }

    /**
     * Static method to access the singleton instance
     * @returns The singleton instance of the Config class
     */
    public static getInstance(): Config {
        return Config.instance;
    }
}
