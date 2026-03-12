import { useEffect, useState } from "react";
import { Unit } from "../enitities/Unit";
import { DataProvider, DataProviderEvent, DataProviderEventType } from "../dataProviders/DataProvider";


export interface Notification {
    timestamp: Date;
    title: string;
    text: string;
}

export function NotificationList() {
    const [events, setEvents] = useState<Notification[]>([]);

    const unitChangedHandler = (event: DataProviderEvent) => {
        console.log("Unit updated:", event.data, "Old Unit:", event.oldData);
        if (event.oldData){
            const oldUnit = event.oldData as Unit;
            const newUnit = event.data as Unit;
            if (oldUnit.getStatus() !== newUnit.getStatus()) {
                setEvents(prevEvents => [
                    {
                        title: newUnit.getName(),
                        timestamp: new Date(),
                        text: `New Status: ${newUnit.getStatus()}`
                    },
                    ...prevEvents
                ]);
            }
        }
    };
    useEffect(() => {
        DataProvider.getInstance().on(DataProviderEventType.UNIT_UPDATED, unitChangedHandler);
        return () => {
            DataProvider.getInstance().off(DataProviderEventType.UNIT_UPDATED, unitChangedHandler);
        };
    }, []);

    return <div className="event-list">
        {events.map((event, index) => (
            <NotificationItem key={index} notification={event} />
        ))}
    </div>;
}

function NotificationItem({ notification }: { notification: Notification }) {
    return (
        <div style={{
            border: '1px solid #ccc',
            borderRadius: '6px',
            padding: '8px 12px',
            marginBottom: '8px',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold' }}>{notification.title}</span>
                <span style={{ fontSize: '0.8em', color: '#666' }}>
                    {notification.timestamp.toLocaleTimeString()}
                </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.9em' }}>{notification.text}</p>
        </div>
    );
}