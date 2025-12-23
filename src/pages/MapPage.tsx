import type {JSX} from "react";
import {MapComponent} from "../components/MapComponent.tsx";
import {DataProvider} from "../dataProviders/DataProvider.ts";
import {LocalStorageProvider} from "../dataProviders/LocalStorageProvider.ts";
import {GlobalEventHandler} from "../dataProviders/GlobalEventHandler.ts";

function MapPage(): JSX.Element {


    return <MapComponent dataProvider={DataProvider.getInstance()}
                         eventHandler={GlobalEventHandler.getInstance()}
                         keyValueStore={new LocalStorageProvider()}
                         showSettings={true}/>;
}

export default MapPage;