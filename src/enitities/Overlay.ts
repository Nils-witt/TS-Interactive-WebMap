import {Entity} from "./Entity.ts";
import type {OverlayDBEntry} from "../dataProviders/DatabaseProvider.ts";


export enum OverlayEvent {
    changed = "overlayChanged",
    orderChanged = "overlayOrderChanged"
}

export class Overlay extends Entity {
    /**
     * The display name of the layer shown in the layer control
     */
    private name = "";

    /**
     * Unique identifier for the layer, used for source and layer creation
     */
    private id = "";

    /**
     * Description of the layer's content and purpose
     */
    private description = "";

    /**
     * URL to the tile source for this layer
     */
    private url = "";

    /**
     * Optional opacity for the layer, default is 1.0
     */
    private opacity = 1.0; // Optional opacity for the layer, default is 1.0

    /**
     * Order of the layer in the layer stack
     * @private
     */
    private order = 0;


    constructor() {
        super();
    }


    public static of(data: OverlayDBEntry): Overlay {
        const overlay = new Overlay();
        overlay.id = data.id;
        overlay.name = data.name;
        overlay.url = data.url;
        overlay.order = data.order;
        overlay.opacity = data.opacity;
        overlay.description = data.description;
        return overlay;
    }

    public dbEntry(): OverlayDBEntry {
        return {
            id: this.id,
            name: this.name,
            url: this.url,
            order: this.order,
            opacity: this.opacity,
            description: this.description
        }
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

}