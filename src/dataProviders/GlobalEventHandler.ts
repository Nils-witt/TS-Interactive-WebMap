/*
 * GlobalEventHandler.ts
 * ---------------------
 * Small wrapper for cross-component event dispatch using window.BroadcastChannel or simple EventTarget.
 * Exports: GlobalEventHandler singleton
 * Purpose: decouple components and providers using events instead of direct references.
 */


import {ApplicationLogger} from '../ApplicationLogger.ts';

export class DataEvent extends Event {
    data: unknown;

    constructor(eventType: string, data: unknown) {
        super(eventType);
        this.data = data;
    }
}

export class GlobalEventHandler {


    private static instance: GlobalEventHandler | null = null;

    private listeners: Map<string, ((event: Event) => void)[]> = new Map<string, ((event: Event) => void)[]>();

    private constructor() { /* empty */
    }

    public static getInstance(): GlobalEventHandler {
        if (!this.instance) {
            this.instance = new GlobalEventHandler();
        }
        return this.instance;
    }

    on(eventName: string, callback: (event: Event) => void): void {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, []);
        }
        this.listeners.get(eventName)?.push(callback);
    }

    off(eventName: string, callback: (event: Event) => void): void {
        const cbs = this.listeners.get(eventName);
        if (cbs) {
            this.listeners.set(eventName, cbs.filter(cb => cb !== callback));
        }
    }

    emit(eventName: string, event: Event): void {
        ApplicationLogger.info(`Emitting event: ${eventName}`, {service: 'GlobalEventHandler'});
        this.listeners.get(eventName)?.forEach(callback => {
            callback(event);
        });
    }
}
