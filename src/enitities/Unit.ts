
import type {TaktischesZeichen} from 'taktische-zeichen-core/dist/types/types';
import {type DBRecord, Entity} from './Entity.ts';
import {erzeugeTaktischesZeichen} from 'taktische-zeichen-core';

export interface IUnit {
    id?: string;
    latitude: number;
    longitude: number;
    name: string;
    symbol?: TaktischesZeichen; // Optional symbol for rendering, if applicable
    groupId?: string | null; // Optional group ID for categorization
}

export class Unit extends Entity {
    private id: string | null;
    private latitude: number;
    private longitude: number;
    private name: string;
    private symbol: TaktischesZeichen | null;
    private groupId: string | null;

    constructor(data: IUnit) {
        super();
        this.id = data.id || null;
        this.latitude = data.latitude;
        this.longitude = data.longitude;
        this.name = data.name;
        this.groupId = data.groupId as string | null;
        this.symbol = data.symbol || null;

    }

    public static of(data: DBRecord): Unit {
        let data_symbol: TaktischesZeichen | undefined = undefined;
        if (data && data.symbol) {
            try {
                if (typeof data.symbol == 'object') {
                    data_symbol = data.symbol as TaktischesZeichen;
                }else if (typeof data.symbol == 'string') {
                    data_symbol = JSON.parse(data.symbol) as TaktischesZeichen;
                }
            } catch (e: any) {
                /* ignore parsing errors */
            }
        }

        return new Unit({
            id: data.id as string,
            latitude: Number(data.latitude),
            longitude: Number(data.longitude),
            name: data.name as string,
            groupId: data.group_id as string | undefined,
            symbol: data_symbol,
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
        };
    }


    public getIconElement(size?: { height: number, width: number }): HTMLElement | undefined {
        if (!this.symbol) {
            return undefined;
        }
        try {
            const tz = erzeugeTaktischesZeichen(this.symbol);
            if (!tz.dataUrl) {
                return undefined;
            }
            const img = document.createElement('img');
            img.src = tz.dataUrl;
            if (size) {
                img.width = size.width;
                img.height = size.height;
            } else {
                img.width = 32;
                img.height = 32;
            }

            const container = document.createElement('div');
            container.appendChild(img);
            return container;
        } catch (e) {
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
}