import type {TaktischesZeichen} from 'taktische-zeichen-core/dist/types/types';
import {type DBRecord, AbstractEntity} from './AbstractEntity.ts';
import {erzeugeTaktischesZeichen} from 'taktische-zeichen-core';
import {ApplicationLogger} from '../ApplicationLogger.ts';
import {LngLat} from './LngLat.ts';

export interface IUnit {
    id?: string;
    latitude: number;
    longitude: number;
    name: string;
    symbol?: TaktischesZeichen; // Optional symbol for rendering, if applicable
    groupId?: string | null; // Optional group ID for categorization
    unit_status?: number | null;
    unit_status_time?: string;
    route?: { latitude: number, longitude: number }[];
}

export class Unit extends AbstractEntity {
    private id: string | null;
    private latitude: number;
    private longitude: number;
    private name: string;
    private symbol: TaktischesZeichen | null;
    private groupId: string | null;
    private unit_status: number | null;
    private unit_status_time: Date | null;
    private route: { latitude: number, longitude: number }[] | undefined = [];

    constructor(data: IUnit) {
        super();
        this.id = data.id || null;
        this.latitude = data.latitude;
        this.longitude = data.longitude;
        this.name = data.name;
        this.groupId = data.groupId as string || null;
        this.symbol = data.symbol || null;
        this.unit_status = data.unit_status || null;
        this.unit_status_time = new Date(data.unit_status_time as string);
        this.route = [];
        if (data.route) {
            this.route = data.route;
        }
    }

    public static of(data: DBRecord): Unit {
        let data_symbol: TaktischesZeichen | undefined = undefined;
        if (data && data.symbol) {
            try {
                if (typeof data.symbol == 'object') {
                    data_symbol = data.symbol as TaktischesZeichen;
                } else if (typeof data.symbol == 'string') {
                    data_symbol = JSON.parse(data.symbol) as TaktischesZeichen;
                }
            } catch (e) {
                ApplicationLogger.error('Error parsing Unit symbol: ' + (e as Error).message, {service: 'Unit'});
            }
        }
        let route: LngLat[] = [];
        if (data && data.route) {
            try {
                if (typeof data.route == 'object') {
                    route = (data.route as { latitude: number, longitude: number }[]).map(coord => new LngLat(coord.longitude,coord.latitude));
                } else if (typeof data.route == 'string') {
                    route = (JSON.parse(data.route) as { latitude: number, longitude: number }[]).map(coord => new LngLat(coord.longitude,coord.latitude));
                }
            } catch (e) {
                ApplicationLogger.error('Error parsing Unit route: ' + (e as Error).message, {service: 'Unit'});
            }
        }

        return new Unit({
            id: data.id as string,
            latitude: Number(data.latitude),
            longitude: Number(data.longitude),
            name: data.name as string,
            groupId: data.group_id as string | undefined,
            symbol: data_symbol,
            unit_status: data.unit_status as number || null,
            unit_status_time: data.unit_status_timestamp as string,
            route: route,
        });
    }


    record(): DBRecord {
        const record: DBRecord = {};
        record['id'] = this.id;
        return {
            id: this.id,
            latitude: this.latitude,
            longitude: this.longitude,
            name: this.name,
            group_id: this.groupId || null,
            symbol: this.symbol ? JSON.stringify(this.symbol) : null,
            unit_status: this.unit_status,
            unit_status_timestamp: this.unit_status_time ? this.unit_status_time.toISOString() : null,
            route: this.route ? JSON.stringify(this.route) : null,
        };
    }


    public getIconElement(size?: { width: number }): HTMLElement | undefined {
        if (!this.symbol) {
            return undefined;
        }
        try {
            const tz = erzeugeTaktischesZeichen(this.symbol);
            const dataUrl = `data:image/svg+xml;base64,${btoa(tz.toString())}`;

            const img = document.createElement('img');
            img.src = dataUrl;
            if (size) {
                img.width = size.width;
            } else {
                img.width = 32;
            }
            return img;
        } catch (e) {
            ApplicationLogger.error('Error generating icon element for Unit: ' + (e as Error).message, {service: 'Unit'});
            return undefined;
        }
    }

    public getId(): string | null {
        return this.id;
    }

    public getLatitude(): number {
        return this.latitude;
    }

    public getLongitude(): number {
        return this.longitude;
    }

    public getName(): string {
        return this.name;
    }

    public getSymbol(): TaktischesZeichen | null {
        return this.symbol || null;
    }

    public getGroupId(): string | null {
        return this.groupId;
    }

    public setGroupId(groupId: string | null): void {
        this.groupId = groupId;
    }

    public setName(name: string): void {
        this.name = name;
    }

    public setSymbol(symbol: TaktischesZeichen): void {
        this.symbol = symbol;
    }

    public setLatitude(latitude: number): void {
        this.latitude = latitude;
    }

    public setLongitude(longitude: number): void {
        this.longitude = longitude;
    }

    public getStatus(): number | null {
        return this.unit_status || null;
    }

    public setStatus(status: number | null): void {
        this.unit_status = status;
    }

    public getStatusTime(): Date | null {
        return this.unit_status_time;
    }

    public getRoute(): { latitude: number, longitude: number }[] | undefined {
        return this.route;
    }
}