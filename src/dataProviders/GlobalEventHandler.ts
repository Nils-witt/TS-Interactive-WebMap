export class GlobalEventHandler {


    private static instance: GlobalEventHandler | null = null;

    private listeners: Map<string, ((event: Event) => void)[]> = new Map();

    private constructor() {

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

    emit(eventName: string, event: Event): void {
        this.listeners.get(eventName)?.forEach(callback => {
            callback(event);
        });
    }
}
