


export class Entity {


    private listeners: Record<string, ((...args: any[]) => void)[]> = {};


    public on(event: string, listener: (...args: any[]) => void): void {
        // Implementation for adding an event listener
        if (!this.listeners[event]) {
            this.listeners[event] = [];

        }
        this.listeners[event].push(listener);
    }

    public off(event: string, listener: (...args: any[]) => void): void {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(l => l !== listener);
    }

    public notify(event: string, ...args: any[]): void {
        for (const listener of this.listeners[event] || []) {
            listener(...args);
        }
    }
}