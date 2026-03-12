import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { DataProvider, DataProviderEventType } from '../dataProviders/DataProvider.ts';
import { GlobalEventHandler } from '../dataProviders/GlobalEventHandler.ts';
import { ApiProvider } from '../dataProviders/ApiProvider.ts';
import { type Photo } from '../enitities/Photo.ts';
import { DataBaseContext } from './DataBaseContext.tsx';

export const PhotoContext = createContext<Photo[]>([]);

export function PhotoProvider({ children }: { children: ReactNode }) {

    const databaseProvider = useContext(DataBaseContext);
    const [photos, setPhotos] = useState<Photo[]>(
        () => Array.from(DataProvider.getInstance().getAllPhotos().values())
    );

    useEffect(() => {
        const dp = DataProvider.getInstance();
        const refresh = () => setPhotos(Array.from(dp.getAllPhotos().values()));

        const events = [
            DataProviderEventType.PHOTO_CREATED,
            DataProviderEventType.PHOTO_UPDATED,
            DataProviderEventType.PHOTO_DELETED,
        ] as const;
        events.forEach((e) => GlobalEventHandler.getInstance().on(e, refresh));

        if (!databaseProvider) {
            console.error('PhotoProvider: DatabaseProvider not available in context');
            return;
        }

        void databaseProvider.loadAllPhotos().then((result) => {
            Object.values(result).forEach((p) => dp.addPhoto(p));
            refresh();
            return ApiProvider.getInstance()
                .loadAllPhotos()
                .then((remote) => {
                    Object.values(remote).forEach((p) => dp.addPhoto(p));
                    void databaseProvider.replaceAllPhotos(Object.values(remote));
                    refresh();
                })
                .catch((e) => console.error('PhotoContext: remote load failed', e));
        }).catch((e) => console.error('PhotoContext: DB load failed', e))


        return () => events.forEach((e) => GlobalEventHandler.getInstance().off(e, refresh));
    }, [databaseProvider]);

    return (
        <PhotoContext.Provider value={photos}>{children}</PhotoContext.Provider>
    );
}

export function usePhotos(): Photo[] {
    return useContext(PhotoContext);
}
