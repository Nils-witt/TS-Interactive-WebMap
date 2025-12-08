export interface KeyValueInterface {

    getItem(key: string): Promise<string | null>;

    setItem(key: string, value: string): Promise<void>;

    removeItem(key: string): Promise<void>;

    getAllItems(): Promise<Record<string, string>>;

    clearAll(): Promise<void>;
}