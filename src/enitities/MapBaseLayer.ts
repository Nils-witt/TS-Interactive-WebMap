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
}

export class MapBaseLayer extends AbstractEntity {
    private id: string;
    private name: string;
    private url: string;


    constructor(data: IMapStyle) {
        super();
        this.id = data.id;
        this.name = data.name;
        this.url = data.url;
    }

    public static of(data: DBRecord): MapBaseLayer {
        return new MapBaseLayer({
            id: data.id as string,
            name: data.name as string,
            url: data.url as string
        });
    }

    public record(): DBRecord {
        return {
            id: this.id,
            name: this.name,
            url: this.url
        };
    }

    public getID(): string {
        return this.id;
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

    public setId(id: string) {
        this.id = id;
    }
}