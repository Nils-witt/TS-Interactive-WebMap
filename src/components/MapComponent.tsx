import * as React from 'react';
import {useEffect} from 'react';
import {GeolocateControl, Map as MapLibreMap, NavigationControl} from '@vis.gl/react-maplibre';
import {ApiProvider} from "../dataProviders/ApiProvider";
import ReactLayerControl from "../controls/LayerControl";
import ReactSearchControl from "../controls/SearchControl";
import {DataProvider, DataProviderEventType} from "../dataProviders/DataProvider";
import {GlobalEventHandler} from "../dataProviders/GlobalEventHandler";
import {MapSettings} from "./SettingsComponent";
import ReactButtonControl from "../controls/ButtonControl";
import {faGear} from "@fortawesome/free-solid-svg-icons/faGear";
import type {MapStyle} from "../enitities/MapStyle.ts";
import type {Overlay} from "../enitities/Overlay.ts";
import type {StorageInterface} from "../dataProviders/StorageInterface.ts";
import {DatabaseProvider} from "../dataProviders/DatabaseProvider.ts";
import type {KeyValueInterface} from "../dataProviders/KeyValueInterface.ts";

interface MapComponentProps {
    keyValueStore: KeyValueInterface;
    dataProvider: DataProvider;
    eventHandler: GlobalEventHandler;
    showSettings?: boolean;
}

export function MapComponent(props: MapComponentProps) {
    const {keyValueStore, dataProvider, eventHandler} = props;

    const mapCenter: [number, number] = localStorage.getItem('mapCenter') ? JSON.parse(localStorage.getItem('mapCenter') || "[7.1545,50.7438]") as [number, number] : [7.1545, 50.7438];

    const mapMoved = (e: { viewState: { longitude: number, latitude: number, zoom: number } }) => {
        void keyValueStore.setItem('mapCenter', JSON.stringify([e.viewState.longitude, e.viewState.latitude]));
        void keyValueStore.setItem('mapZoom', JSON.stringify(e.viewState.zoom));
    }

    const [mapStyle, setMapStyle] = React.useState<MapStyle | null>(null);
    const [settingsOpen, setSettingsOpen] = React.useState<boolean>(false);

    useEffect(() => {
        const mapStyle = DataProvider.getInstance().getMapStyle()
        if (mapStyle != undefined) {
            setMapStyle(mapStyle);
        }
        DataProvider.getInstance().on(DataProviderEventType.MAP_STYLE_UPDATED, (event) => {
            setMapStyle(event.data as MapStyle);
        });

        void DatabaseProvider.getInstance().then(localStorage => {
            const remoteStorage: StorageInterface = ApiProvider.getInstance();
            void remoteStorage.loadAllMapStyles().then((result: Record<string, MapStyle>) => {
                if (Object.entries(result).length > 0) {
                    DataProvider.getInstance().setMapStyle(Object.entries(result)[0][1]);
                    void localStorage.saveMapStyle(Object.entries(result)[0][1]);

                    void localStorage.loadAllMapStyles().then(localStyles => {
                        const remoteStyles = Object.values(result);
                        for (const s of Object.values(localStyles)) {
                            if (!remoteStyles.find(rs => rs.getID() === s.getID())) {
                                void localStorage.deleteMapStyle(s.getID());
                            }
                        }
                    });
                } else {
                    void localStorage.loadAllMapStyles().then(styles => {
                        for (const s of Object.values(styles)) {
                            void localStorage.deleteMapStyle(s.getID());
                        }
                    });
                }
            });
            void remoteStorage.loadAllOverlays().then((result: Record<string, Overlay>) => {
                const remoteOverlays = Object.values(result);
                remoteOverlays.forEach((overlay: Overlay) => {
                    DataProvider.getInstance().addOverlay(overlay);
                    void localStorage.saveOverlay(overlay);
                });
                void localStorage.loadAllOverlays().then(localOverlays => {
                    for (const s of Object.values(localOverlays)) {
                        if (!remoteOverlays.find(rs => rs.getId() === s.getId())) {
                            void localStorage.deleteOverlay(s.getId());
                        }
                    }
                });
            });

            void remoteStorage.loadAllNamedGeoReferencedObjects().then(result => {
                const remoteObjects = Object.values(result);
                console.log(remoteObjects);
            });
        })


    }, []);

    if (!mapStyle) {
        return <div>Loading...</div>;
    }

    return (
        <MapLibreMap
            initialViewState={{
                longitude: mapCenter[0],
                latitude: mapCenter[1],
                zoom: 14
            }}
            style={{width: '100vw', height: '100vh'}}
            mapStyle={mapStyle.getUrl()}
            attributionControl={false}
            onMoveEnd={mapMoved}
        >
            <GeolocateControl/>
            <NavigationControl/>
            <ReactLayerControl position="bottom-left" dataProvider={dataProvider}/>
            <ReactSearchControl position="top-left" dataProvider={dataProvider} globalEventHandler={eventHandler}/>
            {props.showSettings &&
                <ReactButtonControl onClick={() => setSettingsOpen(true)} position={"bottom-left"}
                                    icon={faGear}></ReactButtonControl>}
            {settingsOpen && <MapSettings isOpen={[settingsOpen, setSettingsOpen]}/>}
        </MapLibreMap>
    )
}