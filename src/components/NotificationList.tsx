import { useNotifications } from "../contexts/NotificationContext";
import { Notification } from "../enitities/Notification";

export function NotificationList() {
    const notifications: Notification[] = useNotifications();

    return <div className="event-list">
        {notifications.sort((a, b) => b.getTimestamp() - a.getTimestamp()).map((notification, index) => (
            <NotificationItem key={index} notification={notification} />
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
                <span style={{ fontWeight: 'bold' }}>{notification.getTitle()}</span>
                <span style={{ fontSize: '0.8em', color: '#666' }}>
                    {new Date(notification.getTimestamp()).toLocaleTimeString()}
                </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.9em' }}>{notification.getContent()}</p>
        </div>
    );
}