import {
  AbstractEntity,
  type DBRecord,
  type IAbstractEntity,
} from './AbstractEntity';
import type { EmbeddablePosition } from './embeddables/EmbeddablePosition';

export interface IMissionGroup extends IAbstractEntity {
  name: string;
  endTime: string | null;
  mapGroupIds: string[];
  position: EmbeddablePosition | null;
  startTime: string;
  unitIds: string[];
}

export class MissionGroup extends AbstractEntity {
  private name: string;
  private endTime: Date | null;
  private mapGroupIds: string[];
  private position: EmbeddablePosition | null;
  private startTime: Date;
  private unitIds: string[];

  constructor(data: IMissionGroup) {
    super(data.id, data.createdAt, data.updatedAt, data.permissions);
    this.name = data.name;
    this.endTime = data.endTime ? new Date(data.endTime) : null;
    this.mapGroupIds = data.mapGroupIds;
    this.position = data.position;
    this.startTime = new Date(data.startTime);
    this.unitIds = data.unitIds;
  }

  public static of(data: DBRecord): MissionGroup {
    return new MissionGroup({
      id: data.id as string,
      createdAt: new Date(data.createdAt as string).toISOString(),
      updatedAt: new Date(data.updatedAt as string).toISOString(),
      permissions: data.permissions as string[],
      name: data.name as string,
      endTime: data.endTime
        ? new Date(data.endTime as number).toISOString()
        : null,
      mapGroupIds: data.mapGroupIds as string[],
      position: data.position as EmbeddablePosition | null,
      startTime: new Date(data.startTime as string).toISOString(),
      unitIds: data.unitIds as string[],
    });
  }

  record(): DBRecord {
    return {
      ...super.record(),
      name: this.name,
      endTime: this.endTime ? this.endTime.toISOString() : null,
      mapGroupIds: this.mapGroupIds,
      position: this.position,
      startTime: this.startTime.toISOString(),
      unitIds: this.unitIds,
    };
  }

  clone(): MissionGroup {
    return new MissionGroup({
      id: this.getId(),
      createdAt: this.getCreatedAt().toISOString(),
      updatedAt: this.getUpdatedAt().toISOString(),
      permissions: this.getPermissions(),
      name: this.name,
      endTime: this.endTime ? this.endTime.toISOString() : null,
      mapGroupIds: [...this.mapGroupIds],
      position: this.position ? this.position.clone() : null,
      startTime: this.startTime.toISOString(),
      unitIds: [...this.unitIds],
    });
  }

  getName(): string {
    return this.name;
  }

  getEndTime(): Date | null {
    return this.endTime;
  }

  getMapGroupIds(): string[] {
    return this.mapGroupIds;
  }

  getPosition(): EmbeddablePosition | null {
    return this.position;
  }

  getStartTime(): Date {
    return this.startTime;
  }

  getUnitIds(): string[] {
    return this.unitIds;
  }

  setName(name: string): void {
    this.name = name;
  }

  setEndTime(endTime: Date | null): void {
    this.endTime = endTime;
  }

  setMapGroupIds(mapGroupIds: string[]): void {
    this.mapGroupIds = mapGroupIds;
  }

  setPosition(position: EmbeddablePosition | null): void {
    this.position = position;
  }

  setStartTime(startTime: Date): void {
    this.startTime = startTime;
  }

  setUnitIds(unitIds: string[]): void {
    this.unitIds = unitIds;
  }
}
