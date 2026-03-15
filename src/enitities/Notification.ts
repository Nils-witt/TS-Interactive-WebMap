import { AbstractEntity, type DBRecord, type IAbstractEntity } from './AbstractEntity';


export interface INotification extends IAbstractEntity {
    id: string;
    title: string;
    content: string;
    timestamp: number;
    read?: boolean;
}

export class Notification extends AbstractEntity {
    private title: string;
    private content: string;
    private timestamp: number;
    private read: boolean;

    constructor(data: INotification) {
        super(data.id, data.timestamp, data.timestamp, data.permissions);
        this.title = data.title;
        this.content = data.content;
        this.timestamp = data.timestamp;
        this.read = data.read || false;
    }

    public static of(data: DBRecord): Notification {
        return new Notification({
            id: data.id as string,
            createdAt: new Date(data.createdAt as string).getTime(),
            updatedAt: new Date(data.updatedAt as string).getTime(),
            permissions: data.permissions as string[],
            title: data.title as string,
            content: data.content as string,
            timestamp: data.timestamp as number,
            read: data.read as boolean || false,
        });
    }


    record(): DBRecord {
        return {
            ...super.record(),
            title: this.title,
            content: this.content,
            timestamp: this.timestamp,
            read: this.read,
        };
    }

    getTitle(): string {
        return this.title;
    }

    getContent(): string {
        return this.content;
    }

    getTimestamp(): number {
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
}

