import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { User } from '../enitities/User.ts';
import { UsersContext } from './UsersContext.tsx';

export const ActiveUserContext = createContext<User | null>(null);

export function ActiveUserProvider({ children }: { children: ReactNode }) {
    const [activeUser, setActiveUser] = useState<User | null>(null);
    const users = useContext(UsersContext);
    const userId = localStorage.getItem('activeUser');

    useEffect(() => {
        users.forEach((u) => {
            if (u.getId() === userId) {
                setActiveUser(u);
            }
        });
    }, [users]);

    return (
        <ActiveUserContext.Provider value={activeUser}>{children}</ActiveUserContext.Provider>
    );
}

export function useActiveUser(): User | null {
    return useContext(ActiveUserContext);
}
