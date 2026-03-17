import { AbstractEntity, type DBRecord, type IAbstractEntity } from './AbstractEntity';


export interface INotification extends IAbstractEntity {
    id: string;
    title: string;
    content: string;
    timestamp: string;
    read?: boolean;
    unitId?: string;
}

export class Notification extends AbstractEntity {
    private title: string;
    private content: string;
    private timestamp: Date;
    private read: boolean;
    private unitId: string | undefined = undefined;

    constructor(data: INotification) {
        super(data.id, data.timestamp, data.timestamp, data.permissions);
        this.title = data.title;
        this.content = data.content;
        this.timestamp = new Date(data.timestamp);
        this.read = data.read || false;
        this.unitId = data.unitId || undefined;
    }

    public static of(data: DBRecord): Notification {
        return new Notification({
            id: data.id as string,
            createdAt: new Date(data.createdAt as string).toISOString(),
            updatedAt: new Date(data.updatedAt as string).toISOString(),
            permissions: data.permissions as string[],
            title: data.title as string,
            content: data.content as string,
            timestamp: data.timestamp as string,
            read: data.read as boolean || false,
            unitId: data.unitId as string || undefined,
        });
    }


    record(): DBRecord {
        return {
            ...super.record(),
            title: this.title,
            content: this.content,
            timestamp: this.timestamp.toISOString(),
            read: this.read,
            unitId: this.unitId || null,
        };
    }

    public clone(): Notification {
        return new Notification({
            id: this.getId(),
            createdAt: this.getCreatedAt().toISOString(),
            updatedAt: this.getUpdatedAt().toISOString(),
            permissions: this.getPermissions(),
            title: this.title,
            content: this.content,
            timestamp: this.timestamp.toISOString(),
            read: this.read,
            unitId: this.unitId || undefined,
        });
    }

    getTitle(): string {
        return this.title;
    }

    getContent(): string {
        return this.content;
    }

    getTimestamp(): Date {
        return this.timestamp;
    }

    isRead(): boolean {
        return this.read;
    }

    markAsRead() {
        this.read = true;
    }

    markAsUnread() {
        this.read = false;
    }

    getUnitId(): string | undefined {
        return this.unitId;
    }
}

