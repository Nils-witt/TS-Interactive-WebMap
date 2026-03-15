/*
 * Entity.ts
 * ---------
 * Base class for application entities that need event dispatching and record handling.
 * Exports: Entity base class and DBRecord type
 * Purpose: centralize common behavior used by derived entity classes.
 */

export type DBRecord = Record<string, string | number | boolean | null | object>;

export interface IAbstractEntity {
    id: string;
    createdAt: number;
    updatedAt: number;
    permissions: string[];
}


export class AbstractEntity {
    private id: string ;
    private createdAt: Date;
    private updatedAt: Date;
    private permissions: string[];


    constructor(id: string, createdAt: number, updatedAt: number, permissions: string[]) {
        this.id = id;
        this.createdAt = new Date(createdAt);
        this.updatedAt = new Date(updatedAt);
        this.permissions = permissions;
    }

    private listeners: Record<string, ((...args: unknown[]) => void)[]> = {};


    public on(event: string, listener: (...args: unknown[]) => void): void {
        // Implementation for adding an event listener
        if (!this.listeners[event]) {
            this.listeners[event] = [];

        }
        this.listeners[event].push(listener);
    }

    public off(event: string, listener: (...args: unknown[]) => void): void {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(l => l !== listener);
    }

    public notify(event: string, ...args: unknown[]): void {
        for (const listener of this.listeners[event] || []) {
            listener(...args);
        }
    }

    public record(): DBRecord {
        return {
            id: this.id,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
            permissions: this.permissions,
        };
    }

    public of(data: DBRecord): AbstractEntity {
        throw new Error(`Method not implemented. Must be overridden in subclass. ${Object.entries(data).length}`);
    }
    public getId(): string {
        return this.id;
    }

    public getCreatedAt(): Date {
        return this.createdAt;
    }

    public getUpdatedAt(): Date {
        return this.updatedAt;
    }

    public setId(id: string): void {
        this.id = id;
    }

    public setCreatedAt(createdAt: Date): void {
        this.createdAt = createdAt;
    }

    public setUpdatedAt(updatedAt: Date): void {
        this.updatedAt = updatedAt;
    }

    public getPermissions(): string[] {
        return this.permissions;
    }

    public setPermissions(permissions: string[]): void {
        this.permissions = permissions;
    }
}