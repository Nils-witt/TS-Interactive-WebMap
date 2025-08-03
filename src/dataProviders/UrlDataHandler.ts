export default class UrlDataHandler {


    public static getUrlParams(): Map<string, string> {
        const result = new Map<string, string>();

        const params = new URLSearchParams(window.location.search);

        for (const [key, value] of params.entries()) {
            result.set(key, value);
        }

        return result;
    }

    public static setQueryString(queryString: string): void {
        let params = this.getUrlParams();
        params.set('queryString', queryString);
        this.replaceUrlParam(params);
    }

    public static getQueryString(): string | undefined {
        const params = this.getUrlParams();
        return params.get('queryString');
    }

    public static setSelectedMarker(markerId: string): void {
        let params = this.getUrlParams();
        params.set('marker', markerId);
        this.replaceUrlParam(params);
    }

    public static getSelectedMarker(): string | undefined {
        const params = this.getUrlParams();
        return params.get('marker');
    }

    public static replaceUrlParam(params: Map<string, string>): void {
        let url = window.location.protocol + "//" + window.location.host + window.location.pathname + '?';

        params.forEach((value, key) => {
            url += `${key}=${encodeURIComponent(value)}&`;
        });
        window.history.pushState({path: url}, '', url);
    }

}