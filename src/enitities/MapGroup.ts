


import {type DBRecord, Entity} from './Entity.ts';


export class MapGroup extends Entity {
    private name: string;
    private description: string;
    private id: string;

    constructor(data: {name: string; description: string; id: string} = {name: '', description: '', id: ''}) {
        super();
        this.name = data.name;
        this.description = data.description;
        this.id = data.id;
    }

    public static of(data: DBRecord): MapGroup {
        const group = new MapGroup();
        group.id = data.id as string;
        group.name = data.name as string;
        group.description = data.description as string;
        return group;
    }

    public record(): DBRecord {
        return {
            id: this.id,
            name: this.name,
            description: this.description
        };
    }

    public getID(): string {
        return this.id;
    }

    public getName(): string {
        return this.name;
    }

    public getDescription(): string {
        return this.description;
    }

    public setName(name: string) {
        this.name = name;
    }

    public setDescription(description: string) {
        this.description = description;
    }

    public setId(id: string) {
        this.id = id;
    }

}