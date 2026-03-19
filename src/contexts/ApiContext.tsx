import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type JSX,
  type ReactNode,
} from 'react';
import { ApiProvider } from '../dataProviders/ApiProvider';
import {
  DataProvider,
  DataProviderEvent,
  DataProviderEventType,
} from '../dataProviders/DataProvider';
import { useAuth } from 'react-oidc-context';
import { WebSocketProvider } from '../dataProviders/WebSocketProvider';
import { DataBaseContext } from './DataBaseContext';

export const ApiContext = createContext<ApiProvider>(
  new ApiProvider(DataProvider.getInstance().getApiUrl(), undefined),
);

export function ApiContextProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const auth = useAuth();
  const databaseProvider = useContext(DataBaseContext);

  const [localApiToken, setLocalApiToken] = useState<string | undefined>(
    DataProvider.getInstance().getLocalApiToken(),
  );

  const apiUrl = useMemo(() => DataProvider.getInstance().getApiUrl(), []);
  const apiToken = useMemo(() => {
    if (auth.isAuthenticated) {
      return auth.user?.access_token;
    }
    return localApiToken;
  }, [auth, localApiToken]);

  const apiProvider = useMemo(() => {
    const instance = new ApiProvider(apiUrl, apiToken);
    return instance;
  }, [apiUrl, apiToken]);

  useEffect(() => {
    const onChange = (event: DataProviderEvent) => {
      console.log('API token updated, refreshing API provider', event);
      const token = event.data as string | undefined;
      if (token !== localApiToken) {
        setLocalApiToken(token);
      }
    };

    DataProvider.getInstance().on(
      DataProviderEventType.LOCAL_API_TOKEN_UPDATED,
      onChange,
    );

    return () => {
      DataProvider.getInstance().off(
        DataProviderEventType.LOCAL_API_TOKEN_UPDATED,
        onChange,
      );
    };
  }, []);

  useEffect(() => {
    if (!databaseProvider) return;
    const webSocketProvider = WebSocketProvider.getInstance();
    webSocketProvider.setDatabaseProvider(databaseProvider);
    if (!apiToken || !apiUrl) {
      console.log(
        'API token or URL not set, not starting WebSocket connection',
      );
      webSocketProvider.stop();
      return;
    }
    webSocketProvider.updateConnectionDetails(apiToken || '', apiUrl);
    webSocketProvider.start();
  }, [apiUrl, apiToken, databaseProvider]);

  return (
    <ApiContext.Provider value={apiProvider}>{children}</ApiContext.Provider>
  );
}

export function useApi(): ApiProvider {
  return useContext(ApiContext);
}
