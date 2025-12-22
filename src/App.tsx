import {useEffect, useState} from 'react'
import {GlobalEventHandler} from "./dataProviders/GlobalEventHandler.ts";
import {ApiProviderEventTypes} from "./dataProviders/ApiProvider.ts";
import {MapComponent} from "./components/MapComponent.tsx";
import {LoginPage} from "./components/LoginPage.tsx";
import {DataProvider} from "./dataProviders/DataProvider.ts";
import {LocalStorageProvider} from "./dataProviders/LocalStorageProvider.ts";

function App() {
    const [loggedin, setLoggedin] = useState<boolean>(true);

    useEffect(() => {
        GlobalEventHandler.getInstance().on(ApiProviderEventTypes.UNAUTHORIZED, () => {
            setLoggedin(false);
        });
        GlobalEventHandler.getInstance().on(ApiProviderEventTypes.LOGIN_SUCCESS, () => {
            setLoggedin(true);
        });

    }, []);

    if (loggedin) {
        return <MapComponent dataProvider={DataProvider.getInstance()}
                             eventHandler={GlobalEventHandler.getInstance()}
                             keyValueStore={new LocalStorageProvider()}
                             showSettings={true}/>
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
