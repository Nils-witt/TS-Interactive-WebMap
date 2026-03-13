import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { DataProvider, DataProviderEventType } from '../dataProviders/DataProvider.ts';
import { GlobalEventHandler } from '../dataProviders/GlobalEventHandler.ts';
import { DataBaseContext } from './DataBaseContext.tsx';
import { Notification } from '../enitities/Notification.ts';

export const NotificationsContext = createContext<Notification[]>([]);

/**
 *  Currently no APi connection is used
 * @param param0 
 * @returns 
 */
export function NotificationsProvider({ children }: { children: ReactNode }) {

    const databaseProvider = useContext(DataBaseContext);
    const [notifications, setNotifications] = useState<Notification[]>(
        () => Array.from(DataProvider.getInstance().getAllNotifications().values())
    );

    useEffect(() => {
        const dp = DataProvider.getInstance();
        const refresh = () => setNotifications(Array.from(dp.getAllNotifications().values()));

        const events = [
            DataProviderEventType.NOTIFICATION_CREATED,
            DataProviderEventType.NOTIFICATION_UPDATED,
            DataProviderEventType.NOTIFICATION_DELETED,
        ] as const;
        events.forEach((e) => GlobalEventHandler.getInstance().on(e, refresh));

        if (!databaseProvider) {
            console.error('NotificationsProvider: DatabaseProvider not available in context');
            return;
        }
        void databaseProvider.loadAllNotifications().then((result) => {
            Object.values(result).forEach((notification) => dp.addNotification(notification));
            refresh();
        }).catch((e) => console.error('NotificationsProvider: DB load failed', e))

        return () => events.forEach((e) => GlobalEventHandler.getInstance().off(e, refresh));
    }, [databaseProvider]);

    return (
        <NotificationsContext.Provider value={notifications}>{children}</NotificationsContext.Provider>
    );
}

export function useNotifications(): Notification[] {
    return useContext(NotificationsContext);
}
