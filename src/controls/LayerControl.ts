import {type ControlPosition, Evented, type IControl, Map as MapLibreMap} from 'maplibre-gl';
import {icon} from '@fortawesome/fontawesome-svg-core';
import {faMap} from '@fortawesome/free-solid-svg-icons/faMap';
import {faXmark} from '@fortawesome/free-solid-svg-icons/faXmark';
import {DOM} from 'maplibre-gl/src/util/dom';
import {DataProvider, DataProviderEventType} from '../dataProviders/DataProvider';
import {useControl} from '@vis.gl/react-maplibre';
import {type Overlay, OverlayEvent} from '../enitities/Overlay.ts';

/**
 * LayersControl provides a UI to toggle overlays and open per-layer settings.
 * Features:
 * - Adds raster sources and layers per LayerInfo
 * - Remembers active overlays in localStorage
 * - Allows adjusting opacity and local caching (PWA) of overlay tiles
 * - Provides reset/logout utilities in settings
 */


interface ReactLayerControlProps {
    position: ControlPosition;
    dataProvider: DataProvider;
}

function ReactLayerControl(props: ReactLayerControlProps): null {
    useControl(() => new LayersControl(props as LayerControlOptions), {
        position: props.position
    });

    return null;
}

export default ReactLayerControl;

interface LayerControlOptions {
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

    private isOpen = false; // Flag to track if the control is open or closed

    private spanIcon = document.createElement('span');


    /**
     * Map of layer IDs to their corresponding LayerInfo objects for quick lookup
     */
    private overlays = new Map<string, Overlay>();

    /**
     * Map to track active overlays by their IDs
     * This is used to persist the state of active overlays across sessions
     * @private
     */
    private activeOverlays = new Map<string, boolean>();


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

        this.container = DOM.create('div', 'maplibregl-ctrl');
        this.container.classList.add(
            'maplibregl-ctrl-group',
            'layerscontrol-root'
        );

        this.spanIcon.innerHTML = icon(faMap, {
            transform: {}
        }).html[0];

        this.layersContainer = document.createElement('div');
        this.layersContainer.classList.add('hidden');
        this.container.appendChild(this.layersContainer);
        this.container.appendChild(this.spanIcon);

        this.spanIcon.addEventListener('click', () => {
            this.setOpen(!this.isOpen);
        });

        this.options.dataProvider.on(DataProviderEventType.OVERLAY_ADDED, () => {
            console.log('Event: Overlay added');
            console.log(this.options.dataProvider.getOverlays().values());
            this.setOverlays(Array.from(this.options.dataProvider.getOverlays().values()));
        });
        this.setOverlays(Array.from(this.options.dataProvider.getOverlays().values()));
        console.log('MAP INIT:', Array.from(this.options.dataProvider.getOverlays().values()));
    }

    private setOpen(open: boolean): void {
        this.isOpen = open;
        if (open) {
            this.layersContainer.classList.remove('hidden');
            this.spanIcon.innerHTML = icon(faXmark).html[0];
        } else {
            this.layersContainer.classList.add('hidden');
            this.spanIcon.innerHTML = icon(faMap).html[0];
        }
    }

    private updateShownlayers(): void {
        if (this.map == undefined) return;
        const layersToAdd: Overlay[] = Array.from(this.overlays.values()).sort((a, b) => {
            if (a.getOrder() != b.getOrder()) {
                return a.getOrder() - b.getOrder();
            }
            return a.getName().localeCompare(b.getName());
        });

        for (const layer of layersToAdd) {
            if (!this.map.getSource(layer.getId())) {
                this.map.addSource(layer.getId(), {
                    type: 'raster',           // Use raster tiles
                    tiles: [layer.getUrl() + '?accesstoken=' + this.options.dataProvider.getApiToken()],       // URL template for the tiles
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
            this.map.addLayer({
                id: layer.getId() + '-layer',  // Create unique layer ID
                type: 'raster',           // Render as raster layer
                source: layer.getId(),         // Reference to the source created above
            });
        }

        for (const layer of layersToAdd) {
            if (this.activeOverlays.get(layer.getId()) == true) {
                this.map.setLayoutProperty(layer.getId() + '-layer', 'visibility', 'visible');
            } else {
                this.map.setLayoutProperty(layer.getId() + '-layer', 'visibility', 'none');
            }
        }

    }

    /**
     * Creates a labeled checkbox for a layer
     *
     * @param layer - The layer information object
     * @returns A label element containing a checkbox and the layer name
     */
    private createLabeledCheckbox(layer: Overlay): HTMLDivElement {
        const container = document.createElement('div');


        const input = document.createElement('input');
        container.appendChild(input);
        input.type = 'checkbox';
        input.id = 'cb-' + layer.getId(); // Set the ID to the layer ID for easy reference

        const textLabel = document.createElement('label');
        container.appendChild(textLabel);
        textLabel.textContent = layer.getName();

        // Add event listener to toggle layer visibility when checkbox is clicked
        input.addEventListener('change', () => {
            // Set visibility based on checkbox state
            const visibility = input.checked ? 'visible' : 'none';
            const layer = this.overlays.get(input.id.substring(3));
            console.log('Checkbox changed for layer:', layer, 'Checked:', input.checked);

            if (layer && this.map) {
                // Update the layer's visibility property in the map
                this.map.setLayoutProperty(layer.getId() + '-layer', 'visibility', visibility);
                if (visibility === 'visible') {
                    this.activeOverlays.set(layer.getId(), true);
                } else {
                    this.activeOverlays.delete(layer.getId());
                }
                localStorage.setItem('activeOverlays', JSON.stringify(Array.from(this.activeOverlays.keys())));
            }
        });


        if (this.map) {
            if (this.map.getLayer(layer.getId() + '-layer')) {
                if (this.map.getLayoutProperty(layer.getId() + '-layer', 'visibility') === 'visible') {
                    input.checked = true;
                    this.activeOverlays.set(layer.getId(), true);
                }
            }
        }
        return container;
    }


    private buildUI(): void {
        if (this.map == undefined || !this.map.loaded()) {
            return;
        }
        this.layersContainer.innerHTML = '';

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

    public setOverlays(overlays: Overlay[]): void {

        for (const layer of Array.from(this.overlays.keys())) {
            if (!overlays.find(l => l.getId() === layer)) {
                this.overlays.delete(layer);
            }
        }

        this.overlays = new Map();
        for (const layer of overlays.filter(l => !Array.from(this.overlays.keys()).includes(l.getId()))) {
            this.overlays.set(layer.getId(), layer);

            layer.on(OverlayEvent.orderChanged, (e) => {
                console.log('Event: Layer order changed for ', layer.getName(), e);
                this.updateShownlayers();
            });
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

        void map.once('load', () => {
            this.buildUI();
        });

        map.on('mousedown', () => {
            this.setOpen(false);
        });

        // Return the container element to be added to the map
        return this.container;
    }

    /**
     * Removes the control from the map
     * Required method for MapLibre IControl interface
     */
    public onRemove(): void {
        // Remove the container from its parent element
        if (this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }

        this.map = undefined;
    }
}
