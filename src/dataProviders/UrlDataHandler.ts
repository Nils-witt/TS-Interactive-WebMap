/**
 * Utility class for handling URL parameters in the application.
 * Provides methods to get and set URL parameters, specifically for query strings and markers.
 * All methods are static as this is a utility class.
 */
export default class UrlDataHandler {

    /**
     * Extracts all URL parameters from the current window location.
     *
     * @returns A Map containing all URL parameters as key-value pairs
     */
    public static getUrlParams(): Map<string, string> {
        const result = new Map<string, string>();

        // Parse URL search parameters from the current window location
        const params = new URLSearchParams(window.location.search);

        // Convert URLSearchParams entries to a Map
        for (const [key, value] of params.entries()) {
            result.set(key, value);
        }

        return result;
    }

    /**
     * Sets the 'queryString' parameter in the URL.
     *
     * @param queryString - The query string value to set
     */
    public static setQueryString(queryString: string): void {
        const params = this.getUrlParams();
        params.set('queryString', queryString);
        this.replaceUrlParam(params);
    }

    /**
     * Retrieves the 'queryString' parameter from the URL.
     *
     * @returns The query string value or undefined if not present
     */
    public static getQueryString(): string | undefined {
        const params = this.getUrlParams();
        return params.get('queryString');
    }

    /**
     * Sets the 'marker' parameter in the URL.
     *
     * @param markerId - The marker ID to set
     */
    public static setSelectedMarker(markerId: string): void {
        const params = this.getUrlParams();
        params.set('marker', markerId);
        this.replaceUrlParam(params);
    }

    /**
     * Retrieves the 'marker' parameter from the URL.
     *
     * @returns The marker ID or undefined if not present
     */
    public static getSelectedMarker(): string | undefined {
        const params = this.getUrlParams();
        return params.get('marker');
    }

    /**
     * Updates the browser URL with the provided parameters without reloading the page.
     * Constructs a new URL with the given parameters and uses history.pushState to update.
     *
     * @param params - Map of parameter key-value pairs to include in the URL
     */
    public static replaceUrlParam(params: Map<string, string>): void {
        // Construct the base URL (protocol, host, and path)
        let url = window.location.protocol + "//" + window.location.host + window.location.pathname + '?';

        // Add each parameter to the URL, properly encoded
        params.forEach((value, key) => {
            url += `${key}=${encodeURIComponent(value)}&`;
        });

        // Update the browser URL without reloading the page
        window.history.pushState({path: url}, '', url);
    }

}