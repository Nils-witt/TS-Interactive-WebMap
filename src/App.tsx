import {useEffect, useState} from 'react'
import {GlobalEventHandler} from "./dataProviders/GlobalEventHandler.ts";
import {ApiProviderEventTypes} from "./dataProviders/ApiProvider.ts";
import {LoginPage} from "./pages/LoginPage.tsx";
import MapPage from "./pages/MapPage.tsx";

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
