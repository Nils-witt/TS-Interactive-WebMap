import {type Map as MapLibreMap, MapMouseEvent, Marker} from "maplibre-gl";
import {DataProvider, DataProviderEventType} from "../dataProviders/DataProvider";
import {ApiProvider} from "../dataProviders/ApiProvider";
import {EditorEditBox} from "./EditorEditBox";
import {NamedGeoReferencedObject} from "../enitities/NamedGeoReferencedObject";
import {icon} from "@fortawesome/fontawesome-svg-core";
import {faMap} from "@fortawesome/free-solid-svg-icons/faMap";
import {faMapPin} from "@fortawesome/free-solid-svg-icons/faMapPin";
import {faPenToSquare} from "@fortawesome/free-solid-svg-icons/faPenToSquare";
import {GlobalEventHandler} from "../dataProviders/GlobalEventHandler";


export class EditorController {
    private controlsContainer: HTMLDivElement;
    private map: MapLibreMap;
    private itemTableBody: HTMLTableSectionElement;


    private selectedGroupId: string | undefined = undefined;

    private mapGroupSelect: HTMLSelectElement = document.createElement('select');

    private editorEditBox: EditorEditBox;

    public constructor(controlsContainer: HTMLDivElement, map: MapLibreMap) {
        this.controlsContainer = controlsContainer;
        this.map = map;

        this.editorEditBox = new EditorEditBox(map);
        this.controlsContainer.append(this.editorEditBox.getContainer());
        this.editorEditBox.setup();

        this.controlsContainer.classList.add('h-100%');

        this.editorEditBox.addEventListener('cancel', () => {
            if (this.internalClickAbortHandler) {
                this.internalClickAbortHandler(); // Abort any previous click handler
                this.internalClickSuccessHandler = undefined;
                this.internalClickAbortHandler = undefined;
            }
        });


        this.setupGroupSelect(this.mapGroupSelect);

        let tableContainer = document.createElement('div');
        let table = document.createElement('table');
        this.setUpTable(table);
        tableContainer.appendChild(table);
        this.controlsContainer.append(tableContainer);
        this.itemTableBody = table.createTBody();
        tableContainer.classList.add('overflow-y-scroll');

        this.controlsContainer.classList.add('flex', 'flex-col');


        map.on('click', this.mapClickHandler);

        GlobalEventHandler.getInstance().on(DataProviderEventType.MAP_ITEM_CREATED, () => {
            this.fullUpdateItemTable();
        });
        GlobalEventHandler.getInstance().on(DataProviderEventType.MAP_ITEM_UPDATED, () => {
            this.fullUpdateItemTable();
        });
        GlobalEventHandler.getInstance().on(DataProviderEventType.MAP_ITEM_DELETED, () => {
            this.fullUpdateItemTable();
        });

        ApiProvider.getInstance().testLogin();

    }

    setupGroupSelect(select: HTMLSelectElement): void {
        select.classList.add('group-select');
        select.onchange = () => {
            this.selectedGroupId = select.value;
            this.fullUpdateItemTable();
        };


        // Populate the select with existing groups
        for (const [id, group] of DataProvider.getInstance().getMapGroups()) {
            let option = document.createElement('option');
            option.value = id;
            option.textContent = group.name || 'Unnamed Group';
            select.appendChild(option);
        }

        // Add a listener to update the select when groups are added
        GlobalEventHandler.getInstance().on(DataProviderEventType.MAP_GROUPS_UPDATED, () => {
            select.replaceChildren(); // Clear existing options
            select.appendChild(document.createElement('option')); // Add empty option
            for (const [id, group] of DataProvider.getInstance().getMapGroups()) {
                let option = document.createElement('option');
                option.value = id;
                option.textContent = group.name || 'Unnamed Group';
                select.appendChild(option);
            }

            this.fullUpdateItemTable();
        });
        GlobalEventHandler.getInstance().on(DataProviderEventType.MAP_GROUPS_CREATED, () => {
            select.replaceChildren(); // Clear existing options
            select.appendChild(document.createElement('option')); // Add empty option
            for (const [id, group] of DataProvider.getInstance().getMapGroups()) {
                let option = document.createElement('option');
                option.value = id;
                option.textContent = group.name || 'Unnamed Group';
                select.appendChild(option);
            }

            this.fullUpdateItemTable();
        });

        let groupLabel = document.createElement('label');
        groupLabel.textContent = 'Select Group:';

        let groupContainer = document.createElement('div');
        groupContainer.appendChild(groupLabel);
        groupContainer.appendChild(select);
        this.controlsContainer.appendChild(groupContainer);
    }

    internalClickSuccessHandler: undefined | ((event: MapMouseEvent) => void) = undefined;
    internalClickAbortHandler: undefined | (() => void) = undefined;

    private mapClickHandler = (event: MapMouseEvent) => {
        if (this.internalClickSuccessHandler) {
            this.internalClickSuccessHandler(event);
        }
    }

    private setUpTable(table: HTMLTableElement): void {
        table.classList.add('w-full', 'table-auto');
        let head = table.createTHead();
        let headerRow = head.insertRow();
        headerRow.insertCell().textContent = 'Name';
        headerRow.insertCell().textContent = 'Group';
    }

    private fullUpdateItemTable(): void {
        this.itemTableBody.replaceChildren(); // Clear existing rows


        let entries = Array.from(DataProvider.getInstance().getMapLocations().values());
        entries.sort((a, b) => {
            if (a.name && b.name) {
                return a.name.localeCompare(b.name);
            }

            return 0;
        });
        for (const item of entries) {

            if (this.selectedGroupId) {
                if (!item.groupId) {
                    continue;
                }
                if (this.selectedGroupId !== item.groupId) {
                    continue;
                }
            }

            let row = this.itemTableBody.insertRow();
            let cellName = row.insertCell();
            let groups = row.insertCell();
            let cellActions = row.insertCell();

            cellName.textContent = item.name || 'Unnamed Item';

            //groups.textContent = item.groups ? item.groups.join(', ') : 'No Groups';

            if (item.groupId && DataProvider.getInstance().getMapGroups().get(item.groupId)) {
                let group = DataProvider.getInstance().getMapGroups().get(item.groupId);
                groups.textContent = group?.name || 'No Group';
            }else {
                groups.textContent = 'No Group';
            }
            // Add action buttons (edit, delete, etc.)
            let locateButton = document.createElement('button');
            let updatePositionButton = document.createElement('button');
            let editIconBtn = document.createElement('button');

            // cellActions.appendChild(locateButton);
            cellActions.appendChild(updatePositionButton);
            cellActions.appendChild(editIconBtn);


            locateButton.onclick = () => {
                this.map.flyTo({
                    center: [item.longitude, item.latitude],
                    zoom: 18,
                    essential: true // This ensures the animation is not interrupted
                });
            };

            updatePositionButton.onclick = () => {
                if (this.internalClickAbortHandler) {
                    this.internalClickAbortHandler(); // Abort any previous click handler
                }

                console.log("Editor: Set position for item", item.id);

                row.style.backgroundColor = "lightblue"; // Highlight the row
                this.internalClickSuccessHandler = (event: MapMouseEvent) => {
                    console.log("Editor: Set position for item", item.id, event.lngLat);
                    item.longitude = event.lngLat.lng;
                    item.latitude = event.lngLat.lat;
                    DataProvider.getInstance().addMapItem(item.id, item);
                    row.style.backgroundColor = ""; // Reset the row background

                    ApiProvider.getInstance().saveMapItem(item);
                    this.internalClickSuccessHandler = undefined
                    this.internalClickAbortHandler = undefined
                }
                this.internalClickAbortHandler = () => {
                    row.style.backgroundColor = ""; // Reset the row background
                    this.internalClickSuccessHandler = undefined
                    this.internalClickAbortHandler = undefined;
                }
            }


            editIconBtn.onclick = () => {
                if (this.internalClickAbortHandler) {
                    this.internalClickAbortHandler(); // Abort any previous click handler
                }
                console.log("Editor: Edit item", item.id);
                row.style.backgroundColor = "lightblue"; // Highlight the row
                this.editorEditBox.setItem(item);
                let marker = new Marker();
                marker.setLngLat([item.longitude, item.latitude]);
                marker.addTo(this.map);

                this.internalClickAbortHandler = () => {
                    row.style.backgroundColor = ""; // Reset the row background
                    marker.remove();
                    this.internalClickSuccessHandler = undefined
                    this.internalClickAbortHandler = undefined;
                }


                this.map.flyTo({
                    center: [item.longitude, item.latitude],
                    zoom: 18,
                    essential: true // This ensures the animation is not interrupted
                });
            };

            editIconBtn.innerHTML = icon(faPenToSquare).html[0];
            locateButton.innerHTML = icon(faMap).html[0];
            updatePositionButton.innerHTML = icon(faMapPin).html[0];

            editIconBtn.classList.add('mx-2', 'hover:cursor-pointer');
            locateButton.classList.add('mx-2', 'hover:cursor-pointer');
            updatePositionButton.classList.add('mx-2', 'hover:cursor-pointer');
        }


    }

    public createNewItem(position: { lng: number, lat: number }): void {
        let item = new NamedGeoReferencedObject({
            id: null,
            name: '',
            longitude: position.lng,
            latitude: position.lat,
            groupId: this.selectedGroupId
        });
        this.editorEditBox.setItem(item, true);

    }
}