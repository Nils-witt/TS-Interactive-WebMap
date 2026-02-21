import type {TaktischesZeichen} from 'taktische-zeichen-core/dist/types/types';
import {type DBRecord, AbstractEntity} from './AbstractEntity.ts';
import {erzeugeTaktischesZeichen} from 'taktische-zeichen-core';
import {ApplicationLogger} from '../ApplicationLogger.ts';
import {LngLat} from './LngLat.ts';
import {EmbeddablePosition} from './embeddables/EmbeddablePosition.ts';

export interface IUnit {
    id?: string;
    position: { latitude: number, longitude: number, accuracy: number, timestamp: string };
    name: string;
    symbol?: TaktischesZeichen; // Optional symbol for rendering, if applicable
    groupId?: string | null; // Optional group ID for categorization
    unit_status?: number | null;
    route?: { latitude: number, longitude: number }[];
}

export class Unit extends AbstractEntity {
    private id: string | null;
    private position: EmbeddablePosition | null = null;
    private name: string;
    private symbol: TaktischesZeichen | null;
    private groupId: string | null;
    private unit_status: number | null;
    private route: { latitude: number, longitude: number }[] | undefined = [];

    constructor(data: IUnit) {
        super();
        this.id = data.id || null;
        this.position = EmbeddablePosition.of(data.position);
        this.name = data.name;
        this.groupId = data.groupId as string || null;
        this.symbol = data.symbol || null;
        this.unit_status = data.unit_status || null;
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
            position: {
                latitude: data.pos_latitude as number,
                longitude: data.pos_longitude as number,
                accuracy: data.pos_accuracy as number,
                timestamp: data.pos_timestamp as string,
            },
            name: data.name as string,
            groupId: data.group_id as string | undefined,
            symbol: data_symbol,
            unit_status: data.unit_status as number || null,
            route: route,
        });
    }


    record(): DBRecord {
        const record: DBRecord = {};
        record['id'] = this.id;
        return {
            id: this.id,
            pos_latitude: this.position ? this.position.latitude : 0,
            pos_longitude: this.position ? this.position.longitude : 0,
            pos_accuracy: this.position ? this.position.accuracy : -1,
            pos_timestamp: this.position ? this.position.timestamp.toISOString() : new Date().toISOString(),
            name: this.name,
            group_id: this.groupId || null,
            symbol: this.symbol ? JSON.stringify(this.symbol) : null,
            unit_status: this.unit_status,
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

    public getPosition(): EmbeddablePosition | null {
        return this.position;
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

    public setPosition(position: EmbeddablePosition): void {
        this.position = position;
    }

    public getStatus(): number | null {
        return this.unit_status || null;
    }

    public setStatus(status: number | null): void {
        this.unit_status = status;
    }


    public getRoute(): { latitude: number, longitude: number }[] | undefined {
        return this.route;
    }
}