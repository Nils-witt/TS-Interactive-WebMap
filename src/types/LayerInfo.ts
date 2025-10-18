interface LayerInfoType {
    name: string;
    id: string;
    description: string;
    url: string;
    opacity?: number;
    underlayingLayer?: string | null;
}

/**
 * Represents information about a map layer.
 * This type is used to define and manage layers that can be added to the map.
 */
export class LayerInfo {
    /**
     * The display name of the layer shown in the layer control
     */
    private name: string;

    /**
     * Unique identifier for the layer, used for source and layer creation
     */
    private id: string;

    /**
     * Description of the layer's content and purpose
     */
    private description: string;

    /**
     * URL to the tile source for this layer
     */
    private url: string;

    /**
     * Optional opacity for the layer, default is 1.0
     */
    private opacity: number; // Optional opacity for the layer, default is 1.0

    /**
     * Optional underlaying layer id for this layer, used for styling
     */
    private underlayingLayer: string | null;


    constructor(props: LayerInfoType) {
        this.name = props.name;
        this.id = props.id;
        this.description = props.description;
        this.url = props.url;
        this.opacity = props.opacity || 1.0;
        this.underlayingLayer = props.underlayingLayer || null;
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

    public getUnderlayingLayer(): string | null {
        return this.underlayingLayer;
    }

    public setUnderlayingLayer(underlayingLayer: string | null): void {
        this.underlayingLayer = underlayingLayer;
    }

    public getLayerInfo(): LayerInfoType {
        return {
            name: this.name,
            id: this.id,
            description: this.description,
            url: this.url,
            opacity: this.opacity,
            underlayingLayer: this.underlayingLayer
        }
    }

}
