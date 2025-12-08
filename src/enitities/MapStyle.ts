import {type DBRecord, Entity} from "./Entity.ts";


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

    public static of(data: DBRecord): MapStyle {
        const style = new MapStyle();
        style.id = data.id as string;
        style.name = data.name as string;
        style.url = data.url as string;
        return style;
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