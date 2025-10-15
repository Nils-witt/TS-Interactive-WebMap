import {type ControlPosition, Evented, type IControl, Map as MapLibreMap} from "maplibre-gl";
import type {LayerInfo} from "../types/LayerInfo.ts";
import {icon} from "@fortawesome/fontawesome-svg-core";
import {faMap} from "@fortawesome/free-solid-svg-icons/faMap";
import {faXmark} from "@fortawesome/free-solid-svg-icons/faXmark";
import {DOM} from "maplibre-gl/src/util/dom";
import {DataProvider} from "../dataProviders/DataProvider";
import {useControl} from "@vis.gl/react-maplibre";

/**
 * LayersControl provides a UI to toggle overlays and open per-layer settings.
 * Features:
 * - Adds raster sources and layers per LayerInfo
 * - Remembers active overlays in localStorage
 * - Allows adjusting opacity and local caching (PWA) of overlay tiles
 * - Provides reset/logout utilities in settings
 */


type ReactLayerControlProps = {
    layers: LayerInfo[];
    shownLayers: string[];
    position: ControlPosition;
    dataProvider: DataProvider;
}

function ReactLayerControl(props: ReactLayerControlProps) {
    const layercontrol = useControl(() => new LayersControl(props as LayerControlOptions), {
        position: props.position
    });
    layercontrol.setOverlays(props.layers);

    return null;
}

export default ReactLayerControl;

type LayerControlOptions = {
    layers: LayerInfo[];
    shownLayers?: string[];
    dataProvider: DataProvider;
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

    private layersContainer: HTMLElement;

    private isOpen: boolean = false; // Flag to track if the control is open or closed

    private spanIcon = document.createElement("span");


    /**
     * Map of layer IDs to their corresponding LayerInfo objects for quick lookup
     */
    private overlays: Map<string, LayerInfo> = new Map();

    /**
     * Map to track active overlays by their IDs
     * This is used to persist the state of active overlays across sessions
     * @private
     */
    private activeOverlays: Map<string, boolean> = new Map();


    private options: LayerControlOptions;

    /**
     * Creates a new LayersControl instance
     *
     * @param options - Array of LayerInfo objects representing available layers
     */
    constructor(options: LayerControlOptions) {
        super();
        this.map = undefined;
        this.options = options;

        this.container = DOM.create("div", "maplibregl-ctrl");
        this.container.classList.add(
            "maplibregl-ctrl-group",
            "grid"
        );

        this.spanIcon.classList.add("p-[10px]");
        this.spanIcon.innerHTML = icon(faMap, {
            transform: {}
        }).html[0];

        this.layersContainer = document.createElement("div")
        this.layersContainer.classList.add('hidden', 'grid')

        this.container.appendChild(this.layersContainer);
        this.container.appendChild(this.spanIcon);

        this.spanIcon.addEventListener("click", () => {
            this.setOpen(!this.isOpen);
        });


        this.setOverlays(this.options.layers);

    }

    private setOpen(open: boolean): void {
        this.isOpen = open;
        if (open) {
            this.layersContainer.classList.remove("hidden");
            this.spanIcon.innerHTML = icon(faXmark).html[0];
        } else {
            this.layersContainer.classList.add("hidden");
            this.spanIcon.innerHTML = icon(faMap).html[0];
        }
    }

    private showLayerRecursive(id: string | null | undefined) {
        if (id == null) return;
        if (id == undefined) return;
        if (this.map == undefined) return;
        const layer = this.overlays.get(id);
        if (layer == undefined) {
            return
        }
        if (!this.map.getLayer(layer.getId() + '-layer')) {
            if (layer.getUnderlayingLayer() != null) {
                this.showLayerRecursive(layer.getUnderlayingLayer())
            }
            this.map.addLayer({
                id: layer.getId() + '-layer',  // Create unique layer ID
                type: "raster",           // Render as raster layer
                source: layer.getId(),         // Reference to the source created above
            });
        }
    }

    private updateShownlayers() {
        if (this.map == undefined) return;
        const layersToAdd: LayerInfo[] = Array.from(this.overlays.values()).sort((a, b) => a.getName().localeCompare(b.getName()));

        for (const layer of layersToAdd) {
            if (!this.map.getSource(layer.getId())) {
                this.map.addSource(layer.getId(), {
                    type: "raster",           // Use raster tiles
                    tiles: [layer.getUrl() + "?accesstoken=" + this.options.dataProvider.getApiToken()],       // URL template for the tiles
                    tileSize: 256             // Standard tile size
                });
            }
        }
        for (const layer of layersToAdd) {
            if (this.map.getLayer(layer.getId() + '-layer')) {
                this.map.removeLayer(layer.getId() + '-layer');
            }
        }

        for (const layer of layersToAdd) {
            this.showLayerRecursive(layer.getId())
        }

        for (const layer of layersToAdd) {
            if (this.activeOverlays.get(layer.getId()) == true) {
                this.map.setLayoutProperty(layer.getId() + "-layer", "visibility", "visible");
            } else {
                this.map.setLayoutProperty(layer.getId() + "-layer", "visibility", "none");
            }
        }

    }

    /**
     * Creates a labeled checkbox for a layer
     *
     * @param layer - The layer information object
     * @returns A label element containing a checkbox and the layer name
     */
    private createLabeledCheckbox(layer: LayerInfo): HTMLDivElement {
        const container = document.createElement("div");
        container.classList.add("m-1")
        container.classList.add("inline-flex", "items-center");


        const cLabel = document.createElement("label");
        container.appendChild(cLabel);
        cLabel.classList.add("flex", "items-center", "cursor-pointer", "relative");

        const input = document.createElement("input");
        cLabel.appendChild(input);
        input.type = "checkbox";
        input.id = "cb-" + layer.getId(); // Set the ID to the layer ID for easy reference
        input.classList.add("peer", "h-5", "w-5", "cursor-pointer", "transition-all", "appearance-none", "rounded", "shadow", "hover:shadow-md", "border", "border-slate-300", "checked:bg-slate-800", "checked:border-slate-800")

        const span = document.createElement("span");
        cLabel.appendChild(span);
        span.classList.add("absolute", "text-white", "opacity-0", "peer-checked:opacity-100", "top-1/2", "left-1/2", "transform", "-translate-x-1/2", "-translate-y-1/2");
        span.innerHTML = '      <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"\n' +
            '        stroke="currentColor" stroke-width="1">\n' +
            '        <path fill-rule="evenodd"\n' +
            '        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"\n' +
            '        clip-rule="evenodd"></path>\n' +
            '      </svg>'
        const textLabel = document.createElement("label");
        container.appendChild(textLabel);
        textLabel.classList.add("cursor-pointer", "ml-2", "text-slate-600", "text-sm");
        textLabel.textContent = layer.getName();

        // Add event listener to toggle layer visibility when checkbox is clicked
        input.addEventListener("change", () => {
            // Set visibility based on checkbox state
            const visibility = input.checked ? "visible" : "none";
            const layer = this.overlays.get(input.id.substring(3));
            console.log("Checkbox changed for layer:", layer, "Checked:", input.checked);

            if (layer && this.map) {
                // Update the layer's visibility property in the map
                this.map.setLayoutProperty(layer.getId() + "-layer", "visibility", visibility);
                if (visibility === "visible") {
                    this.activeOverlays.set(layer.getId(), true);
                } else {
                    this.activeOverlays.delete(layer.getId());
                }
                localStorage.setItem("activeOverlays", JSON.stringify(Array.from(this.activeOverlays.keys())));
            }
        });

        return container;
    }


    private buildUI() {
        this.layersContainer.innerHTML = "";

        // Create a checkbox for each new layer and add it to the container
        for (const layer of this.overlays.values()) {
            if (!this.activeOverlays.has(layer.getId())) {
                this.activeOverlays.set(layer.getId(), false);
            }
            const labeled_checkbox = this.createLabeledCheckbox(layer);
            this.layersContainer.appendChild(labeled_checkbox);
        }

        this.updateShownlayers();
    }

    public setOverlays(overlays: LayerInfo[]): void {
        this.overlays = new Map();
        for (const layer of overlays) {
            this.overlays.set(layer.getId(), layer);
        }
        this.buildUI();
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

        map.once('load', () => {
            this.buildUI();
        });
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

        this.map = undefined;
    }
}
