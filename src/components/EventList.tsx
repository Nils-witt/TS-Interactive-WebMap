import { Unit } from "../enitities/Unit";


export interface ActionEvent {
    unit: Unit;
    timestamp: Date;
    text: string;
}

export interface EventListProps {
    events?: ActionEvent[];
}

export function EventList(props: EventListProps) {

    return <div className="event-list">
        {props.events?.map((event, index) => (
        <EventItem key={index} event={event}/>
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