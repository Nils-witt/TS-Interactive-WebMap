

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

    public static of(data: { latitude: number, longitude: number, accuracy: number, timestamp: string }): EmbeddablePosition {
        return new EmbeddablePosition(
            data.latitude,
            data.longitude,
            data.accuracy,
            new Date(data.timestamp)
        );
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