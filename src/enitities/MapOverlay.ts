/*
 * Overlay.ts
 * ----------
 * Represents a map overlay (raster tile layer) with metadata and events.
 * Exports: Overlay class
 * Purpose: encapsulate overlay id, name, URL template, order, and related events
 */

import {type DBRecord, AbstractEntity, type IAbstractEntity} from './AbstractEntity.ts';


export interface IOverlay extends IAbstractEntity {
    name: string;
    url: string;
    opacity?: number;
    order?: number;
    layerVersion: number;
}

export enum OverlayEvent {
    changed = 'overlayChanged',
    orderChanged = 'overlayOrderChanged'
}

export class MapOverlay extends AbstractEntity {
    /**
     * The display name of the layer shown in the layer control
     */
    private name = '';

    private layerVersion = 0;

    /**
     * Unique identifier for the layer, used for source and layer creation
     */
    private id = '';

    /**
     * Description of the layer's content and purpose
     */
    private description = '';

    /**
     * URL to the tile source for this layer
     */
    private url = '';

    /**
     * Optional opacity for the layer, default is 1.0
     */
    private opacity = 1.0; // Optional opacity for the layer, default is 1.0

    /**
     * Order of the layer in the layer stack
     * @private
     */
    private order = 0;


    constructor(data: IOverlay) {
        super();
        this.id = data.id;
        this.name = data.name;
        this.url = data.url;
        this.order = data.order || 0;
        this.opacity = data.opacity || 1.0;
        this.layerVersion = data.layerVersion;
    }


    public static of(data: DBRecord): MapOverlay {
        return new MapOverlay(
            {
                id: data.id as string,
                name: data.name as string,
                url: data.url as string,
                order: data.order as number,
                opacity: data.opacity as number,
                layerVersion: data.layerVersion as number ?? 0,
            }
        );
    }

    public record(): DBRecord {
        return {
            id: this.id,
            name: this.name,
            url: this.url,
            order: this.order,
            opacity: this.opacity,
            description: this.description,
            layerVersion: this.layerVersion
        };
    }

    public getId(): string {
        return this.id;
    }

    public getName(): string {
        return this.name;
    }

    public getDescription(): string {
        return this.description;
    }

    public getUrl(): string {
        return this.url;
    }

    public getOpacity(): number {
        return this.opacity;
    }

    public setUrl(url: string): void {
        this.url = url;
    }

    public setName(name: string): void {
        this.name = name;
    }

    public setDescription(description: string): void {
        this.description = description;
    }

    public setOpacity(opacity: number): void {
        this.opacity = opacity;
    }

    public getOrder(): number {
        return this.order;
    }

    public setOrder(order: number): void {
        this.order = order;
        this.notify(OverlayEvent.orderChanged, order);
        this.notify(OverlayEvent.changed, {order: order});
    }


    public getLayerVersion(): number {
        return this.layerVersion;
    }

    public setLayerVersion(version: number): void {
        this.layerVersion = version;
    }
}