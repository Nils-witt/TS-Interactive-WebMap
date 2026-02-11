import {useEffect, useState} from 'react'
import {GlobalEventHandler} from "./dataProviders/GlobalEventHandler.ts";
import {ApiProviderEventTypes} from "./dataProviders/ApiProvider.ts";
import {LoginPage} from "./pages/LoginPage.tsx";
import MapPage from "./pages/MapPage.tsx";
import {ApplicationLogger} from "./ApplicationLogger.ts";
import {DataProvider} from "./dataProviders/DataProvider.ts";

function App() {
    const [loggedin, setLoggedin] = useState<boolean>(true);

    useEffect(() => {

        new BroadcastChannel('setApiBase').postMessage({'url': DataProvider.getInstance().getApiUrl()})


        GlobalEventHandler.getInstance().on(ApiProviderEventTypes.UNAUTHORIZED, () => {
            setLoggedin(false);
        });
        GlobalEventHandler.getInstance().on(ApiProviderEventTypes.LOGIN_SUCCESS, () => {
            setLoggedin(true);
        });
        void (async () => {
            try {
                const res = await fetch('/config.json')
                const config = await res.json() as { apiUrl?: string };
                console.log(config)
                if (config.apiUrl) {
                    if (localStorage.getItem('apiUrl') != config.apiUrl) {
                        localStorage.setItem('apiUrl', config.apiUrl);
                        window.location.reload();
                    }
                }
            } catch {
                ApplicationLogger.info("No config.json found, using defaults", {service: 'App'});
            }

        })()
    }, []);

    if (loggedin) {
        return <MapPage/>
    } else {
        return <LoginPage/>
    }
}


declare global {
    interface Navigator {
        userAgentData: {
            mobile: boolean
        }
    }
}

export default App
