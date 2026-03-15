/*
 * MapStyle.ts
 * -----------
 * Encapsulates a map style (MapLibre/Mapbox style) with helper to return URL.
 * Exports: MapStyle class
 * Purpose: provide id, name, and URL and integrate with DataProvider updates.
 */

import {type DBRecord, AbstractEntity, type IAbstractEntity} from './AbstractEntity.ts';


export interface IMapStyle extends IAbstractEntity{
    name: string;
    url: string;
    cacheUrl: string;
}

export class MapBaseLayer extends AbstractEntity {
    private name: string;
    private url: string;
    private cacheUrl: string;


    constructor(data: IMapStyle) {
        super(data.id, data.createdAt, data.updatedAt, data.permissions);
        this.name = data.name;
        this.url = data.url;
        this.cacheUrl = data.cacheUrl;
    }

    public static of(data: DBRecord): MapBaseLayer {
        return new MapBaseLayer({
            id: data.id as string,
            name: data.name as string,
            url: data.url as string,
            cacheUrl: data.cacheUrl as string,
            createdAt: new Date(data.createdAt as string).getTime(),
            updatedAt: new Date(data.updatedAt as string).getTime(),
            permissions: data.permissions as string[],
        });
    }

    public record(): DBRecord {
        return {
            ...super.record(),
            name: this.name,
            url: this.url,
            cacheUrl: this.cacheUrl,
        };
    }

    public getName(): string {
        return this.name;
    }

    public getUrl(): string {
        return this.url;
    }

    public setUrl(url: string) {
        this.url = url;
    }

    public setName(name: string) {
        this.name = name;
    }
    
    public getCacheUrl(): string {
        return this.cacheUrl;
    }

    public setCacheUrl(cacheUrl: string) {
        this.cacheUrl = cacheUrl;
    }
}