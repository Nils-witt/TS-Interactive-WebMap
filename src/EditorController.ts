import {type Map as MapLibreMap, MapMouseEvent} from "maplibre-gl";
import {type DataProvider, DataProviderEventType} from "./dataProviders/DataProvider.ts";
import {ApiProvider, ApiProviderEventTypes} from "./dataProviders/ApiProvider.ts";
import {EditorEditBox} from "./controls/EditorEditBox.ts";
import {NamedGeoReferencedObject} from "./enitites/NamedGeoReferencedObject.ts";


export class EditorController {
    controlsContainer: HTMLDivElement;
    map: MapLibreMap;
    itemTableBody: HTMLTableSectionElement;

    dataProvider: DataProvider;

    private selectedGroupId: string | undefined = undefined;

    private mapGroupSelect: HTMLSelectElement = document.createElement('select');

    private editorEditBox: EditorEditBox;

    public constructor(controlsContainer: HTMLDivElement, map: MapLibreMap, dataProvider: DataProvider) {
        this.controlsContainer = controlsContainer;
        this.map = map;
        this.dataProvider = dataProvider;

        this.editorEditBox = new EditorEditBox(dataProvider);
        this.controlsContainer.append(this.editorEditBox.getContainer());
        this.editorEditBox.setup();

        this.controlsContainer.classList.add('h-100%');

        this.setupGroupSelect(this.mapGroupSelect, dataProvider);

        let tableContainer = document.createElement('div');
        let table = document.createElement('table');
        this.setUpTable(table);
        tableContainer.appendChild(table);
        this.controlsContainer.append(tableContainer);
        this.itemTableBody = table.createTBody();
        tableContainer.classList.add('overflow-y-scroll');


        this.controlsContainer.classList.add('flex', 'flex-col');


        map.on('click', this.mapClickHandler);

        dataProvider.on(DataProviderEventType.MAP_LOCATIONS_UPDATED, () => {
            this.fullUpdateItemTable();
        });

        ApiProvider.getInstance().on(ApiProviderEventTypes.UNAUTHORIZED, () => {
            this.updateCredentials();
        });
        ApiProvider.getInstance().testLogin();

    }

    setupGroupSelect(select: HTMLSelectElement, dataProvider: DataProvider): void {
        select.classList.add('group-select');
        select.onchange = () => {
            this.selectedGroupId = select.value;
            this.fullUpdateItemTable();
        };


        // Populate the select with existing groups
        for (const [id, group] of dataProvider.getMapGroups()) {
            let option = document.createElement('option');
            option.value = id;
            option.textContent = group.name || 'Unnamed Group';
            select.appendChild(option);
        }

        // Add a listener to update the select when groups are added
        dataProvider.on(DataProviderEventType.MAP_GROUPS_UPDATED, () => {
            select.replaceChildren(); // Clear existing options
            select.appendChild(document.createElement('option')); // Add empty option
            for (const [id, group] of dataProvider.getMapGroups()) {
                let option = document.createElement('option');
                option.value = id;
                option.textContent = group.name || 'Unnamed Group';
                select.appendChild(option);
            }

            this.fullUpdateItemTable();
        });

        this.controlsContainer.appendChild(select);
    }

    internalClickSuccessHandler: undefined | ((event: MapMouseEvent) => void) = undefined;
    internalClickAbortHandler: undefined | (() => void) = undefined;

    private mapClickHandler = (event: MapMouseEvent) => {
        if (this.internalClickSuccessHandler) {
            this.internalClickSuccessHandler(event);
        }
    }

    private setUpTable(table: HTMLTableElement): void {
        table.classList.add('item-table'); // Add a class for styling
        let head = table.createTHead();
        let headerRow = head.insertRow();
        headerRow.insertCell().textContent = 'Name';
        headerRow.insertCell().textContent = 'Groups';
    }

    private fullUpdateItemTable(): void {
        this.itemTableBody.replaceChildren(); // Clear existing rows


        let entries = Array.from(this.dataProvider.getMapLocations().values());
        entries.sort((a, b) => {
            if (a.name && b.name) {
                return a.name.localeCompare(b.name);
            }

            return 0; // both are undefined or empty, keep original order
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
            groups.textContent = 'N/A';
            // Add action buttons (edit, delete, etc.)
            let locateButton = document.createElement('button');
            locateButton.textContent = 'Locate';
            locateButton.onclick = () => {
                this.map.flyTo({
                    center: [item.longitude, item.latitude],
                    zoom: 18,
                    essential: true // This ensures the animation is not interrupted
                })
            };
            cellActions.appendChild(locateButton);

            let updatePositionButton = document.createElement('button');
            updatePositionButton.textContent = 'Set Position';
            updatePositionButton.onclick = () => {
                if (this.internalClickAbortHandler) {
                    this.internalClickAbortHandler(); // Abort any previous click handler
                }

                row.style.backgroundColor = "lightblue"; // Highlight the row
                this.internalClickSuccessHandler = (event: MapMouseEvent) => {
                    console.log("Editor: Set position for item", item.id, event.lngLat);
                    item.longitude = event.lngLat.lng;
                    item.latitude = event.lngLat.lat;
                    this.dataProvider.addMapLocation(item.id, item);
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
            cellActions.appendChild(updatePositionButton);

            let editIconBtn = document.createElement('button');
            editIconBtn.textContent = 'Edit';
            editIconBtn.onclick = () => {
                this.editorEditBox.setItem(item);
            };
            cellActions.appendChild(editIconBtn);
        }
    }

    private updateCredentials(): void {
        let container = document.createElement('div');
        container.classList.add('login-container');

        container.classList.add('absolute', 'top-0', 'left-0', 'w-full', 'h-full', 'items-center', 'justify-center', 'bg-white', 'z-1001');

        document.body.appendChild(container);
        let label = document.createElement('label');
        label.textContent = 'Username:';
        let input = document.createElement('input');
        input.type = 'text';

        let labelPassword = document.createElement('label');
        labelPassword.textContent = 'Password:';
        let inputPassword = document.createElement('input');
        inputPassword.type = 'password';
        let button = document.createElement('button');
        button.textContent = 'Login';
        button.onclick = async () => {
            let username = input.value;
            let password = inputPassword.value;
            button.disabled = true; // Disable the button to prevent multiple clicks
            try {
                await ApiProvider.getInstance().login(username, password);
            } catch (error) {
                console.error("Login failed:", error);
                alert("Login failed. Please check your credentials.");
            }
        };
        container.appendChild(label);
        container.appendChild(input);

        container.appendChild(labelPassword);
        container.appendChild(inputPassword);

        container.appendChild(button);

        ApiProvider.getInstance().on(ApiProviderEventTypes.LOGIN_SUCCESS, () => {
            console.log("Login successful, updating item table");
            container.remove(); // Remove the login form after successful login
        });
        ApiProvider.getInstance().on(ApiProviderEventTypes.LOGIN_FAILURE, () => {
            button.disabled = false; // Re-enable the button on failure
        });
    }


    public createNewItem(position: {lng: number, lat: number}): void {
        let item = new NamedGeoReferencedObject({
            id: null,
            name: '',
            longitude: position.lng,
            latitude: position.lat,
            groupId: this.selectedGroupId
        });
        this.editorEditBox.setItem(item,true);

    }
}