import { Chip } from "@mui/material";
import { Notification } from "../enitities/Notification";
import { useEffect, useState } from "react";
import { ApiProviderEventTypes } from "../dataProviders/ApiProvider";
import { GlobalEventHandler } from "../dataProviders/GlobalEventHandler";



export function NavBarNotificationDisplay() {
    const [notifications, setNotifications] = useState<Notification[]>([]);


    const handleNewNotification = (notification: Notification, timeout: number) => {
        setNotifications(prev => [...prev, notification]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n !== notification));
        }, timeout);
    };

    const onEvent = () => {
        const notification = new Notification({
            title: 'Forbidden',
            content: 'You do not have permission to access this resource.',
            timestamp: Date.now(),
            id: `forbidden-${Date.now()}`,
            permissions: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
        handleNewNotification(notification, 5000);
    };
    useEffect(() => {

        GlobalEventHandler.getInstance().on(ApiProviderEventTypes.FORBIDDEN, onEvent);

        return () => {
            GlobalEventHandler.getInstance().off(ApiProviderEventTypes.FORBIDDEN, onEvent);
        }
    }, []);


    return (
        <div style={{
            position: 'fixed',
            top: '120px',
            left: '5px',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
        }}>
            {notifications.map((notification, index) => (
                <Chip key={index} label={notification.getContent()} color="warning" />
            ))}
        </div>
    );
}