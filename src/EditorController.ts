import {type Map as MapLibreMap, MapMouseEvent} from "maplibre-gl";
import {type DataProvider, DataProviderEventType} from "./dataProviders/DataProvider.ts";
import {ApiProvider, ApiProviderEventTypes} from "./dataProviders/ApiProvider.ts";


export class EditorController {
    controlsContainer: HTMLDivElement;
    map: MapLibreMap;
    itemTableBody: HTMLTableSectionElement;

    dataProvider: DataProvider;

    public constructor(controlsContainer: HTMLDivElement, map: MapLibreMap, dataProvider: DataProvider) {
        this.controlsContainer = controlsContainer;
        this.map = map;
        this.dataProvider = dataProvider;

        let table = document.createElement('table');
        this.setUpTable(table);
        this.controlsContainer.append(table);
        this.itemTableBody = table.createTBody();

        map.on('click', this.mapClickHandler);

        dataProvider.on(DataProviderEventType.MAP_LOCATIONS_UPDATED, () => {
            this.fullUpdateItemTable();
        });
        ApiProvider.getInstance().on(ApiProviderEventTypes.UNAUTHORIZED, () => {
            this.updateCredentials();
        })
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

        for (const item of this.dataProvider.getMapLocations().values()) {
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
        }
    }

    private updateCredentials(): void {
        let container = document.createElement('div');
        container.classList.add('login-container');
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
}