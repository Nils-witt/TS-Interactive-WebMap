


import { type DBRecord, type IAbstractEntity, AbstractEntity } from './AbstractEntity.ts';


export interface IMapGroup extends IAbstractEntity {
    name: string;
    description: string;
}

export class MapGroup extends AbstractEntity {
    private name: string;
    private description: string;

    constructor(data: IMapGroup) {
        super(data.id, data.createdAt, data.updatedAt, data.permissions);
        this.name = data.name;
        this.description = data.description;
    }

    public static of(data: DBRecord): MapGroup {
        const group = new MapGroup({
            id: data.id as string,
            name: data.name as string,
            description: data.description as string,
            createdAt: new Date(data.createdAt as string).getTime(),
            updatedAt: new Date(data.updatedAt as string).getTime(),
            permissions: data.permissions as string[],
        });
        return group;
    }

    public record(): DBRecord {
        return {
            ...super.record(),
            name: this.name,
            description: this.description
        };
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

}