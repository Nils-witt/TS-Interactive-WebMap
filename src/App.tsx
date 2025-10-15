import {useEffect, useState} from 'react'
import {GlobalEventHandler} from "./dataProviders/GlobalEventHandler.ts";
import {ApiProviderEventTypes} from "./dataProviders/ApiProvider.ts";
import {MapComponent} from "./components/MapComponent.tsx";
import {LoginPage} from "./components/LoginPage.tsx";

/*
useEffect(() => {
    GlobalEventHandler.getInstance().on(ApiProviderEventTypes.UNAUTHORIZED, () => {
        navigate("/login");
    });

    ApiProvider.getInstance().getMapItems()
},[]);
 */

function App() {
    const [loggedin, setLoggedin] = useState<boolean>(true);

    useEffect(() => {
        GlobalEventHandler.getInstance().on(ApiProviderEventTypes.UNAUTHORIZED, () => {
            setLoggedin(false);
        });
        GlobalEventHandler.getInstance().on(ApiProviderEventTypes.LOGIN_SUCCESS, () => {
            setLoggedin(true);
        })

    },[]);

    if (loggedin) {
        return <MapComponent/>
    } else {
        return <LoginPage/>
    }
}
export default App
