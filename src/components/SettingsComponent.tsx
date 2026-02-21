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
import {DataProvider, DataProviderEventType} from "../dataProviders/DataProvider.ts";
import CacheProvider from "../dataProviders/CacheProvider.ts";
import {Input, Popover, Table, TableBody, TableCell, TableHead, TableRow, Typography} from "@mui/material";
import type {MapOverlay} from "../enitities/MapOverlay.ts";
import {MapConfig} from "../enitities/MapConfig.ts";


interface MapSettingsProps {
    isOpen: [boolean, React.Dispatch<React.SetStateAction<boolean>>]
}


function LayerTableRow(props: { overlay: MapOverlay }): ReactElement {
    const btnRef = useRef<HTMLButtonElement | null>(null);
    const [order, setOrder] = React.useState<number>(props.overlay.getOrder());
    const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);

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

    const openInfo = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const open = Boolean(anchorEl);
    const handleClose = () => {
        setAnchorEl(null);
    };
    const id = open ? 'simple-popover' : undefined;

    return (
        <TableRow key={props.overlay.getId()}>

            <TableCell>{props.overlay.getName()} ({props.overlay.getLayerVersion()})</TableCell>
            <TableCell>
                <Input type={'number'} defaultValue={order}
                       onChange={(e) => setOrder(parseInt(e.target.value))}></Input>
            </TableCell>
            <TableCell>
                <ButtonGroup>
                    <Button ref={btnRef} size={'small'} onClick={() => void downloadLayer()}>Download</Button>
                    <Button size={'small'} onClick={openInfo}>Info</Button>
                    <Popover
                        id={id}
                        open={open}
                        anchorEl={anchorEl}
                        onClose={handleClose}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'center',
                        }}
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'center',
                        }}
                    >
                        <Typography sx={{ p: 2 }}>{props.overlay.getUrl()}</Typography>
                    </Popover>
                </ButtonGroup>
            </TableCell>
        </TableRow>
    )

}

export function MapSettings(props: MapSettingsProps): ReactElement {

    const [overlays, setOverlays] = React.useState<MapOverlay[]>([]);
    const [unitIconSize, setUnitIconSizeState] = React.useState<string>();
    const [mapConfig, setMapConfig] = React.useState<MapConfig>();

    const closeMenu = () => {
        props.isOpen[1](false);
    }
    const updateOverlays = () => {
        const overlays = Array.from(DataProvider.getInstance().getOverlays().values());
        setOverlays(overlays)
    }

    useEffect(() => {
        DataProvider.getInstance().on(DataProviderEventType.OVERLAY_ADDED, updateOverlays);
        DataProvider.getInstance().on(DataProviderEventType.OVERLAY_UPDATED, updateOverlays);
        updateOverlays();
        const lcConfig = DataProvider.getInstance().getMapConfig()
        setMapConfig(lcConfig)
        setUnitIconSizeState(lcConfig.getUnitIconSize().toString());
        DataProvider.getInstance().on(DataProviderEventType.MAP_CONFIG_UPDATED, (event) => {
            const config: MapConfig = event.data as MapConfig;
            setMapConfig(config);
            setUnitIconSizeState(config.getUnitIconSize().toString());
        });
    }, []);

    useEffect(() => {
        if (mapConfig) {
            mapConfig.setUnitIconSize(parseInt(unitIconSize || "0"));
            setMapConfig(mapConfig);
            DataProvider.getInstance().setMapConfig(mapConfig);
        }
    }, [unitIconSize]);


    return (<div className={'settings-container-background'}>
        <div className={'settings-container'}>
            <div>
                <div onClick={closeMenu}>
                    <FontAwesomeIcon icon={faX}/>
                </div>
            </div>

            <div><ButtonGroup variant={'outlined'} color={'warning'}>
                <Button variant={'outlined'} size={'small'} onClick={() => Utilities.logout()}>Logout</Button>
                <Button size={'small'} onClick={() => {
                    void Utilities.clearMapCache()
                }}>Clear Map Cache</Button>
                <Button size={'small'} onClick={() => {
                    void Utilities.clearCache()
                }}>Clear full Cache</Button>
                <Button size={'small'} onClick={() => window.location.reload()}>Reload</Button>
            </ButtonGroup>

            </div>
            <div>
                Icon Size:
                <Input value={unitIconSize} onChange={event => setUnitIconSizeState(event.target.value)}></Input>
            </div>
            <div>
                <Table size="small" aria-label="a dense table">
                    <TableHead>
                        <TableRow>
                            <TableCell>Available Overlays</TableCell>
                            <TableCell>Layer Order</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {overlays.map((overlay) => (
                            <LayerTableRow key={overlay.getId()} overlay={overlay}></LayerTableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    </div>)

}