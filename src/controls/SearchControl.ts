/*
 * SearchControl.ts
 * ----------------
 * Map search control that connects to DataProvider to look up named places/objects.
 * Exports: default ReactSearchControl component which registers the control.
 * Purpose: allow quick map navigation / zoom to named geo-referenced objects.
 */

import { type ControlPosition, Evented, type IControl, Map as MapLibreMap, Marker } from 'maplibre-gl';
import type { MapItem } from '../enitities/MapItem.ts';
import { icon } from '@fortawesome/fontawesome-svg-core';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons/faMagnifyingGlass';
import { faMapLocationDot } from '@fortawesome/free-solid-svg-icons/faMapLocationDot';
import { faXmark } from '@fortawesome/free-solid-svg-icons/faXmark';
import { useControl } from '@vis.gl/react-maplibre';

import './css/search.scss';
import { MapItemContext } from '../contexts/MapItemContext.tsx';
import { useContext } from 'react';
import { UnitsContext } from '../contexts/UnitsContext.tsx';

/**
 * SearchControl provides a lightweight search UI for NamedGeoReferencedObject entries.
 * - Filters DataProvider.getMapLocations() by name
 * - Displays a result list and allows flying to a selected entity
 * - Shows a temporary marker and cleans it up on next map click
 */


interface ReactSearchControlProps {
    position: ControlPosition;
}

interface SearchControlOptions {
    searchCallback: (query: string) => SearchResult[]; // Optional callback to perform search, defaults to searching all MapItems by name
}

export interface SearchResult {
    id: string;
    name: string;
    longitude: number;
    latitude: number;
    zoomLevel?: number;
}

export function ReactSearchControl(props: ReactSearchControlProps): null {


    const mapItems: MapItem[] = useContext(MapItemContext);
    const units = useContext(UnitsContext);

    const searchControlInstance = new SearchControl({
        searchCallback: (query: string) => {
            const unitResults: SearchResult[] = units.filter((unit) => unit.getName().toLowerCase().includes(query.toLowerCase()) && unit.getPosition()).map((unit) => ({
                id: unit.getId(),
                name: unit.getName(),
                longitude: unit.getPosition()!.getLongitude(),
                latitude: unit.getPosition()!.getLatitude(),
                zoomLevel: 15
            }));

            const mapItemResults: SearchResult[] = mapItems.filter((item) => item.getName().toLowerCase().includes(query.toLowerCase())).map((item) => ({
                id: item.getId(),
                name: item.getName(),
                longitude: item.getLongitude(),
                latitude: item.getLatitude(),
                zoomLevel: 15
            }));


            return [...unitResults, ...mapItemResults];
        }
    });

    useControl(() => searchControlInstance, {
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
    private resultLimit = 5;

    private selectedItemMarker = new Marker();

    /**
     * Flag to track if the control is currently open
     * @private
     */
    private isOpen = false;


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
        this.container = document.createElement('div');
        this.container.classList.add(
            'maplibregl-ctrl',        // Standard MapLibre control class
            'maplibregl-ctrl-group',  // Groups the control visually
            'searchcontrol-root',         // Custom class for styling
        );
        this.createSearchContainer();
    }

    /**
     * Shows a single entity on the map by creating a marker at its location.
     * @param entity
     */
    private showSingleEntity(entity: SearchResult): void {

        if (!this.map) {
            return;
        }

        this.selectedItemMarker
            .setLngLat([entity.longitude, entity.latitude])
            .addTo(this.map);

        this.internalClickAbortHandler = (): void => {
            this.selectedItemMarker.remove();
            this.internalClickAbortHandler = undefined;
        };

    }

    /**
     * Creates a button that, when clicked, will show the entity on the map and fly to its location.
     * @param entity
     */
    private showMarkerButton(entity: SearchResult): HTMLButtonElement {
        const button = document.createElement('button');

        //button.textContent = "<>";
        button.innerHTML = icon(faMapLocationDot).html[0];
        button.onclick = (): void => {
            this.showSingleEntity(entity);
            this.map?.flyTo({
                center: [entity.longitude, entity.latitude],
                zoom: entity.zoomLevel || 15, // Adjust zoom level as needed
                essential: true // This ensures the animation is not interrupted
            });
            this.setOpen(false); // Close the search control after selecting an entity
        };
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
            console.error('Search results table not initialized');
            return;
        }

        this.searchResultsBody.innerHTML = ''; // Clear previous results

        //UrlDataHandler.setQueryString(query);
        if (query.length === 0) {
            this.resultsContainer.classList.add('hidden');
            return;
        }
        this.resultsContainer.classList.remove('hidden');
        let resultCount = 0;

        let entries: SearchResult[] = this.options.searchCallback(query);
        entries = entries.sort((a, b) => a.name.localeCompare(b.name)); // Sort results by name
        if (entries.length === 0) {
            this.resultsContainer.classList.add('hidden');
            return; // No results found, exit early
        }
        for (const entity of entries) {
            const row = this.searchResultsBody.insertRow();

            const actionCell = row.insertCell();
            actionCell.appendChild(this.showMarkerButton(entity));

            const nameCell = row.insertCell();
            nameCell.innerText = entity.name;
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
            console.error('Search input not initialized');
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

        this.map.on('click', () => {
            if (this.internalClickAbortHandler) {
                this.internalClickAbortHandler();
            }
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

        // Clear the map reference
        this.map = undefined;
    }


    /**
     * Creates the search input and results table elements.
     * @private
     */
    private createSearchContainer(): void {
        this.searchIconContainer = document.createElement('div');


        const spanIcon = document.createElement('span');
        this.searchIconContainer.appendChild(spanIcon);
        spanIcon.innerHTML = icon(faMagnifyingGlass).html[0];


        const container = document.createElement('div');
        this.searchContentContainer = container;

        const containerRowOne = document.createElement('div');
        container.appendChild(containerRowOne);
        const searchLabel = document.createElement('label');
        containerRowOne.appendChild(searchLabel);
        searchLabel.textContent = 'Search';
        const searchInput = document.createElement('input');
        containerRowOne.appendChild(searchInput);
        this.searchInput = searchInput;
        searchInput.type = 'text';
        const searchIconButton = document.createElement('button');
        containerRowOne.appendChild(searchIconButton);
        const spanIcon2 = document.createElement('span');
        searchIconButton.appendChild(spanIcon2);
        spanIcon2.innerHTML = icon(faMagnifyingGlass).html[0];


        const closeIconContainer = document.createElement('button');
        const closeIcon = document.createElement('span');
        closeIcon.innerHTML = icon(faXmark).html[0];
        closeIconContainer.appendChild(closeIcon);
        containerRowOne.appendChild(closeIconContainer);
        closeIconContainer.onclick = (): void => {
            this.setOpen(false); // Close the search control
        };

        const filterRow = document.createElement('div');
        container.appendChild(filterRow);
        // Add filter options here in the future


        const table = document.createElement('table');
        this.resultsContainer = table;
        container.appendChild(table);

        const thead = table.createTHead();
        const headerRow = thead.insertRow();
        const cell1 = headerRow.insertCell();
        cell1.textContent = 'Action';
        const cell2 = headerRow.insertCell();
        cell2.textContent = 'Name';

        const tBody = table.createTBody();
        this.searchResultsBody = tBody;

        this.container.innerHTML = ''; // Clear any existing content in the container
        this.container.appendChild(this.searchIconContainer);
        this.container.appendChild(container);

        this.searchInput.addEventListener('input', (e) => {
            const target = e.target as HTMLInputElement;
            this.onSearchBoxUpdate(target.value);
        });

        this.searchIconContainer.addEventListener('click', () => {
            this.setOpen(!this.isOpen); // Toggle the open state
        });

        this.searchIconContainer.classList.add('cursor-pointer');

        this.resultsContainer.classList.add('hidden');
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
            this.searchContentContainer.style.display = 'block'; // Show the control
            this.searchIconContainer.style.display = 'none'; // Show the control
        } else {
            this.searchContentContainer.style.display = 'none'; // Hide the control
            this.searchIconContainer.style.display = 'block'; // Hide the control
        }
    }
}
