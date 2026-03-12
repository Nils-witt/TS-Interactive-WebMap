import { useEffect, useState } from "react";
import { Unit } from "../enitities/Unit";
import { DataProvider, DataProviderEvent, DataProviderEventType } from "../dataProviders/DataProvider";


export interface ActionEvent {
    unit: Unit;
    timestamp: Date;
    text: string;
}

export function EventList() {
    const [events, setEvents] = useState<ActionEvent[]>([]);

    const unitChangedHandler = (event: DataProviderEvent) => {
        console.log("Unit updated:", event.data, "Old Unit:", event.oldData);
        if (event.oldData){
            const oldUnit = event.oldData as Unit;
            const newUnit = event.data as Unit;
            if (oldUnit.getStatus() !== newUnit.getStatus()) {
                setEvents(prevEvents => [
                    {
                        unit: newUnit,
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
            <EventItem key={index} event={event} />
        ))}
    </div>;
}




function EventItem({ event }: { event: ActionEvent }) {
    return (
        <div style={{
            border: '1px solid #ccc',
            borderRadius: '6px',
            padding: '8px 12px',
            marginBottom: '8px',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold' }}>{event.unit.getName()}</span>
                <span style={{ fontSize: '0.8em', color: '#666' }}>
                    {event.timestamp.toLocaleTimeString()}
                </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.9em' }}>{event.text}</p>
        </div>
    );
}