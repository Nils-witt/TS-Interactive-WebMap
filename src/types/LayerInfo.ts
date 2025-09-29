/**
 * Represents information about a map layer.
 * This type is used to define and manage layers that can be added to the map.
 */
export type LayerInfo = {
    /**
     * The display name of the layer shown in the layer control
     */
    name: string;

    /**
     * Unique identifier for the layer, used for source and layer creation
     */
    id: string;

    /**
     * Description of the layer's content and purpose
     */
    description: string;

    /**
     * URL to the tile source for this layer
     */
    url: string;

    opacity?: number; // Optional opacity for the layer, default is 1.0
};
