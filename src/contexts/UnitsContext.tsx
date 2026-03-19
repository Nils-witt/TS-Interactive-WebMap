import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { DataProvider, DataProviderEventType } from '../dataProviders/DataProvider.ts';
import { GlobalEventHandler } from '../dataProviders/GlobalEventHandler.ts';
import { type Unit } from '../enitities/Unit.ts';
import { DataBaseContext } from './DataBaseContext.tsx';
import { useApi } from './ApiContext.tsx';

export const UnitsContext = createContext<Unit[]>([]);

export function UnitsProvider({ children }: { children: ReactNode }) {

    const databaseProvider = useContext(DataBaseContext);
    const apiProvider = useApi();

    const [units, setUnits] = useState<Unit[]>(
        () => Array.from(DataProvider.getInstance().getAllUnits().values())
    );
    const dp = DataProvider.getInstance();
    const refresh = () => setUnits(Array.from(dp.getAllUnits().values()));

    const events = [
        DataProviderEventType.UNIT_ADDED,
        DataProviderEventType.UNIT_UPDATED,
        DataProviderEventType.UNIT_DELETED,
    ] as const;

    useEffect(() => {
        events.forEach((e) => GlobalEventHandler.getInstance().on(e, refresh));

        if (!databaseProvider) {
            console.error('UnitsProvider: DatabaseProvider not available in context');
            return;
        }
        void databaseProvider.loadAllUnits().then((result) => {
            Object.values(result).forEach((unit) => dp.addUnit(unit));
            refresh();
            if (apiProvider.hasToken()) {
                apiProvider
                    .loadAllUnits()
                    .then((remote) => {
                        Object.values(remote).forEach((unit) => {
                            dp.addUnit(unit)
                        }
                        );
                        void databaseProvider.replaceAllUnits(Object.values(remote));
                        refresh();
                    })
                    .catch((e) => console.error('UnitsContext: remote load failed', e));
            }
        }).catch((e) => console.error('UnitsContext: DB load failed', e))

        return () => events.forEach((e) => GlobalEventHandler.getInstance().off(e, refresh));
    }, [databaseProvider, apiProvider]);

    return (
        <UnitsContext.Provider value={units}>{children}</UnitsContext.Provider>
    );
}

export function useUnits(): Unit[] {
    return useContext(UnitsContext);
}
