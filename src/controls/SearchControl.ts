import {type ControlPosition, Evented, type IControl, Map as MapLibreMap, Marker} from "maplibre-gl";
import {DataProvider, DataProviderEventType} from "../dataProviders/DataProvider";
import type {NamedGeoReferencedObject} from "../enitities/NamedGeoReferencedObject";
import {icon} from "@fortawesome/fontawesome-svg-core";
import {faMagnifyingGlass} from "@fortawesome/free-solid-svg-icons/faMagnifyingGlass";
import {faMapLocationDot} from "@fortawesome/free-solid-svg-icons/faMapLocationDot";
import {faXmark} from "@fortawesome/free-solid-svg-icons/faXmark";
import {GlobalEventHandler} from "../dataProviders/GlobalEventHandler";
import {useControl} from "@vis.gl/react-maplibre";

/**
 * SearchControl provides a lightweight search UI for NamedGeoReferencedObject entries.
 * - Filters DataProvider.getMapLocations() by name
 * - Displays a result list and allows flying to a selected entity
 * - Shows a temporary marker and cleans it up on next map click
 */


type ReactSearchControlProps = {
    position: ControlPosition;
    dataProvider: DataProvider;
    globalEventHandler: GlobalEventHandler;
}
type SearchControlOptions = {
    dataProvider: DataProvider;
    globalEventHandler: GlobalEventHandler;
}
export function ReactSearchControl(props: ReactSearchControlProps) {
    useControl(() => new SearchControl(props as SearchControlOptions), {
        position: props.position
    });

    return null;
}
export default ReactSearchControl;


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
     * The HTML container element that holds the control UI
     */
    private container: HTMLElement;

    private searchInput: HTMLInputElement | undefined;
    private searchResultsBody: HTMLTableSectionElement | undefined;
    private searchIconContainer: HTMLDivElement | undefined;
    private searchContentContainer: HTMLDivElement | undefined;
    private resultsContainer: HTMLTableElement | undefined;
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


    private internalClickAbortHandler: undefined | (() => void) = undefined;

    private options: SearchControlOptions;

    /**
     * Creates a new LayersControl instance
     *
     * @param options - Array of LayerInfo objects representing available layers
     */
    public constructor(options: SearchControlOptions) {
        super();
        this.options = options;

        this.map = undefined;

        // This div will hold all the checkboxes and their labels
        this.container = document.createElement("div");
        this.container.classList.add(
            "maplibregl-ctrl",        // Standard MapLibre control class
            "maplibregl-ctrl-group",  // Groups the control visually
            "search-control",         // Custom class for styling
        );

        this.createSearchContainer();

        options.globalEventHandler.on(DataProviderEventType.MAP_ITEM_UPDATED, () => {
            if (this.searchInput && this.searchInput.value.trim().length > 0) {
                this.onSearchBoxUpdate(this.searchInput.value);
            }
        });

    }

    /**
     * Shows a single entity on the map by creating a marker at its location.
     * @param entity
     */
    private showSingleEntity(entity: NamedGeoReferencedObject): void {

        if (!this.map) {
            return;
        }
        if (this.shownMarkers.has(entity.getId())) {
            console.log("Entity already shown:", entity.getName());
            return; // Entity is already shown, no need to add again
        }

        console.log("Showing entity:", entity.getName());

        const marker = new Marker()
            .setLngLat([entity.getLongitude(), entity.getLatitude()])
            .addTo(this.map);
        this.shownMarkers.set(entity.getId(), marker);

        for (const otherMarker of this.shownMarkers.keys()) {
            if (otherMarker === entity.getId()) {
                continue; // Skip the current entity
            }
            console.log("Other marker:", otherMarker);
            this.shownMarkers.get(otherMarker)?.remove();
            this.shownMarkers.delete(otherMarker);
        }

        this.internalClickAbortHandler = () => {
            console.log("Aborting click handler");
            marker.remove();
            this.shownMarkers.delete(entity.getId());
            this.internalClickAbortHandler = undefined;
        }

    }

    /**
     * Creates a button that, when clicked, will show the entity on the map and fly to its location.
     * @param entity
     */
    private showMarkerButton(entity: NamedGeoReferencedObject): HTMLButtonElement {
        const button = document.createElement("button");

        //button.textContent = "<>";
        button.innerHTML = icon(faMapLocationDot).html[0]
        button.onclick = () => {
            this.showSingleEntity(entity);
            this.map?.flyTo({
                center: [entity.getLongitude(), entity.getLatitude()],
                zoom: entity.getZoomLevel() || 15, // Adjust zoom level as needed
                essential: true // This ensures the animation is not interrupted
            });
            //UrlDataHandler.setSelectedMarker(entity.id);
            this.setOpen(false); // Close the search control after selecting an entity
        }
        return button;
    }

    /**
     * Handles updates to the search box input.
     * @param query
     */
    private onSearchBoxUpdate(query: string): void {
        query = query.trim();
        if (!this.resultsContainer) return;
        if (!this.searchResultsBody) {
            console.error("Search results table not initialized");
            return;
        }

        this.searchResultsBody.innerHTML = ""; // Clear previous results

        //UrlDataHandler.setQueryString(query);
        if (query.length === 0) {
            this.resultsContainer.classList.add("hidden");
            return;
        }
        this.resultsContainer.classList.remove("hidden");
        let resultCount = 0;

        let entries = Array.from(this.options.dataProvider.getMapLocations().values()).filter(entity => entity.getName().toLowerCase().includes(query.toLowerCase()));
        entries = entries.sort((a, b) => a.getName().localeCompare(b.getName())); // Sort results by name
        if (entries.length === 0) {
            this.resultsContainer.classList.add("hidden");
            return; // No results found, exit early
        }
        for (const entity of entries) {
            const row = this.searchResultsBody.insertRow()

            row.onclick = () => {
                this.showSingleEntity(entity);
                this.map?.flyTo({
                    center: [entity.getLongitude(), entity.getLatitude() || 0],
                    zoom: entity.getZoomLevel() || 15,
                    essential: true
                });
                this.setOpen(false);
            }

            const actionCell = row.insertCell();
            actionCell.classList.add("px-2");
            actionCell.appendChild(this.showMarkerButton(entity));

            const nameCell = row.insertCell();
            nameCell.classList.add("pl-6");
            nameCell.innerText = entity.getName();
            resultCount++;
            if (resultCount >= this.resultLimit) {
                break; // Stop after reaching the result limit
            }

        }

    }

    /**
     * Searches for entities based on the provided query string.
     * @param query
     */
    public search(query: string): void {
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
    public onAdd(map: MapLibreMap): HTMLElement {
        this.map = map;

        this.map.on("click", () => {
            if (this.internalClickAbortHandler){
                this.internalClickAbortHandler();
            }
        });

        this.loadStateFromUrl();
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

    /**
     * Loads the state from the URL parameters.
     * @private
     */
    private loadStateFromUrl() {

    }

    /**
     * Creates the search input and results table elements.
     * @private
     */
    private createSearchContainer(): void {
        this.container.classList.add("max-w-[85vw]");
        this.searchIconContainer = document.createElement("div");


        const spanIcon = document.createElement("span");
        this.searchIconContainer.appendChild(spanIcon);
        spanIcon.classList.add("p-[10px]");
        spanIcon.innerHTML = icon(faMagnifyingGlass).html[0];


        const container = document.createElement("div");
        this.searchContentContainer = container;
        container.classList.add("overflow-x-auto", "bg-white");

        const searchContainer = document.createElement("div");
        container.appendChild(searchContainer);
        searchContainer.classList.add("relative", "m-[2px]", "mb-3", "mr-5", "float-left");
        const searchLabel = document.createElement("label");
        searchContainer.appendChild(searchLabel);
        searchLabel.classList.add("sr-only");
        searchLabel.textContent = "Search";
        const searchInput = document.createElement("input");
        searchContainer.appendChild(searchInput);
        this.searchInput = searchInput;
        searchInput.type = "text";
        searchInput.classList.add("block", "w-40", "rounded-lg", "border", "py-2", "pl-10", "pr-4", "text-sm", "focus:border-blue-400", "focus:outline-none", "focus:ring-1", "focus:ring-blue-400");
        const spanIcon2 = document.createElement("span");
        searchContainer.appendChild(spanIcon2);
        spanIcon2.classList.add("pointer-events-none", "absolute", "left-3", "top-1/2", "-translate-y-1/2", "transform");
        spanIcon2.innerHTML = icon(faMagnifyingGlass).html[0];


        //TODO insert Filter

        const closeIconContainer = document.createElement("div");
        closeIconContainer.classList.add("relative", "m-[2px]", "mb-3", "float-right", "sm:block");
        const closeIcon = document.createElement("span");
        closeIcon.classList.add("p-[10px]");
        closeIcon.innerHTML = icon(faXmark).html[0];
        closeIconContainer.appendChild(closeIcon);
        container.appendChild(closeIconContainer);
        closeIconContainer.onclick = () => {
            this.setOpen(false); // Close the search control
        }

        const table = document.createElement("table");
        this.resultsContainer = table;
        container.appendChild(table);
        table.classList.add("min-w-full", "text-left", "text-xs", "whitespace-nowrap");

        const thead = table.createTHead();
        const headerRow = thead.insertRow();
        const cell1 = headerRow.insertCell();
        cell1.textContent = "Action";
        cell1.classList.add("px-2", "py-4");
        const cell2 = headerRow.insertCell();
        cell2.textContent = "Name"
        cell2.classList.add("px-6", "py-4");

        const tBody = table.createTBody();
        this.searchResultsBody = tBody;
        const row = tBody.insertRow();
        row.classList.add("border-b", "dark:border-neutral-600")
        const cellAction = row.insertCell();


        cellAction.classList.add("py-4");

        const cellName = row.insertCell();
        cellName.classList.add("px-6", "py-4");
        cellName.textContent = "Search for a location";

        this.container.innerHTML = ""; // Clear any existing content in the container
        this.container.appendChild(this.searchIconContainer);
        this.container.appendChild(container);

        this.searchInput.addEventListener("input", (e) => {
            const target = e.target as HTMLInputElement;
            this.onSearchBoxUpdate(target.value);
        });

        this.searchIconContainer.addEventListener("click", () => {
            this.setOpen(!this.isOpen); // Toggle the open state
        });

        this.searchIconContainer.classList.add("cursor-pointer")

        this.resultsContainer.classList.add("hidden");
        this.setOpen(false); // Initialize the control as closed

    }

    /**
     * Sets the open state of the control.
     * If isOpen is true, the search input and results table are displayed.
     * If isOpen is false, they are hidden.
     * @param isOpen - Whether to open or close the control
     */
    private setOpen(isOpen: boolean): void {
        this.isOpen = isOpen;
        if (!this.searchContentContainer || !this.searchIconContainer) {
            return;
        }
        if (this.isOpen) {
            this.searchContentContainer.style.display = "block"; // Show the control
            this.searchIconContainer.style.display = "none"; // Show the control
        } else {
            this.searchContentContainer.style.display = "none"; // Hide the control
            this.searchIconContainer.style.display = "block"; // Hide the control
        }
    }
}
