import {DataProvider} from "./common_components/DataProvider";


export function loadBrowserConfig() {
    const dp = DataProvider.getInstance();

    dp.setApiUrl(localStorage.getItem('apiUrl') || window.location.origin + '/api')

    // Load map center from localStorage if available
    if (localStorage.getItem('mapCenter')) {
        dp.setMapCenter(JSON.parse(localStorage.getItem('mapCenter') || '[0, 0]'))
    }

    // Load map zoom from localStorage if available
    if (localStorage.getItem('mapZoom')) {
        dp.setMapZoom(parseFloat(localStorage.getItem('mapZoom') || '13'));
    }
    if (localStorage.getItem('authToken')) {
        dp.setApiToken(localStorage.getItem('authToken'));
    }
}