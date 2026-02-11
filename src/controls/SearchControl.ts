/*
 * SearchControl.ts
 * ----------------
 * Map search control that connects to DataProvider to look up named places/objects.
 * Exports: default ReactSearchControl component which registers the control.
 * Purpose: allow quick map navigation / zoom to named geo-referenced objects.
 */

import {
    type ControlPosition,
    Evented,
    type IControl,
    Map as MapLibreMap,
    Marker,
    type MarkerOptions
} from 'maplibre-gl';
import {DataProvider, DataProviderEventType} from '../dataProviders/DataProvider';
import type {MapItem} from '../enitities/MapItem.ts';
import {icon} from '@fortawesome/fontawesome-svg-core';
import {faMagnifyingGlass} from '@fortawesome/free-solid-svg-icons/faMagnifyingGlass';
import {faMapLocationDot} from '@fortawesome/free-solid-svg-icons/faMapLocationDot';
import {faWrench} from '@fortawesome/free-solid-svg-icons/faWrench';
import {faXmark} from '@fortawesome/free-solid-svg-icons/faXmark';
import {DataEvent, GlobalEventHandler} from '../dataProviders/GlobalEventHandler';
import {useControl} from '@vis.gl/react-maplibre';

import './css/search.scss';
import {ApplicationLogger} from '../ApplicationLogger.ts';
import type {Unit} from '../enitities/Unit.ts';

/**
 * SearchControl provides a lightweight search UI for NamedGeoReferencedObject entries.
 * - Filters DataProvider.getMapLocations() by name
 * - Displays a result list and allows flying to a selected entity
 * - Shows a temporary marker and cleans it up on next map click
 */


interface ReactSearchControlProps {
    position: ControlPosition;
    dataProvider: DataProvider;
    globalEventHandler: GlobalEventHandler;
}

interface SearchControlOptions {
    dataProvider: DataProvider;
    globalEventHandler: GlobalEventHandler;
}

let searchControlInstance: SearchControl | null = null;

export function ReactSearchControl(props: ReactSearchControlProps): null {
    if (searchControlInstance === null) {
        searchControlInstance = new SearchControl(props as SearchControlOptions);
    }
    useControl(() => searchControlInstance as SearchControl, {
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

    /**
     * Map of shown entity IDs to their corresponding Marker objects for quick lookup
     * @private
     */
    private shownMarkers: Map<string, Marker> = new Map<string, Marker>();

    private shownUnits: Map<string, Marker> = new Map<string, Marker>();


    private iconSize: number = localStorage.getItem('unit_icon_size') ? Number(localStorage.getItem('unit_icon_size')) : 50;
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
    private showSingleEntity(entity: MapItem): void {

        if (!this.map) {
            return;
        }
        if (this.shownMarkers.has(entity.getId() as string)) {
            return; // Entity is already shown, no need to add again
        }
        const marker = new Marker()
            .setLngLat([entity.getLongitude(), entity.getLatitude()])
            .addTo(this.map);
        this.shownMarkers.set(entity.getId() as string, marker);

        for (const otherMarker of this.shownMarkers.keys()) {
            if (otherMarker === entity.getId()) {
                continue; // Skip the current entity
            }
            this.shownMarkers.get(otherMarker)?.remove();
            this.shownMarkers.delete(otherMarker);
        }

        this.internalClickAbortHandler = (): void => {
            marker.remove();
            this.shownMarkers.delete(entity.getId() as string);
            this.internalClickAbortHandler = undefined;
        };

    }

    /**
     * Creates a button that, when clicked, will show the entity on the map and fly to its location.
     * @param entity
     */
    private showMarkerButton(entity: MapItem): HTMLButtonElement {
        const button = document.createElement('button');

        //button.textContent = "<>";
        button.innerHTML = icon(faMapLocationDot).html[0];
        button.onclick = (): void => {
            this.showSingleEntity(entity);
            this.map?.flyTo({
                center: [entity.getLongitude(), entity.getLatitude()],
                zoom: entity.getZoomLevel() || 15, // Adjust zoom level as needed
                essential: true // This ensures the animation is not interrupted
            });
            this.setOpen(false); // Close the search control after selecting an entity
        };
        return button;
    }

    /**
     * Creates a button that, when clicked, will show the entity on the map and fly to its location.
     * @param entity
     */
    private showSettingsButton(entity: MapItem): HTMLButtonElement {
        const button = document.createElement('button');

        //button.textContent = "<>";
        button.innerHTML = icon(faWrench).html[0];
        button.onclick = (): void => {
            GlobalEventHandler.getInstance().emit('edit-marker', new DataEvent('edit-marker', entity));
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

        let entries = Array.from(this.options.dataProvider.getMapLocations().values()).filter(entity => entity.getName().toLowerCase().includes(query.toLowerCase()));
        entries = entries.sort((a, b) => a.getName().localeCompare(b.getName())); // Sort results by name
        if (entries.length === 0) {
            this.resultsContainer.classList.add('hidden');
            return; // No results found, exit early
        }
        for (const entity of entries) {
            const row = this.searchResultsBody.insertRow();

            const actionCell = row.insertCell();
            actionCell.appendChild(this.showMarkerButton(entity));

            const nameCell = row.insertCell();
            nameCell.innerText = entity.getName();
            resultCount++;
            if (resultCount >= this.resultLimit) {
                break; // Stop after reaching the result limit
            }

            const settingsCell = row.insertCell();
            settingsCell.appendChild(this.showSettingsButton(entity));

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

        DataProvider.getInstance().on(DataProviderEventType.UNIT_UPDATED, (event) => {
            ApplicationLogger.info('Unit updated, updating on map:' + (event.data as Unit).getName(), {service: 'SearchControl'});
            const item = event.data as Unit;
            this.updateUnit(item);
        });
        DataProvider.getInstance().on(DataProviderEventType.UNIT_ADDED, (event) => {
            ApplicationLogger.info('New unit added, showing on map:' + (event.data as Unit).getName(), {service: 'SearchControl'});
            const item = event.data as Unit;
            this.updateUnit(item);
        });
        DataProvider.getInstance().getUnits().forEach((item) => {
            ApplicationLogger.info('Showing existing unit on map:' + item.getName(), {service: 'SearchControl'});
            this.updateUnit(item);
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

    private timeUpdateIntervals: Map<string, NodeJS.Timeout> = new Map<string, NodeJS.Timeout>();

    private updateUnitTime(unit: Unit) {
        if (this.shownUnits.has(unit.getId() as string)) {
            const marker = this.shownUnits.get(unit.getId() as string);
            const status_time_labels = marker?._element.getElementsByClassName('unit-status-time-label');
            if (status_time_labels && status_time_labels.length > 0) {
                const status_time_label = status_time_labels[0] as HTMLElement;
                if (unit.getStatusTime()) {
                    const diffSeconds = Math.floor((Date.now() - unit.getStatusTime()!.getTime()) / 1000);
                    if (diffSeconds < 60) {
                        status_time_label.innerText = `${diffSeconds}s ago`;
                        if (this.timeUpdateIntervals.has(unit.getId() as string)) {
                            clearInterval(this.timeUpdateIntervals.get(unit.getId() as string));
                        }
                        const status_int = setInterval(() => {
                            const count = Math.floor((Date.now() - unit.getStatusTime()!.getTime()) / 1000);
                            status_time_label.innerText = `${count}s ago`;
                            if (count >= 60) {
                                this.updateUnitTime(unit);
                            }
                        }, 2 * 1000);
                        this.timeUpdateIntervals.set(unit.getId() as string, status_int);

                    } else if (diffSeconds < 3600) {
                        const minutes = Math.floor(diffSeconds / 60);
                        status_time_label.innerText = `${minutes}m ago`;
                        if (this.timeUpdateIntervals.has(unit.getId() as string)) {
                            clearInterval(this.timeUpdateIntervals.get(unit.getId() as string));
                        }
                        const status_int = setInterval(() => {
                            const count = Math.floor(((Date.now() - unit.getStatusTime()!.getTime()) / 1000) / 60);
                            status_time_label.innerText = `${count}m ago`;
                            if (count >= 60) {
                                this.updateUnitTime(unit);
                            }
                        }, 60 * 1000);
                        this.timeUpdateIntervals.set(unit.getId() as string, status_int);
                    } else if (diffSeconds < 86400) {
                        const hours = Math.floor(diffSeconds / 3600);
                        status_time_label.innerText = `${hours}h ago`;
                    }
                } else {
                    status_time_label.innerText = 'N/A';
                }
            }
        }

    }

    private updateUnit(unit: Unit) {
        if (this.map) {
            ApplicationLogger.debug('Showing updated unit on map:' + unit.getName(), {service: 'SearchControl'});
            if (!this.shownUnits.has(unit.getId() as string)) {
                const markerOptions: MarkerOptions = {};
                this.shownUnits.set(unit.getId() as string, new Marker());
                if (unit.getIconElement()) {
                    const container = document.createElement('div');
                    container.className = 'unit-marker-container';
                    const imgContainer = document.createElement('div');
                    imgContainer.className = 'unit-icon-container';
                    imgContainer.appendChild(unit.getIconElement({width: this.iconSize}) as HTMLElement);
                    container.appendChild(imgContainer);
                    const status_div = document.createElement('div');
                    status_div.className = 'unit-status-indicator';

                    const status_num_div = document.createElement('div');
                    const status_num_label = document.createElement('label');
                    status_num_label.className = 'unit-status-num-label';
                    if (unit.getStatus() && unit.getStatus() != null) {
                        status_num_label.innerText = (unit.getStatus() as number).toString();
                    } else {
                        status_num_label.innerText = '-';
                    }
                    status_num_div.appendChild(status_num_label);
                    status_div.appendChild(status_num_div);

                    const status_time_div = document.createElement('div');
                    const status_time_label = document.createElement('label');
                    status_time_label.className = 'unit-status-time-label';
                    status_time_div.appendChild(status_time_label);
                    status_div.appendChild(status_time_div);
                    container.appendChild(status_div);
                    markerOptions.element = container;

                    container.addEventListener('click', () => {
                        console.log('Clicked unit marker: ' + unit.getName());
                        GlobalEventHandler.getInstance().emit('show-route', new DataEvent('show-route', unit));
                    });
                }
                const marker = new Marker(markerOptions)
                    .setLngLat([unit.getLongitude(), unit.getLatitude()])
                    .addTo(this.map);

                this.shownUnits.set(unit.getId() as string, marker);
                this.updateUnitTime(unit);
            } else {
                const marker = this.shownUnits.get(unit.getId() as string);
                if (marker) {
                    marker.setLngLat([unit.getLongitude(), unit.getLatitude()]);

                    if (unit.getIconElement()) {
                        const iconContainers = marker._element.getElementsByTagName('unit-icon-container');
                        if (iconContainers) {
                            while (iconContainers.length > 1) {
                                iconContainers[1].remove();
                            }
                            if (iconContainers[0]) {
                                const iconContainer = iconContainers[0];
                                iconContainer.innerHTML = '';
                                iconContainer.appendChild(unit.getIconElement({width: this.iconSize}) as HTMLElement);
                            }
                        }
                        const status_num_labels = marker._element.getElementsByClassName('unit-status-num-label');
                        if (status_num_labels && status_num_labels.length > 0) {
                            const status_num_label = status_num_labels[0] as HTMLElement;
                            if (unit.getStatus() && unit.getStatus() != null) {
                                status_num_label.innerText = (unit.getStatus() as number).toString();
                            } else {
                                status_num_label.innerText = '-';
                            }
                        }
                        this.updateUnitTime(unit);
                    }
                }
            }
        }
    };
}
