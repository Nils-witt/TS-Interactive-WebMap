import { type JSX, useEffect, useState } from "react";
import { WebSocketProvider } from "../dataProviders/WebSocketProvider"

import './css/WebsocketStatusDisplay.scss';


export function WebsocketStatusDisplay(): JSX.Element {
    const wsProvider = WebSocketProvider.getInstance();
    const [isErrored, setIsErrored] = useState<boolean>(true);

    useEffect(() => {
        const handleOpen = () => setIsErrored(false);
        const handleError = () => setIsErrored(true);
        const handleClose = () => setIsErrored(true);

        wsProvider.on('open', handleOpen);
        wsProvider.on('error', handleError);
        wsProvider.on('close', handleClose);
        
        if(wsProvider.isConnected()) {
            setIsErrored(false);
        }else {
            setIsErrored(true);
        }
        return () => {
            wsProvider.off('open', handleOpen);
            wsProvider.off('error', handleError);
            wsProvider.off('close', handleClose);
        };
    }, []);
    return (
        <>
            {isErrored ? (
                <div className="ws-error-box">
                    Live connection lost.
                </div>
            ) : (<></>)}
        </>
    )
}