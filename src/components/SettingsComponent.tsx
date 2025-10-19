import React, {type ReactElement, useEffect} from "react";
import '../css/settingsControl.scss'
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faX} from '@fortawesome/free-solid-svg-icons'
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import {Utilities} from "../Utilities";
import type {LayerInfo} from "../types/LayerInfo.ts";
import {DataProvider} from "../dataProviders/DataProvider.ts";
import {CacheProvider} from "../dataProviders/CacheProvider.ts";
import {useRef} from 'react';


interface MapSettingsProps {
    isOpen: [boolean, React.Dispatch<React.SetStateAction<boolean>>]
}


function LayerTableRow(props: { overlay: LayerInfo }): ReactElement {
    const btnRef = useRef<HTMLButtonElement | null>(null);

    const downloadLayer = async () => {
        if (btnRef.current) {
            btnRef.current.disabled = true;
            btnRef.current.innerText = "Downloading...";
            await CacheProvider.getInstance().cacheLayer(props.overlay, btnRef.current);

        } else {
            await CacheProvider.getInstance().cacheLayer(props.overlay);
        }

    }

    useEffect(() => {
        void CacheProvider.getInstance().getOverlayCacheState(props.overlay).then(res => {
            if (btnRef.current) {
                if (res.missing.length === 0) {

                    btnRef.current.disabled = true;
                    btnRef.current.innerText = "Downloaded";
                } else {
                    btnRef.current.disabled = false;
                    btnRef.current.innerText = `Download (${res.missing.length} / ${res.remoteTiles.length} tiles)`;
                }
            }
        })

    }, []);

    return (
        <tr key={props.overlay.getId()}>
            <td>{props.overlay.getName()}</td>
            <td>
                <ButtonGroup>
                    <Button ref={btnRef} size={'small'} onClick={() => void downloadLayer()}>Download</Button>
                </ButtonGroup>
            </td>
        </tr>
    )

}

export function MapSettings(props: MapSettingsProps): ReactElement {

    const [overlays, setOverlays] = React.useState<LayerInfo[]>([]);

    const closeMenu = () => {
        props.isOpen[1](false);
    }

    useEffect(() => {
        const overlays = Array.from(DataProvider.getInstance().getOverlays().values());
        setOverlays(overlays)
        console.log(DataProvider.getInstance().getOverlays().values().toArray())
    }, [])

    return (<div className={'settings-container-background'}>
        <div className={'settings-container'}>
            <div>
                <div onClick={closeMenu}>
                    <FontAwesomeIcon icon={faX}/>
                </div>
            </div>

            <div>
                <Button variant={'outlined'} size={'small'} onClick={() => Utilities.logout()}>Logout</Button>
            </div>
            <div>
                <ButtonGroup variant={'outlined'} color={'warning'}>
                    <Button size={'small'} onClick={() => {
                        void Utilities.clearMapCache()
                    }}>Clear Map Cache</Button>
                    <Button size={'small'} onClick={() => {
                        void Utilities.clearCache()
                    }}>Clear full Cache</Button>
                </ButtonGroup>
            </div>
            <div>
                <table>
                    <thead>
                    <tr>
                        <td>Available Overlays</td>
                    </tr>
                    </thead>
                    <tbody>
                    {overlays.map((overlay) => (
                        <LayerTableRow key={overlay.getId()} overlay={overlay}></LayerTableRow>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>)

}