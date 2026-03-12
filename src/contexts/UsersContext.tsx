import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { DataProvider, DataProviderEventType } from '../dataProviders/DataProvider.ts';
import { GlobalEventHandler } from '../dataProviders/GlobalEventHandler.ts';
import { ApiProvider } from '../dataProviders/ApiProvider.ts';
import { type User } from '../enitities/User.ts';
import { DataBaseContext } from './DataBaseContext.tsx';

export const UsersContext = createContext<User[]>([]);

export function UsersProvider({ children }: { children: ReactNode }) {
    const databaseProvider = useContext(DataBaseContext);
    const [users, setUsers] = useState<User[]>(
        () => Array.from(DataProvider.getInstance().getAllUsers().values())
    );

    useEffect(() => {
        const dp = DataProvider.getInstance();
        const refresh = () => setUsers(Array.from(dp.getAllUsers().values()));

        const events = [
            DataProviderEventType.USER_ADDED,
            DataProviderEventType.USER_UPDATED,
            DataProviderEventType.USER_DELETED,
        ] as const;
        events.forEach((e) => GlobalEventHandler.getInstance().on(e, refresh));

        if (!databaseProvider) {
            console.error('UsersProvider: DatabaseProvider not available in context');
            return;
        }

        // 1. Load from IndexedDB
        void databaseProvider.loadAllUsers().then((result) => {
            Object.values(result).forEach((user) => dp.addUser(user));
            refresh();

            // 2. Sync from remote API on top of local data
            return ApiProvider.getInstance()
                .loadAllUsers()
                .then((remote) => {
                    Object.values(remote).forEach((user) => dp.addUser(user));
                    void databaseProvider.replaceAllUsers(Object.values(remote));
                    refresh();
                })
                .catch((e) => console.error('UsersContext: remote load failed', e));
        }).catch((e) => console.error('UsersContext: DB load failed', e));

        return () => events.forEach((e) => GlobalEventHandler.getInstance().off(e, refresh));
    }, [databaseProvider]);

    return (
        <UsersContext.Provider value={users}>{children}</UsersContext.Provider>
    );
}

export function useUsers(): User[] {
    return useContext(UsersContext);
}
