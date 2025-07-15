import {Evented, type IControl, Map as MapLibreMap, Marker} from "maplibre-gl";
import type {MapEntity} from "../types/MapEntity.ts";
import UrlDataHandler from "../dataProviders/UrlDataHandler.ts";


type SearchControlOptions = {
    entities: MapEntity[];
}

/**
 * A control for MapLibre GL JS that allows users to toggle the visibility of map layers.
 * Implements the IControl interface required by MapLibre GL JS.
 */
export class SearchControl extends Evented implements IControl {
    /**
     * Reference to the MapLibre map instance
     */
    private map: MapLibreMap | undefined;

    /**
     * Array of layer information objects passed to the constructor
     */
    public readonly options: SearchControlOptions;

    /**
     * The HTML container element that holds the control UI
     */
    private container: HTMLElement;

    /**
     * Array of MapEntity objects representing available entities
     * @private
     */
    private entities: MapEntity[];

    private searchInput: HTMLInputElement | undefined;
    private searchResultsTable: HTMLTableElement | undefined;
    private searchIcon: HTMLLabelElement | undefined;

    /**
     * The maximum number of search results to display
     * @private
     */
    private resultLimit: number = 5;

    /**
     * Map of shown entity IDs to their corresponding Marker objects for quick lookup
     * @private
     */
    private shownMarkers: Map<string, Marker> = new Map<string, Marker>();

    /**
     * Flag to track if the control is currently open
     * @private
     */
    private isOpen: boolean = false;

    /**
     * Creates a new LayersControl instance
     *
     * @param options - Array of LayerInfo objects representing available layers
     */
    constructor(options: SearchControlOptions) {
        super();

        this.map = undefined;

        // This div will hold all the checkboxes and their labels
        this.container = document.createElement("div");
        this.container.classList.add(
            "maplibregl-ctrl",        // Standard MapLibre control class
            "maplibregl-ctrl-group",  // Groups the control visually
            "layers-control",         // Custom class for styling
        );
        this.options = options;

        this.entities = options.entities;

        this.createSearchContainer();

        this.searchIcon = document.createElement("label");
        this.searchIcon.innerText = "Search";
        this.container.appendChild(this.searchIcon);

        this.container.onmouseover = () => {
            this.setOpen(true);
        }
        this.container.onmouseout = () => {
            this.setOpen(false);
        }
    }

    /**
     * Shows a single entity on the map by creating a marker at its location.
     * @param entity
     */
    showSingleEntity(entity: MapEntity): void {

        if (!this.map) {
            return;
        }
        if (this.shownMarkers.has(entity.id)) {
            console.log("Entity already shown:", entity.name);
            return; // Entity is already shown, no need to add again
        }

        console.log("Showing entity:", entity.name);

        let marker = new Marker()
            .setLngLat([entity.longitude, entity.latitude])
            .addTo(this.map);
        this.shownMarkers.set(entity.id, marker);

        for (const otherMarker of this.shownMarkers.keys()) {
            if (otherMarker === entity.id) {
                continue; // Skip the current entity
            }
            console.log("Other marker:", otherMarker);
            this.shownMarkers.get(otherMarker)?.remove();
            this.shownMarkers.delete(otherMarker);
        }

    }

    /**
     * Creates a button that, when clicked, will show the entity on the map and fly to its location.
     * @param entity
     */
    showMarkerButton(entity: MapEntity): HTMLButtonElement {
        let button = document.createElement("button");
        button.textContent = "<>";
        button.onclick = () => {
            this.showSingleEntity(entity);
            this.map?.flyTo({
                center: [entity.longitude, entity.latitude],
                zoom: 15, // Adjust zoom level as needed
                essential: true // This ensures the animation is not interrupted
            });
            UrlDataHandler.setSelectedMarker(entity.id);
        }
        return button;
    }

    /**
     * Handles updates to the search box input.
     * @param query
     */
    onSearchBoxUpdate(query: string): void {
        query = query.trim();
        if (!this.searchResultsTable) {
            console.error("Search results table not initialized");
            return;
        }
        this.searchResultsTable.innerHTML = ""; // Clear previous results

        UrlDataHandler.setQueryString(query);
        if (query.length === 0) {
            return;
        }

        let resultCount = 0;
        for (const entity of this.entities) {
            if (entity.name.toLowerCase().includes(query.toLowerCase())) {
                let row = this.searchResultsTable.insertRow()
                row.insertCell().textContent = entity.name;
                row.insertCell().appendChild(this.showMarkerButton(entity));
                resultCount++;
                if (resultCount >= this.resultLimit) {
                    break; // Stop after reaching the result limit
                }
            }
        }
    }

    /**
     * Searches for entities based on the provided query string.
     * @param query
     */
    search(query: string): void {
        if (!this.searchInput) {
            console.error("Search input not initialized");
            return;
        }
        this.searchInput.value = query;
        this.onSearchBoxUpdate(query);
    }

    /**
     * Adds the control to the map
     * Required method for MapLibre IControl interface
     *
     * @param map - The MapLibre map instance
     * @returns The control's container element
     */
    onAdd(map: MapLibreMap): HTMLElement {
        this.map = map;

        this.loadStateFromUrl();
        // Return the container element to be added to the map
        return this.container;
    }

    /**
     * Removes the control from the map
     * Required method for MapLibre IControl interface
     */
    onRemove() {
        // Remove the container from its parent element
        if (this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }

        // Clear the map reference
        this.map = undefined;
    }

    /**
     * Loads the state from the URL parameters.
     * @private
     */
    private loadStateFromUrl() {
        let queryString = UrlDataHandler.getQueryString();
        if (queryString) {
            this.search(queryString);
        }

        let selectedMarker = UrlDataHandler.getSelectedMarker();
        if (selectedMarker) {
            let entity = this.entities.find(e => e.id === selectedMarker);
            if (entity) {
                this.showSingleEntity(entity);
                this.map?.flyTo({
                    center: [entity.longitude, entity.latitude],
                    zoom: 15, // Adjust zoom level as needed
                    essential: true // This ensures the animation is not interrupted
                });
            }
        }

    }

    /**
     * Creates the search input and results table elements.
     * @private
     */
    private createSearchContainer(): void {
        this.searchResultsTable = document.createElement("table");
        this.searchResultsTable.style.display = "none";

        this.searchInput = document.createElement("input");
        this.searchInput.style.display = "none";
        this.searchInput.addEventListener("input", (e) => {
            const target = e.target as HTMLInputElement;
            this.onSearchBoxUpdate(target.value);
        });

        this.container.appendChild(this.searchInput);
        this.container.appendChild(this.searchResultsTable);
    }

    /**
     * Sets the open state of the control.
     * If isOpen is true, the search input and results table are displayed.
     * If isOpen is false, they are hidden.
     * @param isOpen - Whether to open or close the control
     */
    setOpen(isOpen: boolean): void {
        if (this.isOpen === isOpen) {
            return; // No change needed
        }
        this.isOpen = isOpen;
        if (!this.searchInput || !this.searchResultsTable || !this.searchIcon) {
            return;
        }
        if (this.isOpen) {
            this.searchInput.style.display = "block"; // Show the control
            this.searchResultsTable.style.display = "block"; // Show the control
            this.searchIcon.style.display = "none"; // Show the control
        } else {
            this.searchInput.style.display = "none"; // Hide the control
            this.searchResultsTable.style.display = "none"; // Hide the control
            this.searchIcon.style.display = "block"; // Hide the control
        }
    }
}
