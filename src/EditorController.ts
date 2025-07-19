import {type Map as MapLibreMap, MapMouseEvent} from "maplibre-gl";
import {type DataProvider, DataProviderEventType} from "./dataProviders/DataProvider.ts";
import {ApiProvider, ApiProviderEventTypes} from "./dataProviders/ApiProvider.ts";
import {
    einheiten,
    type EinheitId,
    erzeugeTaktischesZeichen,
    type FachaufgabeId,
    fachaufgaben,
    funktionen,
    type FunktionId,
    grundzeichen,
    organisationen,
    type OrganisationId,
    symbole,
    type SymbolId,
    type VerwaltungsstufeId
} from "taktische-zeichen-core";
import type {GrundzeichenId} from "taktische-zeichen-core/src/grundzeichen.ts";
import {verwaltungsstufen} from "taktische-zeichen-core/src/verwaltungsstufen.ts";


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

            let editIconBtn = document.createElement('button');
            editIconBtn.textContent = 'Edit Icon';
            editIconBtn.onclick = () => {
                this.editItemIcon(item.id); // Placeholder for edit icon functionality
            };
            cellActions.appendChild(editIconBtn);
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

    private editItemIcon(id: string): void {
        const item = this.dataProvider.getMapLocations().get(id);
        if (!item) {
            console.error("Item not found for ID:", id);
            return;
        }
        if (!item.symbol) {
            console.error("Item does not have a symbol for ID:", id);
            return;
        }
        console.log("Editor: Edit icon for item", id);
        let div = document.createElement('div');
        div.classList.add('icon-editor-container');
        let label = document.createElement('label');
        label.textContent = 'Selected Icon: ' + id;
        div.appendChild(label);

        let iconDisplay = document.createElement('img');
        iconDisplay.src = erzeugeTaktischesZeichen(item.symbol!).dataUrl
        iconDisplay.style.height = '50px';
        div.appendChild(iconDisplay);


        let selectGrundzeichenLabel = document.createElement('label');
        selectGrundzeichenLabel.textContent = 'Grundzeichen:';
        let selectGrundzeichen = document.createElement('select');
        selectGrundzeichen.options.add(new Option("Keine", ""));

        for (const value of grundzeichen) {
            selectGrundzeichen.options.add(new Option(value.label, value.id));
            if (item.symbol!.grundzeichen === value.id) {
                selectGrundzeichen.value = value.id; // Set the selected value based on the item's symbol
            }
        }
        let grundzeichenDiv = document.createElement('div');
        grundzeichenDiv.appendChild(selectGrundzeichenLabel);
        grundzeichenDiv.appendChild(selectGrundzeichen);
        div.appendChild(grundzeichenDiv);

        let selectVerwaltungsstufeLabel = document.createElement('label');
        selectVerwaltungsstufeLabel.textContent = 'Verwaltungsstufe:';
        let selectVerwaltungsstufe = document.createElement('select');
        selectVerwaltungsstufe.options.add(new Option("Keine", ""));

        for (const value of verwaltungsstufen) {
            selectVerwaltungsstufe.options.add(new Option(value.label, value.id));
            if (item.symbol!.verwaltungsstufe === value.id) {
                selectVerwaltungsstufe.value = value.id; // Set the selected value based on the item's symbol
            }
        }
        let verwaltungsstufeDiv = document.createElement('div');
        verwaltungsstufeDiv.appendChild(selectVerwaltungsstufeLabel);
        verwaltungsstufeDiv.appendChild(selectVerwaltungsstufe);
        div.appendChild(verwaltungsstufeDiv);

        let selectOrganisationLabel = document.createElement('label');
        selectOrganisationLabel.textContent = 'Organisation:';
        let selectOrganisation = document.createElement('select');
        selectOrganisation.options.add(new Option("Keine", ""));

        for (const value of organisationen) {
            selectOrganisation.options.add(new Option(value.label, value.id));
            if (item.symbol!.organisation === value.id) {
                selectOrganisation.value = value.id; // Set the selected value based on the item's symbol
            }
        }
        let selectOrganisationDiv = document.createElement('div');
        selectOrganisationDiv.appendChild(selectOrganisationLabel);
        selectOrganisationDiv.appendChild(selectOrganisation);
        div.appendChild(selectOrganisationDiv);

        let selectFachaufgabeLabel = document.createElement('label');
        selectFachaufgabeLabel.textContent = 'Fachaufgabe:';
        let selectFachaufgabe = document.createElement('select');
        selectFachaufgabe.options.add(new Option("Keine", ""));

        for (const value of fachaufgaben) {
            selectFachaufgabe.options.add(new Option(value.label, value.id));
            if (item.symbol!.fachaufgabe === value.id) {
                selectFachaufgabe.value = value.id; // Set the selected value based on the item's symbol
            }
        }
        let divFachaufgabe = document.createElement('div');
        divFachaufgabe.appendChild(selectFachaufgabeLabel);
        divFachaufgabe.appendChild(selectFachaufgabe);
        div.appendChild(divFachaufgabe);

        let selectEinheitLabel = document.createElement('label');
        selectEinheitLabel.textContent = 'Einheit:';
        let selectEinheit = document.createElement('select');
        selectEinheit.options.add(new Option("Keine", ""));

        for (const value of einheiten) {
            selectEinheit.options.add(new Option(value.label, value.id));
            if (item.symbol!.einheit === value.id) {
                selectEinheit.value = value.id; // Set the selected value based on the item's symbol
            }
        }
        let divEinheit = document.createElement('div');
        divEinheit.appendChild(selectEinheitLabel);
        divEinheit.appendChild(selectEinheit);
        div.appendChild(divEinheit);

        let selectFunktionLabel = document.createElement('label');
        selectFunktionLabel.textContent = 'Funktion:';
        let selectFunktion = document.createElement('select');
        selectFunktion.options.add(new Option("Keine", ""));

        for (const value of funktionen) {
            selectFunktion.options.add(new Option(value.label, value.id));
            if (item.symbol!.funktion === value.id) {
                selectFunktion.value = value.id; // Set the selected value based on the item's symbol
            }
        }
        let divFunktion = document.createElement('div');
        divFunktion.appendChild(selectFunktionLabel);
        divFunktion.appendChild(selectFunktion);
        div.appendChild(divFunktion);

        let selectSymbolLabel = document.createElement('label');
        selectSymbolLabel.textContent = 'Symbol:';
        let selectSymbol = document.createElement('select');
        selectSymbol.options.add(new Option("Keine", ""));
        for (const value of symbole) {
            selectSymbol.options.add(new Option(value.label, value.id));
            if (item.symbol!.symbol === value.id) {
                selectSymbol.value = value.id; // Set the selected value based on the item's symbol
            }
        }
        let divSymbol = document.createElement('div');
        divSymbol.appendChild(selectSymbolLabel);
        divSymbol.appendChild(selectSymbol);
        div.appendChild(divSymbol);

        let selectTextLabel = document.createElement('label');
        selectTextLabel.textContent = 'Text:';
        let selectText = document.createElement('input');
        selectText.type = 'text';
        selectText.value = item.symbol.text || '';
        let divText = document.createElement('div');
        divText.appendChild(selectTextLabel);
        divText.appendChild(selectText);
        div.appendChild(divText);

        let selectTypLabel = document.createElement('label');
        selectTypLabel.textContent = 'Type:';
        let selectTyp = document.createElement('input');
        selectTyp.type = 'text';
        selectTyp.value = item.symbol.typ || '';
        let divTyp = document.createElement('div');
        divTyp.appendChild(selectTypLabel);
        divTyp.appendChild(selectTyp);
        div.appendChild(divTyp);

        let selectNameLabel = document.createElement('label');
        selectNameLabel.textContent = 'Name:';
        let selectName = document.createElement('input');
        selectName.type = 'text';
        selectName.value = item.symbol.name || '';
        let divName = document.createElement('div');
        divName.appendChild(selectNameLabel);
        divName.appendChild(selectName);
        div.appendChild(divName);


        let selectOrgNameLabel = document.createElement('label');
        selectOrgNameLabel.textContent = 'Organisation Name:';
        let selectOrgName = document.createElement('input');
        selectOrgName.type = 'text';
        selectOrgName.value = item.symbol.organisationName || '';
        let divOrgName = document.createElement('div');
        divOrgName.appendChild(selectOrgNameLabel);
        divOrgName.appendChild(selectOrgName);
        div.appendChild(divOrgName);

        const updateIconDisplay = () => {
            iconDisplay.src = erzeugeTaktischesZeichen({
                ...item.symbol,
                grundzeichen: selectGrundzeichen.value as GrundzeichenId,
                verwaltungsstufe: selectVerwaltungsstufe.value as VerwaltungsstufeId,
                organisation: selectOrganisation.value as OrganisationId,
                fachaufgabe: selectFachaufgabe.value as FachaufgabeId,
                einheit: selectEinheit.value as EinheitId,
                funktion: selectFunktion.value as FunktionId,
                symbol: selectSymbol.value as SymbolId,
                text: selectText.value,
                typ: selectTyp.value,
                name: selectName.value,
                organisationName: selectOrgName.value,
            }).dataUrl;
        }

        selectGrundzeichen.onchange = updateIconDisplay;
        selectVerwaltungsstufe.onchange = updateIconDisplay;
        selectOrganisation.onchange = updateIconDisplay;
        selectFachaufgabe.onchange = updateIconDisplay;
        selectEinheit.onchange = updateIconDisplay;
        selectFunktion.onchange = updateIconDisplay;
        selectSymbol.onchange = updateIconDisplay;

        let saveButton = document.createElement('button');
        saveButton.textContent = 'Save Icon';
        div.appendChild(saveButton);
        saveButton.onclick = () => {
            if (!item.symbol) {
                console.error("Item does not have a symbol for ID:", id);
                return;
            }

            item.symbol = {
                ...item.symbol,
                grundzeichen: selectGrundzeichen.value as GrundzeichenId,
                verwaltungsstufe: selectVerwaltungsstufe.value as VerwaltungsstufeId,
                organisation: selectOrganisation.value as OrganisationId,
                fachaufgabe: selectFachaufgabe.value as FachaufgabeId,
                einheit: selectEinheit.value as EinheitId,
                funktion: selectFunktion.value as FunktionId,
                symbol: selectSymbol.value as SymbolId,
                text: selectText.value,
                typ: selectTyp.value,
                name: selectName.value,
                organisationName: selectOrgName.value,
            }
            this.dataProvider.addMapLocation(id, item);
            console.log("Editor: Save icon for item", id, item.symbol);
            div.remove();
        };
        document.body.appendChild(div);
    }
}