import {Evented, type IControl, Map as MapLibreMap} from "maplibre-gl";
import type {LayerInfo} from "../types/LayerInfo.ts";
import {DataProvider, type DataProviderEvent, DataProviderEventType} from "../dataProviders/DataProvider.ts";
import {icon} from "@fortawesome/fontawesome-svg-core";
import {faMap} from "@fortawesome/free-solid-svg-icons/faMap";
import {faXmark} from "@fortawesome/free-solid-svg-icons/faXmark";
import {faGear} from "@fortawesome/free-solid-svg-icons/faGear";
import {ApiProvider} from "../dataProviders/ApiProvider.ts";

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

    /**
     * Creates a new LayersControl instance
     *
     * @param options - Array of LayerInfo objects representing available layers
     */
    constructor() {
        super();

        this.map = undefined;

        // This div will hold all the checkboxes and their labels
        this.container = document.createElement("div");
        this.container.classList.add(
            "maplibregl-ctrl",        // Standard MapLibre control class
            "maplibregl-ctrl-group",  // Groups the control visually
            "grid"
        );


        this.spanIcon.classList.add("p-[5px]");
        this.spanIcon.innerHTML = icon(faMap).html[0];

        this.layersContainer = document.createElement("div")
        this.layersContainer.classList.add('hidden', 'grid')

        this.container.appendChild(this.layersContainer);
        this.container.appendChild(this.spanIcon);

        // Create a map of layer IDs to LayerInfo objects for quick lookup
        DataProvider.getInstance().on(DataProviderEventType.OVERLAY_ADDED, (event: DataProviderEvent) => {
            let data = event.data as LayerInfo;
            console.log("LayersControl: Overlay added", data);
            this.addLayer(data);
        });
        this.setLayers(DataProvider.getInstance().getOverlays());
        this.inputs = [];

        let previouslyActiveOverlays = localStorage.getItem("activeOverlays");
        if (previouslyActiveOverlays) {
            // Parse the stored active overlays and set them in the map
            const activeOverlaysArray = JSON.parse(previouslyActiveOverlays) as string[];
            for (const overlayId of activeOverlaysArray) {
                this.activeOverlays.set(overlayId, true);
            }
        }

        this.spanIcon.addEventListener("click", () => {
            this.setOpen(!this.isOpen);
        });
    }

    private setOpen(open: boolean): void {
        this.isOpen = open;
        if (open) {
            this.layersContainer.classList.remove("hidden");
            //this.spanIcon.classList.add("hidden");
            this.spanIcon.innerHTML = icon(faXmark).html[0];
        } else {
            this.layersContainer.classList.add("hidden");
            this.spanIcon.innerHTML = icon(faMap).html[0];
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
        this.layersContainer.innerHTML = "";

        // Update the layers map
        this.layers.clear();
        for (const layer of overlays.values()) {
            this.layers.set(layer.id, layer);
        }

        // Create a checkbox for each new layer and add it to the container
        for (const layer of overlays.values()) {
            let labeled_checkbox = this.createLabeledCheckbox(layer);
            this.layersContainer.appendChild(labeled_checkbox);
        }
    }

    private addLayer(layer: LayerInfo): void {
        if (this.map === undefined) {
            console.error("LayersControl: Map is not initialized. Cannot add layer.");
            return;
        }
        if (this.map.loaded()) {
            // Add the layer source
            this.map.addSource(layer.id, {
                type: "raster",           // Use raster tiles
                tiles: [layer.url + "?accesstoken=" + ApiProvider.getInstance().getToken()],       // URL template for the tiles
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
        } else {
            this.map.once('load', () => {
                // Add the layer source
                this.map?.addSource(layer.id, {
                    type: "raster",           // Use raster tiles
                    tiles: [layer.url+ "?accesstoken=" + ApiProvider.getInstance().getToken()],       // URL template for the tiles
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

        this.layersContainer.appendChild(labeled_checkbox);
    }

    private getMissingCacheFiles(layer: LayerInfo): Promise<string[]> {
        return new Promise((resolve) => {
            let url: URL | undefined;
            if (layer.url.startsWith('http')) {
                url = new URL(layer.url.substring(0, layer.url.search("{z}"))); // Ensure the URL is absolute
            } else {
                url = new URL(layer.url.substring(0, layer.url.search("{z}")), window.location.origin); // Ensure the URL is absolute
            }


            let path = url.pathname.replace('/overlays/', '');
            let parts = path.split('/');
            const cacheName = 'overlay-' + parts[0]; // Use the first part of the path as the cache name

            fetch(url.href + "/index.json").then(async response => {
                if (!response.ok) {
                    return;
                }
                const data = await response.json()
                const cache = await caches.open(cacheName);
                console.log("Opened cache:", cacheName);
                let filelist = []

                const zVals = Object.keys(data);
                for (let i = 0; i < zVals.length; i++) {
                    const z = zVals[i];
                    const xVals = Object.keys(data[z]);
                    for (let j = 0; j < xVals.length; j++) {
                        const x = xVals[j];
                        const yVals = Object.keys(data[z][x]);

                        for (let k = 0; k < yVals.length; k++) {
                            const y = data[z][x][k];
                            const tileUrl = `${url.href}${z}/${x}/${y}`;
                            filelist.push(tileUrl);
                        }
                    }

                }
                let missingFiles = [];
                for (let i = 0; i < filelist.length; i++) {
                    let fileUrl = new URL(filelist[i]);
                    let response = await cache.match(fileUrl);
                    if (!response) {
                        missingFiles.push(fileUrl.href);
                    }
                }
                resolve(missingFiles);
            }).catch(error => {
                console.error("Failed to fetch index.json:", error);
                resolve([]);
            });

        });

    }

    private downloadLayerToCache(layer: LayerInfo) {


        return new Promise<boolean>(async (resolve, reject) => {
            let url: URL | undefined;
            if (layer.url.startsWith('http')) {
                url = new URL(layer.url.substring(0, layer.url.search("{z}"))); // Ensure the URL is absolute
            } else {
                url = new URL(layer.url.substring(0, layer.url.search("{z}")), window.location.origin); // Ensure the URL is absolute
            }


            let path = url.pathname.replace('/overlays/', '');
            let parts = path.split('/');
            const cacheName = 'overlay-' + parts[0]; // Use the first part of the path as the cache name

            let missingFiles = await this.getMissingCacheFiles(layer);
            caches.open(cacheName).then(async (cache) => {

                cache.addAll(missingFiles).then(() => {
                    console.log("Layer downloaded and cached successfully:", cacheName);
                    resolve(true);
                }).catch(error => {
                    console.error("Failed to cache layer files:", error);
                    reject(false);
                });
            });
        });
    }


    private openLayerSettings(layer: LayerInfo) {
        const container = document.createElement("div");
        container.classList.add("absolute", "top-0", "left-0", "w-full", "h-full", "z-50", "flex", "flex-col", "items-center", "justify-center");

        const contentContainer = document.createElement("div");

        contentContainer.classList.add("bg-white", "p-4", "rounded", "w-11/12", "max-w-md");
        const opacityContainer = document.createElement("div");
        opacityContainer.classList.add("mb-4");
        const opacityLabel = document.createElement("label");
        opacityLabel.classList.add();
        opacityLabel.setAttribute("for", "opacity-range");
        opacityLabel.textContent = "Opacity: 100%";
        const opacityInput = document.createElement("input");
        opacityInput.setAttribute("type", "range");
        opacityInput.setAttribute("id", "opacity-range");
        opacityInput.setAttribute("min", "0");
        opacityInput.setAttribute("max", "100");
        opacityInput.setAttribute("value", "100");
        opacityInput.classList.add("w-full", "h-2", "bg-gray-200", "rounded-lg", "appearance-none", "cursor-pointer", "dark:bg-gray-700");
        opacityInput.addEventListener("input", () => {
            const opacity = parseFloat(opacityInput.value) / 100;
            opacityLabel.textContent = `Opacity: ${opacityInput.value}%`;
            if (this.map) {
                this.map.setPaintProperty(layer.id + "-layer", "raster-opacity", opacity);
            }
        });
        opacityContainer.appendChild(opacityLabel);
        opacityContainer.appendChild(opacityInput);
        contentContainer.appendChild(opacityContainer);


        const downloadContainer = document.createElement("div");
        downloadContainer.classList.add("mb-4");
        const downloadButton = document.createElement("button");
        downloadButton.classList.add("bg-blue-500", "text-white", "px-4", "py-2", "rounded", "hover:bg-blue-600");
        downloadButton.textContent = "Download Layer";
        downloadButton.addEventListener("click", () => {
            this.downloadLayerToCache(layer).then((success) => {
                if (success) {
                    downloadButton.classList.remove("bg-red-500");
                    downloadButton.classList.add("bg-green-500");
                    downloadButton.textContent = "Layer Downloaded";
                } else {
                    downloadButton.classList.remove("bg-green-500");
                    downloadButton.classList.add("bg-red-500");
                    downloadButton.textContent = "Download Failed";
                }
            }).catch((error) => {
                console.error("Error downloading layer:", error);
                downloadButton.classList.remove("bg-green-500");
                downloadButton.classList.add("bg-red-500");
                downloadButton.textContent = "Download Failed";
            });
        });


        if (window.location.protocol != "https:") {
            downloadButton.classList.add("bg-red-500");
            downloadButton.textContent = "Download not available in HTTP mode";
            downloadButton.disabled = true; // Disable the button if not in HTTPS mode
        }

        downloadContainer.appendChild(downloadButton);
        contentContainer.appendChild(downloadContainer);


        container.appendChild(contentContainer);

        document.body.appendChild(container);


        container.addEventListener("click", (event) => {
            console.log("Clicked:", event.target);
            if (event.target === container ) {
                // Close the settings when clicking outside the content area
                container.remove();
            }

        });


    }

    /**
     * Creates a labeled checkbox for a layer
     *
     * @param layer - The layer information object
     * @returns A label element containing a checkbox and the layer name
     */
    private createLabeledCheckbox(layer: LayerInfo): HTMLDivElement {
        let container = document.createElement("div");
        container.classList.add("m-1")
        container.classList.add("inline-flex", "items-center");


        let span2 = document.createElement("span");
        span2.innerHTML = icon(faGear).html[0];
        span2.classList.add("mr-2");
        span2.addEventListener("click", () => {
            this.setOpen(false); // Close the control when settings are opened
            this.openLayerSettings(layer);

            /*
            this.downloadLayerToCache(layer).then((success) => {
                if (success) {
                    span2.classList.remove("bg-red-200");
                    span2.classList.add("bg-green-200");
                } else {
                    this.getMissingCacheFiles(layer).then((missingFiles) => {
                        if (missingFiles.length > 0) {
                            span2.classList.remove("bg-green-200");
                            span2.classList.add("bg-red-200");
                        }
                    }).catch((error) => {
                        console.error("Error getting missing cache files:", error);
                        span2.classList.remove("bg-yellow-200");
                        span2.classList.add("bg-red-200");
                    });
                }
            });

             */
        });
        container.appendChild(span2);
/*
        this.getMissingCacheFiles(layer).then((missingFiles) => {
            if (missingFiles.length > 0) {
                span2.classList.add("bg-red-200");
            } else {
                span2.classList.add("bg-green-200");
            }
        });

 */

        let cLabel = document.createElement("label");
        container.appendChild(cLabel);
        cLabel.classList.add("flex", "items-center", "cursor-pointer", "relative");

        let input = document.createElement("input");
        cLabel.appendChild(input);
        input.type = "checkbox";
        input.id = "cb-" + layer.id; // Set the ID to the layer ID for easy reference
        input.classList.add("peer", "h-5", "w-5", "cursor-pointer", "transition-all", "appearance-none", "rounded", "shadow", "hover:shadow-md", "border", "border-slate-300", "checked:bg-slate-800", "checked:border-slate-800")

        let span = document.createElement("span");
        cLabel.appendChild(span);
        span.classList.add("absolute", "text-white", "opacity-0", "peer-checked:opacity-100", "top-1/2", "left-1/2", "transform", "-translate-x-1/2", "-translate-y-1/2");
        span.innerHTML = '      <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"\n' +
            '        stroke="currentColor" stroke-width="1">\n' +
            '        <path fill-rule="evenodd"\n' +
            '        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"\n' +
            '        clip-rule="evenodd"></path>\n' +
            '      </svg>'
        let textLabel = document.createElement("label");
        container.appendChild(textLabel);
        textLabel.classList.add("cursor-pointer", "ml-2", "text-slate-600", "text-sm");
        textLabel.textContent = layer.name;


        if (this.map?.loaded()) {
            if (this.map.getLayoutProperty(layer.id + "-layer", "visibility") != "none") {
                input.checked = true; // Default to checked if layer is visible
            }
        } else {
            input.checked = false; // Default to unchecked if no map is available
            input.disabled = true; // Disable checkbox if no map is available
            this.map?.once('load', () => {
                // Enable the checkbox once the map is loaded
                input.disabled = false;
                if (this.map?.getLayoutProperty(layer.id + "-layer", "visibility") != "none") {
                    input.checked = true; // Default to checked if layer is visible
                }
            });
        }


        // Add event listener to toggle layer visibility when checkbox is clicked
        input.addEventListener("change", () => {
            // Set visibility based on checkbox state
            let visibility = input.checked ? "visible" : "none";
            const layer = this.layers.get(input.id.substring(3));
            console.log("Checkbox changed for layer:", layer, "Checked:", input.checked);

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

        return container;
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
