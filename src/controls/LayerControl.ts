import {Evented, type IControl, Map as MapLibreMap} from "maplibre-gl";
import type {LayerInfo} from "../types/LayerInfo.ts";
import {type DataProvider, type DataProviderEvent, DataProviderEventType} from "../dataProviders/DataProvider.ts";


export type LayersControlOptions = {
    dataProvider: DataProvider; // Optional data provider to fetch layer information
}

/**
 * A control for MapLibre GL JS that allows users to toggle the visibility of map layers.
 * Implements the IControl interface required by MapLibre GL JS.
 */
export class LayersControl extends Evented implements IControl {
    /**
     * Reference to the MapLibre map instance
     */
    private map: MapLibreMap | undefined;

    /**
     * The HTML container element that holds the control UI
     */
    private container: HTMLElement;

    /**
     * Array of checkbox input elements for each layer
     */
    private inputs: HTMLInputElement[];

    /**
     * Map of layer IDs to their corresponding LayerInfo objects for quick lookup
     */
    private layers: Map<string, LayerInfo> = new Map();

    /**
     * Map to track active overlays by their IDs
     * This is used to persist the state of active overlays across sessions
     * @private
     */
    private activeOverlays: Map<string, boolean> = new Map();


    dataProvider: DataProvider;

    /**
     * Creates a new LayersControl instance
     *
     * @param options - Array of LayerInfo objects representing available layers
     */
    constructor(options: LayersControlOptions) {
        super();

        this.map = undefined;

        // This div will hold all the checkboxes and their labels
        this.container = document.createElement("div");
        this.container.classList.add(
            "maplibregl-ctrl",        // Standard MapLibre control class
            "maplibregl-ctrl-group",  // Groups the control visually
            "layers-control",         // Custom class for styling
        );

        // Create a map of layer IDs to LayerInfo objects for quick lookup
        this.dataProvider = options.dataProvider;
        this.dataProvider.on(DataProviderEventType.OVERLAY_ADDED, (event    : DataProviderEvent) => {
            let data = event.data as LayerInfo;
            console.log("LayersControl: Overlay added", data);
            this.addLayer(data);
        });
        this.setLayers(this.dataProvider.getOverlays());
        this.inputs = [];

        let previouslyActiveOverlays = localStorage.getItem("activeOverlays");
        if (previouslyActiveOverlays) {
            // Parse the stored active overlays and set them in the map
            const activeOverlaysArray = JSON.parse(previouslyActiveOverlays) as string[];
            for (const overlayId of activeOverlaysArray) {
                this.activeOverlays.set(overlayId, true);
            }
        }
    }

    /**
     * Sets the layers for the control
     * This method can be used to update the layers dynamically
     *
     * @param overlays
     */
    private setLayers(overlays: Map<string, LayerInfo>): void {
        // Clear existing inputs and container
        this.inputs = [];
        this.container.innerHTML = "";

        // Update the layers map
        this.layers.clear();
        for (const layer of overlays.values()) {
            this.layers.set(layer.id, layer);
        }

        // Create a checkbox for each new layer and add it to the container
        for (const layer of overlays.values()) {
            let labeled_checkbox = this.createLabeledCheckbox(layer);
            this.container.appendChild(labeled_checkbox);
        }
        console.log(this.container)
    }

    private addLayer(layer: LayerInfo): void {
        if (this.map === undefined) {
            console.error("LayersControl: Map is not initialized. Cannot add layer.");
            return;
        }
        if (this.map.loaded()){
            // Add the layer source
            this.map.addSource(layer.id, {
                type: "raster",           // Use raster tiles
                tiles: [layer.url],       // URL template for the tiles
                tileSize: 256             // Standard tile size
            });

            // Create a map layer using the source
            this.map.addLayer({
                id: layer.id + '-layer',  // Create unique layer ID
                type: "raster",           // Render as raster layer
                source: layer.id,         // Reference to the source created above
            });
            if (!this.activeOverlays.has(layer.id)) {
                this.map.setLayoutProperty(layer.id + "-layer", "visibility", "none");
            }
        }else {
            this.map.once('load', () => {
                // Add the layer source
                this.map?.addSource(layer.id, {
                    type: "raster",           // Use raster tiles
                    tiles: [layer.url],       // URL template for the tiles
                    tileSize: 256             // Standard tile size
                });

                // Create a map layer using the source
                this.map?.addLayer({
                    id: layer.id + '-layer',  // Create unique layer ID
                    type: "raster",           // Render as raster layer
                    source: layer.id,         // Reference to the source created above
                });
                if (!this.activeOverlays.has(layer.id)) {
                    this.map?.setLayoutProperty(layer.id + "-layer", "visibility", "none");
                }
            });
        }
        this.layers.set(layer.id, layer);
        let labeled_checkbox = this.createLabeledCheckbox(layer);

        this.container.appendChild(labeled_checkbox);
    }

    /**
     * Creates a labeled checkbox for a layer
     *
     * @param layer - The layer information object
     * @returns A label element containing a checkbox and the layer name
     */
    private createLabeledCheckbox(layer: LayerInfo): HTMLLabelElement {
        // Create the label element that will contain the checkbox and text
        let label = document.createElement("label");
        label.classList.add("layer-control");

        // Create a text node with the layer name
        let text = document.createTextNode(layer.name);

        // Create the checkbox input element
        let input = document.createElement("input");
        this.inputs.push(input);

        input.type = "checkbox";
        input.id = layer.id;
        if(this.map?.loaded()){
            if (this.map.getLayoutProperty(layer.id + "-layer","visibility") != "none") {
                input.checked = true; // Default to checked if layer is visible
            }
        }else{
            input.checked = false; // Default to unchecked if no map is available
            input.disabled = true; // Disable checkbox if no map is available
            this.map?.once('load', () => {
                // Enable the checkbox once the map is loaded
                input.disabled = false;
                if (this.map?.getLayoutProperty(layer.id + "-layer","visibility") != "none") {
                    input.checked = true; // Default to checked if layer is visible
                }
            });
        }


        // Add event listener to toggle layer visibility when checkbox is clicked
        input.addEventListener("change", () => {
            // Set visibility based on checkbox state
            let visibility = input.checked ? "visible" : "none";
            const layer = this.layers.get(input.id);
            if (layer && this.map) {
                // Update the layer's visibility property in the map
                this.map.setLayoutProperty(layer.id + "-layer", "visibility", visibility);
                if (visibility === "visible") {
                    this.activeOverlays.set(layer.id, true);
                } else {
                    this.activeOverlays.delete(layer.id);
                }
                localStorage.setItem("activeOverlays", JSON.stringify(Array.from(this.activeOverlays.keys())));
            }
        });

        // Assemble the label with the checkbox and text
        label.appendChild(input);
        label.appendChild(text);
        return label;
    }

    /**
     * Adds the control to the map
     * Required method for MapLibre IControl interface
     *
     * @param map - The MapLibre map instance
     * @returns The control's container element
     */
    public onAdd(map: MapLibreMap): HTMLElement {
        this.map = map;

        // Initialize checkbox states based on layer visibility in the map
        for (const input of this.inputs) {
            let layer = this.layers.get(input.id);
            if (layer) {
                // Determine if the layer is currently visible
                let is_visible = true;
                if (this.map) {
                    is_visible =
                        is_visible &&
                        this.map.getLayoutProperty(layer.id + '-layer', "visibility") !== "none";
                } else {
                    is_visible = false; // If no map, then no layers can be visible
                }

                // Set checkbox state to match layer visibility
                input.checked = is_visible;
                if (is_visible) {
                    this.activeOverlays.set(layer.id, true);
                } else {
                    this.activeOverlays.delete(layer.id);
                }
            }
        }

        // Return the container element to be added to the map
        return this.container;
    }

    /**
     * Removes the control from the map
     * Required method for MapLibre IControl interface
     */
    public onRemove() {
        // Remove the container from its parent element
        if (this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }

        // Clear the map reference
        this.map = undefined;
    }
}
