import {Evented, type IControl, Map as MapLibreMap} from "maplibre-gl";
import type {LayerInfo} from "../types/LayerInfo.ts";
import {DataProvider, type DataProviderEvent, DataProviderEventType} from "../dataProviders/DataProvider";
import {icon} from "@fortawesome/fontawesome-svg-core";
import {faMap} from "@fortawesome/free-solid-svg-icons/faMap";
import {faXmark} from "@fortawesome/free-solid-svg-icons/faXmark";
import {faGear} from "@fortawesome/free-solid-svg-icons/faGear";
import {GlobalEventHandler} from "../dataProviders/GlobalEventHandler";
import {LayerCachingController} from "./CachingController";

/**
 * LayersControl provides a UI to toggle overlays and open per-layer settings.
 * Features:
 * - Adds raster sources and layers per LayerInfo
 * - Remembers active overlays in localStorage
 * - Allows adjusting opacity and local caching (PWA) of overlay tiles
 * - Provides reset/logout utilities in settings
 */

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

    private layers_settings_container: Map<string, HTMLDivElement> = new Map();

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


        this.spanIcon.classList.add("p-[10px]");
        this.spanIcon.innerHTML = icon(faMap, {
            transform: {}
        }).html[0];

        this.layersContainer = document.createElement("div")
        this.layersContainer.classList.add('hidden', 'grid')

        this.container.appendChild(this.layersContainer);
        this.container.appendChild(this.spanIcon);

        // Create a map of layer IDs to LayerInfo objects for quick lookup
        GlobalEventHandler.getInstance().on(DataProviderEventType.OVERLAY_ADDED, (event: DataProviderEvent) => {
            const data = event.data as LayerInfo;
            console.log("LayersControl: Overlay added", data);
            this.addLayer(data);
        });
        this.setLayers(DataProvider.getInstance().getOverlays());
        this.inputs = [];

        const previouslyActiveOverlays = localStorage.getItem("activeOverlays");
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
            this.layers.set(layer.getId(), layer);
        }

        // Create a checkbox for each new layer and add it to the container
        for (const layer of overlays.values()) {
            const labeled_checkbox = this.createLabeledCheckbox(layer);
            this.layersContainer.appendChild(labeled_checkbox);
        }
    }

    private showLayerRecursive(id: string) {
        const layer = this.layers.get(id);
        console.log("showing layer", id, layer)
        if (layer == undefined) {
            return
        }
        if (!this.map.getLayer(layer.getId() + '-layer')) {
            if (layer.getUnderlayingLayer() != null) {
                console.log("above", layer.getName(), "UL", layer.getUnderlayingLayer())
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
        console.log("updating shown layers")
        const layersToAdd: LayerInfo[] = Array.from(this.layers.values()).sort((a, b) => a.getName().localeCompare(b.getName()));

        for (const layer of layersToAdd) {
            if (!this.map.getSource(layer.getId())) {
                this.map.addSource(layer.getId(), {
                    type: "raster",           // Use raster tiles
                    tiles: [layer.getUrl() + "?accesstoken=" + DataProvider.getInstance().getApiToken()],       // URL template for the tiles
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
                this.map?.setLayoutProperty(layer.getId() + "-layer", "visibility", "visible");
            } else {
                this.map?.setLayoutProperty(layer.getId() + "-layer", "visibility", "none");
            }
        }

    }

    private addLayer(layer: LayerInfo): void {
        if (this.map === undefined) {
            console.error("LayersControl: Map is not initialized. Cannot add layer.");
            return;
        }
        if (this.map.loaded()) {
            this.updateShownlayers();
        } else {
            this.map.once('load', () => {
                this.updateShownlayers();
            });
        }
        this.layers.set(layer.getId(), layer);
        const labeled_checkbox = this.createLabeledCheckbox(layer);

        this.layersContainer.appendChild(labeled_checkbox);
    }

    private openLayerSettings(layer: LayerInfo) {
        let container = this.layers_settings_container.get(layer.getId())
        if (container == undefined) {
            container = document.createElement("div");
            container.classList.add("absolute", "top-0", "left-0", "w-full", "h-full", "z-50", "flex", "flex-col", "items-center", "justify-center");

            const contentContainer = document.createElement("div");

            contentContainer.classList.add("bg-white", "p-4", "rounded", "w-11/12", "max-w-md");
            const opacityContainer = document.createElement("div");
            opacityContainer.classList.add("mb-4");
            const opacityLabel = document.createElement("label");
            opacityLabel.classList.add();
            opacityLabel.setAttribute("for", "opacity-range");
            opacityLabel.textContent = `Opacity: ${layer.getOpacity() * 100}%`;
            const opacityInput = document.createElement("input");
            opacityInput.setAttribute("type", "range");
            opacityInput.setAttribute("id", "opacity-range");
            opacityInput.setAttribute("min", "0");
            opacityInput.setAttribute("max", "100");
            opacityInput.setAttribute("value", layer.getOpacity() * 100 + "");
            opacityInput.classList.add("w-full", "h-2", "bg-gray-200", "rounded-lg", "appearance-none", "cursor-pointer", "dark:bg-gray-700");
            opacityInput.addEventListener("input", () => {
                const opacity = parseFloat(opacityInput.value) / 100;
                opacityLabel.textContent = `Opacity: ${opacityInput.value}%`;
                if (this.map) {
                    this.map.setPaintProperty(layer.getId() + "-layer", "raster-opacity", opacity);
                }
                layer.setOpacity(opacity);
                DataProvider.getInstance().addOverlay(layer.getId(), layer);
            });
            opacityContainer.appendChild(opacityLabel);
            opacityContainer.appendChild(opacityInput);
            contentContainer.appendChild(opacityContainer);


            const downloadContainer = document.createElement("div");
            downloadContainer.classList.add("mb-4");
            const downloadButton = document.createElement("button");
            downloadButton.classList.add("bg-blue-500", "text-white", "px-4", "py-2", "rounded", "hover:bg-blue-600");
            downloadButton.textContent = "Loading...";
            downloadButton.addEventListener("click", () => {
                downloadButton.innerText = "Downloading...";
                LayerCachingController.getInstance().downloadLayerToCache(layer, downloadButton).then((success) => {
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
            (async () => {

                const layerStatus = await LayerCachingController.getInstance().getLayerCachedStatus(layer)

                switch (layerStatus) {
                    case "cached":
                        downloadButton.classList.remove("bg-red-500");
                        downloadButton.classList.add("bg-green-500");
                        downloadButton.textContent = "Already downloaded to cache";
                        downloadButton.disabled = true; // Disable the button if all tiles are already cached
                        break;
                    case 'error':
                        downloadButton.classList.add("bg-red-500");
                        downloadButton.textContent = "No tiles available for download";
                        downloadButton.disabled = true; // Disable the button if no tiles are available
                        break;
                    default:
                        downloadButton.classList.remove("bg-red-500", "bg-yellow-500");
                        downloadButton.classList.add("bg-blue-500");
                        downloadButton.textContent = `Download Layer reamining tiles`;
                }
            })();


            if (window.location.protocol != "https:") {
                downloadButton.classList.add("bg-red-500");
                downloadButton.textContent = "Download not available in HTTP mode";
                downloadButton.disabled = true; // Disable the button if not in HTTPS mode
            }

            downloadContainer.appendChild(downloadButton);

            const resetContainer = document.createElement("div");
            resetContainer.classList.add("mb-4");
            const resetButton = document.createElement("button");
            resetButton.classList.add("bg-red-500", "text-white", "px-4", "py-2", "rounded", "hover:bg-red-600");
            resetButton.textContent = "Reset Layer Cache";
            resetButton.addEventListener("click", () => {
                if (confirm("Are you sure you want to reset the layer cache? This will clear all cached data.")) {
                    resetButton.innerText = "Resetting...";
                    LayerCachingController.getInstance().resetLayerCache(layer).then(() => {
                        resetButton.innerText = "Done";
                    })
                }
            });
            resetContainer.appendChild(resetButton);

            const underlayingLayerContainer = document.createElement("div");
            underlayingLayerContainer.classList.add("mb-4");
            const selectLabel = document.createElement("label");
            selectLabel.classList.add("block", "text-sm", "font-medium", "text-gray-700");
            selectLabel.textContent = "Underlaying Layer";
            underlayingLayerContainer.appendChild(selectLabel);
            const select = document.createElement("select");
            select.required = false;
            underlayingLayerContainer.appendChild(select);
            select.addEventListener("change", (event) => {
                const target = event.target as HTMLSelectElement;
                layer.setUnderlayingLayer(target.value);
                console.log(layer)
                this.layers.set(layer.getId(), layer);
                this.updateShownlayers();
            });
            const option = document.createElement("option");
            option.value = null;
            option.textContent = "None";
            select.appendChild(option);
            for (const l of this.layers.values()) {
                if (l.getId() != layer.getId()) {
                    const option = document.createElement("option");
                    option.value = l.getId();
                    option.textContent = l.getName();
                    select.appendChild(option);
                    if (layer.getUnderlayingLayer() != null && typeof layer.getUnderlayingLayer() === "string" && layer.getUnderlayingLayer() === l.getId()) {
                        option.selected = true;
                    }
                }
            }


            const logoutContainer = document.createElement("div");
            logoutContainer.classList.add("mb-4");
            const logoutButton = document.createElement("button");
            logoutButton.classList.add("bg-red-500", "text-white", "px-4", "py-2", "rounded", "hover:bg-red-600");
            logoutButton.textContent = "Logout";
            logoutButton.addEventListener("click", () => {
                if (confirm("Are you sure you want to logout? This will clear all cached data.")) {
                    caches.keys().then((cacheNames) => {
                        cacheNames.forEach((cacheName) => {
                            caches.delete(cacheName);
                        });
                    }).then(() => {
                        localStorage.clear();
                        location.reload(); // Reload the page to apply changes
                    }).catch((error) => {
                        console.error("Error clearing caches:", error);
                    });
                }
            });
            logoutContainer.appendChild(logoutButton);


            contentContainer.appendChild(downloadContainer);
            contentContainer.appendChild(resetContainer);
            contentContainer.appendChild(underlayingLayerContainer);
            contentContainer.appendChild(logoutContainer);


            container.appendChild(contentContainer);


            container.addEventListener("click", (event) => {
                console.log("Clicked:", event.target);
                if (event.target === container) {
                    // Close the settings when clicking outside the content area
                    container.remove();
                }

            });
            this.layers_settings_container.set(layer.getId(), container);
        }
        document.body.appendChild(container);

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


        const span2 = document.createElement("span");
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


        if (this.map?.loaded()) {
            if (this.map.getLayoutProperty(layer.getId() + "-layer", "visibility") != "none") {
                input.checked = true; // Default to checked if layer is visible
            }
        } else {
            input.checked = false; // Default to unchecked if no map is available
            input.disabled = true; // Disable checkbox if no map is available
            this.map?.once('load', () => {
                // Enable the checkbox once the map is loaded
                input.disabled = false;
                if (this.map?.getLayoutProperty(layer.getId() + "-layer", "visibility") != "none") {
                    input.checked = true; // Default to checked if layer is visible
                }
            });
        }


        // Add event listener to toggle layer visibility when checkbox is clicked
        input.addEventListener("change", () => {
            // Set visibility based on checkbox state
            const visibility = input.checked ? "visible" : "none";
            const layer = this.layers.get(input.id.substring(3));
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
            const layer = this.layers.get(input.id);
            if (layer) {
                // Determine if the layer is currently visible
                let is_visible = true;
                if (this.map) {
                    is_visible =
                        is_visible &&
                        this.map.getLayoutProperty(layer.getId() + '-layer', "visibility") !== "none";
                } else {
                    is_visible = false; // If no map, then no layers can be visible
                }

                // Set checkbox state to match layer visibility
                input.checked = is_visible;
                if (is_visible) {
                    this.activeOverlays.set(layer.getId(), true);
                } else {
                    this.activeOverlays.delete(layer.getId());
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
