/*
 * SettingsComponent.tsx
 * ---------------------
 * Provides a settings panel used by the Map application. Exports MapSettings.
 * Purpose: present map and application settings (map styles, overlays management, persistence)
 * Exports: MapSettings component which accepts an `isOpen` tuple state [boolean, setter]
 * Notes: UI-only component that calls into DataProvider and KeyValue stores via props / global singletons.
 */

import React, {type ReactElement, useEffect, useRef} from "react";
import './css/settingsControl.scss'
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faX} from '@fortawesome/free-solid-svg-icons'
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import {Utilities} from "../Utilities";
import {DataProvider} from "../dataProviders/DataProvider.ts";
import CacheProvider from "../dataProviders/CacheProvider.ts";
import {Input} from "@mui/material";
import type {Overlay} from "../enitities/Overlay.ts";


interface MapSettingsProps {
    isOpen: [boolean, React.Dispatch<React.SetStateAction<boolean>>]
}


function LayerTableRow(props: { overlay: Overlay }): ReactElement {
    const btnRef = useRef<HTMLButtonElement | null>(null);
    const [order, setOrder] = React.useState<number>(props.overlay.getOrder());

    const downloadLayer = async () => {
        if (btnRef.current) {
            btnRef.current.disabled = true;
            btnRef.current.innerText = "Downloading...";
            await CacheProvider.getInstance().cacheOverlay(props.overlay, btnRef.current);

        } else {
            await CacheProvider.getInstance().cacheOverlay(props.overlay);
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

    useEffect(() => {
        if (order != props.overlay.getOrder()) {
            props.overlay.setOrder(order);
            console.log("Setting order for ", props.overlay.getName(), " to ", order);
        }
    }, [order]);

    return (
        <tr key={props.overlay.getId()}>
            <td>{props.overlay.getName()}</td>
            <td>
                <Input type={'number'} defaultValue={order}
                       onChange={(e) => setOrder(parseInt(e.target.value))}></Input>
            </td>
            <td>
                <ButtonGroup>
                    <Button ref={btnRef} size={'small'} onClick={() => void downloadLayer()}>Download</Button>
                </ButtonGroup>
            </td>

        </tr>
    )

}

export function MapSettings(props: MapSettingsProps): ReactElement {

    const [overlays, setOverlays] = React.useState<Overlay[]>([]);

    const closeMenu = () => {
        props.isOpen[1](false);
    }

    useEffect(() => {
        const overlays = Array.from(DataProvider.getInstance().getOverlays().values());
        setOverlays(overlays)
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
                <ButtonGroup variant={'outlined'}>
                    <Button size={'small'} onClick={() => {
                        void CacheProvider.getInstance().cacheVectorForOverlays()
                    }}>Download Vector Tiles</Button>
                </ButtonGroup>
            </div>
            <div>
                <table>
                    <thead>
                    <tr>
                        <td>Available Overlays</td>
                        <td>Layer Order</td>
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