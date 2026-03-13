import { AbstractEntity, type DBRecord } from './AbstractEntity';


export interface INotification {
    id: string;
    title: string;
    content: string;
    timestamp: number;
    read?: boolean;
}

export class Notification extends AbstractEntity {
    private id: string;
    private title: string;
    private content: string;
    private timestamp: number;
    private read: boolean;

    constructor(data: INotification) {
        super();
        this.id = data.id;
        this.title = data.title;
        this.content = data.content;
        this.timestamp = data.timestamp;
        this.read = data.read || false;
    }

    public static of(data: DBRecord): Notification {
        return new Notification({
            id: data.id as string,
            title: data.title as string,
            content: data.content as string,
            timestamp: data.timestamp as number,
            read: data.read as boolean || false,
        });
    }


    record(): DBRecord {
        return {
            id: this.id,
            title: this.title,
            content: this.content,
            timestamp: this.timestamp,
            read: this.read,
        };
    }

    getId(): string {
        return this.id;
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

