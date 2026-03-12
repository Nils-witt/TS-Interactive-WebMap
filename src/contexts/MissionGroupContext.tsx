import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { DataProvider, DataProviderEventType } from '../dataProviders/DataProvider.ts';
import { GlobalEventHandler } from '../dataProviders/GlobalEventHandler.ts';
import { ApiProvider } from '../dataProviders/ApiProvider.ts';
import { type MissionGroup } from '../enitities/MissionGroup.ts';
import { DataBaseContext } from './DataBaseContext.tsx';

export const MissionGroupContext = createContext<MissionGroup[]>([]);

export function MissionGroupProvider({ children }: { children: ReactNode }) {

    const databaseProvider = useContext(DataBaseContext);
    const [missionGroups, setMissionGroups] = useState<MissionGroup[]>(
        () => Array.from(DataProvider.getInstance().getAllMissionGroups().values())
    );

    useEffect(() => {
        const dp = DataProvider.getInstance();
        const refresh = () => setMissionGroups(Array.from(dp.getAllMissionGroups().values()));

        const events = [
            DataProviderEventType.MISSION_GROUPS_CREATED,
            DataProviderEventType.MISSION_GROUPS_UPDATED,
            DataProviderEventType.MISSION_GROUPS_DELETED,
        ] as const;
        events.forEach((e) => GlobalEventHandler.getInstance().on(e, refresh));
        if (!databaseProvider) {
            console.error('MissionGroupProvider: DatabaseProvider not available in context');
            return;
        }
        void databaseProvider.loadAllMissionGroups().then((result) => {
            Object.values(result).forEach((g) => dp.addMissionGroup(g));
            refresh();
            return ApiProvider.getInstance()
                .loadAllMissionGroups()
                .then((remote) => {
                    Object.values(remote).forEach((g) => dp.addMissionGroup(g));
                    void databaseProvider.replaceAllMissionGroups(Object.values(remote));
                    refresh();
                })
                .catch((e) => console.error('MissionGroupContext: remote load failed', e));
        }).catch((e) => console.error('MissionGroupContext: DB load failed', e))


        return () => events.forEach((e) => GlobalEventHandler.getInstance().off(e, refresh));
    }, [databaseProvider]);

    return (
        <MissionGroupContext.Provider value={missionGroups}>{children}</MissionGroupContext.Provider>
    );
}

export function useMissionGroups(): MissionGroup[] {
    return useContext(MissionGroupContext);
}
