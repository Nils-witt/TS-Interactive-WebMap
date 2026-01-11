import * as mgrs from 'mgrs';
import * as utm from 'utm';

export interface UTMCoordinate {
    easting: number,
    northing: number,
    zoneNum: number,
    zoneLetter: string
}

export interface WGS84DMMCoordinate {
    latitudeDegrees: number,
    latitudeMinutes: number,
    latDirection: 'N' | 'S',
    longitudeDegrees: number,
    longitudeMinutes: number,
    lonDirection: 'E' | 'W',
}

export interface WGS84DDDCoordinate {
    latitude: number,
    latDirection: 'N' | 'S',
    longitude: number,
    lonDirection: 'E' | 'W'
}

export interface WGS84DMSCoordinate {
    latitudeDegrees: number,
    latitudeMinutes: number,
    latitudeSeconds: number,
    latDirection: 'N' | 'S',
    longitudeDegrees: number,
    longitudeMinutes: number,
    longitudeSeconds: number,
    lonDirection: 'E' | 'W',
}

export class LngLat {
    longitude: number;
    latitude: number;

    constructor(longitude: number, latitude: number) {
        this.longitude = longitude;
        this.latitude = latitude;
    }

    getLongitude(): number {
        return this.longitude;
    }

    getLatitude(): number {
        return this.latitude;
    }

    setLongitude(longitude: number): void {
        this.longitude = longitude;
    }

    setLatitude(latitude: number): void {
        this.latitude = latitude;
    }

    toString(): string {
        return `${this.longitude} ${this.latitude}`;
    }

    /**
     * Convert this LngLat (WGS84) to an MGRS string.
     * precision: number of digits per coordinate (1..5). 5 -> 1 meter resolution.
     */
    toMGRS(precision = 5): string {
        return mgrs.forward([this.longitude, this.latitude], precision);
    }

    toUTM(): UTMCoordinate {
        return utm.fromLatLon(this.latitude, this.longitude);
    }

    /**
     * WGS84 DDD (decimal degrees) format.
     * Example: "52.516276°N 13.377702°E"
     */
    toWGS84DDD(precision = 4): WGS84DDDCoordinate {
        return {
            latitude: parseFloat(Math.abs(this.latitude).toFixed(precision)),
            latDirection: this.latitude >= 0 ? 'N' : 'S',
            longitude: parseFloat(Math.abs(this.longitude).toFixed(precision)),
            lonDirection: this.longitude >= 0 ? 'E' : 'W',
        };
    }

    /**
     * WGS84 DMM (degrees and decimal minutes) format.
     * Example: "52°30.976'N 13°22.662'E"
     */
    toWGS84DMM(precision = 3): WGS84DMMCoordinate {
        return {
            latitudeDegrees: Math.floor(Math.abs(this.latitude)),
            latitudeMinutes: parseFloat((((Math.abs(this.latitude) % 1) * 60).toFixed(precision))),
            latDirection: this.latitude >= 0 ? 'N' : 'S',
            longitudeDegrees: Math.floor(Math.abs(this.longitude)),
            longitudeMinutes: parseFloat((((Math.abs(this.longitude) % 1) * 60).toFixed(precision))),
            lonDirection: this.longitude >= 0 ? 'E' : 'W',
        };
    }

    /**
     * WGS84 DMS (degrees, minutes, seconds) format.
     * Example: "52°30'58.56\"N 13°22'39.72\"E"
     */
    toWGS84DMS(precision = 2): WGS84DMSCoordinate {
        return {
            latitudeDegrees: Math.floor(Math.abs(this.latitude)),
            latitudeMinutes: Math.floor((Math.abs(this.latitude) % 1) * 60),
            latitudeSeconds: parseFloat(((((Math.abs(this.latitude) % 1) * 60) % 1) * 60).toFixed(precision)),
            latDirection: this.latitude >= 0 ? 'N' : 'S',
            longitudeDegrees: Math.floor(Math.abs(this.longitude)),
            longitudeMinutes: Math.floor((Math.abs(this.longitude) % 1) * 60),
            longitudeSeconds: parseFloat(((((Math.abs(this.longitude) % 1) * 60) % 1) * 60).toFixed(precision)),
            lonDirection: this.longitude >= 0 ? 'E' : 'W',
        };
    }
}