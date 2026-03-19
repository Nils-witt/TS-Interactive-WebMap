import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { User } from '../enitities/User.ts';
import { UsersContext } from './UsersContext.tsx';
import { useApi } from './ApiContext.tsx';

export const ActiveUserContext = createContext<User | null>(null);

export function ActiveUserProvider({ children }: { children: ReactNode }) {
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const users = useContext(UsersContext);

  const apiProvider = useApi();

  useEffect(() => {

    const storedUserId = localStorage.getItem('activeUserId');
    if (storedUserId) {
      setUserId(storedUserId);
    }

    apiProvider.getCurrentUserId().then((id) => {
      setUserId(id);
    }).catch((error) => {
      console.error('Error fetching current user ID:', error);
    });

    
  }, [apiProvider]);

  useEffect(() => {
    if (userId) {
      localStorage.setItem('activeUserId', userId);
    }
  }, [userId]);

  useEffect(() => {
    users.forEach((u) => {
      if (u.getId() === userId) {
        setActiveUser(u);
      }
    });
  }, [users, userId]);

  return (
    <ActiveUserContext.Provider value={activeUser}>
      {children}
    </ActiveUserContext.Provider>
  );
}

export function useActiveUser(): User | null {
  return useContext(ActiveUserContext);
}
