import { AbstractEntity, type DBRecord, type IAbstractEntity } from './AbstractEntity';
import type { EmbeddablePosition } from './embeddables/EmbeddablePosition';


export interface IMissionGroup extends IAbstractEntity {
    name: string;
    endTime: string | null,
    mapGroupIds: string[],
    position: EmbeddablePosition | null,
    startTime: string,
    unitIds: string[],
}

export class MissionGroup extends AbstractEntity {
    private name: string;
    private endTime: string | null;
    private mapGroupIds: string[];
    private position: EmbeddablePosition | null;
    private startTime: string;
    private unitIds: string[];

    constructor(data: IMissionGroup) {
        super(data.id, data.createdAt, data.updatedAt, data.permissions);
        this.name = data.name;
        this.endTime = data.endTime;
        this.mapGroupIds = data.mapGroupIds;
        this.position = data.position;
        this.startTime = data.startTime;
        this.unitIds = data.unitIds;
    }

    public static of(data: DBRecord): MissionGroup {
        return new MissionGroup({
            id: data.id as string,
            createdAt: new Date(data.createdAt as string).getTime(),
            updatedAt: new Date(data.updatedAt as string).getTime(),
            permissions: data.permissions as string[],
            name: data.name as string,
            endTime: data.endTime as string | null,
            mapGroupIds: data.mapGroupIds as string[],
            position: data.position as EmbeddablePosition | null,
            startTime: data.startTime as string,
            unitIds: data.unitIds as string[],
        });
    }


    record(): DBRecord {
        return {
            ...super.record(),
            name: this.name,
            endTime: this.endTime,
            mapGroupIds: this.mapGroupIds,
            position: this.position,
            startTime: this.startTime,
            unitIds: this.unitIds,
        };
    }

    getName(): string {
        return this.name;
    }

    getEndTime(): string | null {
        return this.endTime;
    }

    getMapGroupIds(): string[] {
        return this.mapGroupIds;
    }

    getPosition(): EmbeddablePosition | null {
        return this.position;
    }

    getStartTime(): string {
        return this.startTime;
    }

    getUnitIds(): string[] {
        return this.unitIds;
    }
}