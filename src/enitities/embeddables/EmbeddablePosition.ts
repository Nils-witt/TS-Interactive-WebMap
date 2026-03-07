

export interface IPosition {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: string;
}

export class EmbeddablePosition {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: Date;

    constructor(latitude: number, longitude: number, accuracy: number, timestamp: Date) {
        this.latitude = latitude;
        this.longitude = longitude;
        this.accuracy = accuracy;
        this.timestamp = timestamp;
    }

    public static of(data?: IPosition): EmbeddablePosition | null {
        if (!data) return null;
        return new EmbeddablePosition(
            data.latitude,
            data.longitude,
            data.accuracy,
            new Date(data.timestamp)
        );
    }

    record(): IPosition {
        return {
            latitude: this.latitude,
            longitude: this.longitude,
            accuracy: this.accuracy,
            timestamp: this.timestamp.toISOString(),
        }; 
    }

    public getLatitude(): number {
        return this.latitude;
    }

    public getLongitude(): number {
        return this.longitude;
    }

    public getAccuracy(): number {
        return this.accuracy;
    }

    public getTimestamp(): Date {
        return this.timestamp;
    }
}