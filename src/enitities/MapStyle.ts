import {Entity} from "./Entity.ts";
import type {MapStyleDBEntry} from "../dataProviders/DatabaseProvider.ts";


export class MapStyle extends Entity {
    private id: string;
    private name: string
    private url: string;


    constructor() {
        super();
        this.id = '';
        this.name = '';
        this.url = '';
    }

    public static of(data: MapStyleDBEntry): MapStyle {
        const style = new MapStyle();
        style.id = data.id;
        style.name = data.name;
        style.url = data.url;
        return style;
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