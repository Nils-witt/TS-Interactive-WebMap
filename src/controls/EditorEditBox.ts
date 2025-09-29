import {NamedGeoReferencedObject} from "../enitities/NamedGeoReferencedObject";
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
import {verwaltungsstufen} from "taktische-zeichen-core/src/verwaltungsstufen";
import type {GrundzeichenId} from "taktische-zeichen-core/src/grundzeichen";
import {DataProvider, DataProviderEvent, DataProviderEventType} from "../dataProviders/DataProvider";
import {ApiProvider} from "../dataProviders/ApiProvider";
import {NotificationController} from "./NotificationController";
import {Map as MapLibreMap} from "maplibre-gl";
import {GlobalEventHandler} from "../dataProviders/GlobalEventHandler";
import {IMapGroup} from "../types/MapEntity";


export class EditorEditBox {

    private container = document.createElement('div');

    private item: NamedGeoReferencedObject | undefined = undefined;
    selectGrundzeichen = document.createElement('select');
    selectVerwaltungsstufe = document.createElement('select');
    selectOrganisation = document.createElement('select');
    selectFachaufgabe = document.createElement('select');
    selectEinheit = document.createElement('select')
    selectFunktion = document.createElement('select');
    selectSymbol = document.createElement('select');
    selectText = document.createElement('input');
    selectName = document.createElement('input');
    selectTyp = document.createElement('input');
    selectOrgName = document.createElement('input');
    iconDisplay = document.createElement('img');

    symbolEditDiv = document.createElement('div');

    itemNameInput = document.createElement('input');
    headerLabel = document.createElement('h4');
    cancelButton = document.createElement('button');
    saveButton = document.createElement('button');
    deleteButton = document.createElement('button');
    createButton = document.createElement('button');
    groupSelect = document.createElement('select');

    private listeners: Map<string, ((event: string) => void)[]> = new Map();

    private map: MapLibreMap;

    constructor(map: MapLibreMap) {
        this.map = map;
        GlobalEventHandler.getInstance().on(DataProviderEventType.MAP_GROUPS_CREATED, (e) => {
            const event = e as DataProviderEvent;
            const group = event.data as IMapGroup;
            const option = document.createElement('option');
            option.value = group.id;
            option.textContent = group.name;
            this.groupSelect.appendChild(option);
        });

        this.groupSelect.replaceChildren()
        this.groupSelect.appendChild(new Option('Select Group', ''));
        DataProvider.getInstance().getMapGroups().forEach((group, id) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = group.name || 'Unnamed Group';
            this.groupSelect.appendChild(option);
        });

    }

    getContainer(): HTMLDivElement {
        return this.container;
    }

    setup() {
        this.setupBox()
    }

    private setupBox() {


        this.headerLabel.textContent = '-/-';
        this.container.appendChild(this.headerLabel);

        const itemNameLabel = document.createElement('label');
        itemNameLabel.textContent = 'Item Name:';
        this.itemNameInput.type = 'text';
        this.itemNameInput.placeholder = 'Enter item name';
        this.itemNameInput.onchange = () => {
            if (this.item) {
                this.item.setName(this.itemNameInput.value);
            }
        };
        const itemNameDiv = document.createElement('div');
        itemNameDiv.appendChild(itemNameLabel);
        itemNameDiv.appendChild(this.itemNameInput);
        this.container.appendChild(itemNameDiv)

        const groupSelectDiv = document.createElement('div');

        const groupSelectLabel = document.createElement('label');
        groupSelectLabel.textContent = 'Group:';
        groupSelectDiv.appendChild(groupSelectLabel);
        groupSelectDiv.appendChild(this.groupSelect);
        this.container.appendChild(groupSelectDiv);

        this.groupSelect.onchange = () => {
            if (this.item) {
                if (this.groupSelect.value === '') {
                    this.item.setGroupId(undefined);
                } else {
                    this.item.setGroupId(this.groupSelect.value);
                }
            }
        }


        this.iconDisplay.style.height = '50px';

        const selectGrundzeichenLabel = document.createElement('label');
        selectGrundzeichenLabel.textContent = 'Grundzeichen:';
        this.selectGrundzeichen.options.add(new Option("Keine", ""));

        for (const value of grundzeichen) {
            this.selectGrundzeichen.options.add(new Option(value.label, value.id));
        }
        const grundzeichenDiv = document.createElement('div');
        grundzeichenDiv.appendChild(selectGrundzeichenLabel);
        grundzeichenDiv.appendChild(this.selectGrundzeichen);

        const selectVerwaltungsstufeLabel = document.createElement('label');
        selectVerwaltungsstufeLabel.textContent = 'Verwaltungsstufe:';

        this.selectVerwaltungsstufe.options.add(new Option("Keine", ""));

        for (const value of verwaltungsstufen) {
            this.selectVerwaltungsstufe.options.add(new Option(value.label, value.id));
        }
        const verwaltungsstufeDiv = document.createElement('div');
        verwaltungsstufeDiv.appendChild(selectVerwaltungsstufeLabel);
        verwaltungsstufeDiv.appendChild(this.selectVerwaltungsstufe);

        const selectOrganisationLabel = document.createElement('label');
        selectOrganisationLabel.textContent = 'Organisation:';

        this.selectOrganisation.options.add(new Option("Keine", ""));

        for (const value of organisationen) {
            this.selectOrganisation.options.add(new Option(value.label, value.id));
        }
        const selectOrganisationDiv = document.createElement('div');
        selectOrganisationDiv.appendChild(selectOrganisationLabel);
        selectOrganisationDiv.appendChild(this.selectOrganisation);

        const selectFachaufgabeLabel = document.createElement('label');
        selectFachaufgabeLabel.textContent = 'Fachaufgabe:';

        this.selectFachaufgabe.options.add(new Option("Keine", ""));

        for (const value of fachaufgaben) {
            this.selectFachaufgabe.options.add(new Option(value.label, value.id));
        }

        const divFachaufgabe = document.createElement('div');
        divFachaufgabe.appendChild(selectFachaufgabeLabel);
        divFachaufgabe.appendChild(this.selectFachaufgabe);

        const selectEinheitLabel = document.createElement('label');
        selectEinheitLabel.textContent = 'Einheit:';

        this.selectEinheit.options.add(new Option("Keine", ""));

        for (const value of einheiten) {
            this.selectEinheit.options.add(new Option(value.label, value.id));
        }
        const divEinheit = document.createElement('div');
        divEinheit.appendChild(selectEinheitLabel);
        divEinheit.appendChild(this.selectEinheit);

        const selectFunktionLabel = document.createElement('label');
        selectFunktionLabel.textContent = 'Funktion:';

        this.selectFunktion.options.add(new Option("Keine", ""));

        for (const value of funktionen) {
            this.selectFunktion.options.add(new Option(value.label, value.id));
        }
        const divFunktion = document.createElement('div');
        divFunktion.appendChild(selectFunktionLabel);
        divFunktion.appendChild(this.selectFunktion);

        const selectSymbolLabel = document.createElement('label');
        selectSymbolLabel.textContent = 'Symbol:';

        this.selectSymbol.options.add(new Option("Keine", ""));
        for (const value of symbole) {
            this.selectSymbol.options.add(new Option(value.label, value.id));
        }
        const divSymbol = document.createElement('div');
        divSymbol.appendChild(selectSymbolLabel);
        divSymbol.appendChild(this.selectSymbol);

        const selectTextLabel = document.createElement('label');
        selectTextLabel.textContent = 'Text:';

        this.selectText.type = 'text';
        const divText = document.createElement('div');
        divText.appendChild(selectTextLabel);
        divText.appendChild(this.selectText);

        const selectTypLabel = document.createElement('label');
        selectTypLabel.textContent = 'Type:';

        this.selectTyp.type = 'text';
        const divTyp = document.createElement('div');
        divTyp.appendChild(selectTypLabel);
        divTyp.appendChild(this.selectTyp);

        const selectNameLabel = document.createElement('label');
        selectNameLabel.textContent = 'Name:';

        this.selectName.type = 'text';
        const divName = document.createElement('div');
        divName.appendChild(selectNameLabel);
        divName.appendChild(this.selectName);


        const selectOrgNameLabel = document.createElement('label');
        selectOrgNameLabel.textContent = 'Organisation Name:';

        this.selectOrgName.type = 'text';
        const divOrgName = document.createElement('div');
        divOrgName.appendChild(selectOrgNameLabel);
        divOrgName.appendChild(this.selectOrgName);

        this.selectGrundzeichen.onchange = () => {
            this.item.getSymbol().grundzeichen = this.selectGrundzeichen.value as GrundzeichenId;
            this.updateIconDisplay();
        };
        this.selectVerwaltungsstufe.onchange = () => {
            this.item.getSymbol().verwaltungsstufe = this.selectVerwaltungsstufe.value as VerwaltungsstufeId;
            this.updateIconDisplay();
        }
        this.selectOrganisation.onchange = () => {
            this.item.getSymbol().organisation = this.selectOrganisation.value as OrganisationId;
            this.updateIconDisplay();
        }
        this.selectFachaufgabe.onchange = () => {
            this.item.getSymbol().fachaufgabe = this.selectFachaufgabe.value as FachaufgabeId;
            this.updateIconDisplay();
        }
        this.selectEinheit.onchange = () => {
            this.item.getSymbol().einheit = this.selectEinheit.value as EinheitId;
            this.updateIconDisplay();
        }
        this.selectFunktion.onchange = () => {
            this.item.getSymbol().funktion = this.selectFunktion.value as FunktionId;
            this.updateIconDisplay();
        }
        this.selectSymbol.onchange = () => {
            this.item.getSymbol().symbol = this.selectSymbol.value as SymbolId;
            this.updateIconDisplay();
        }


        this.container.appendChild(this.symbolEditDiv);

        this.symbolEditDiv.classList.add('symbol-edit-box');
        this.symbolEditDiv.appendChild(this.iconDisplay);
        this.symbolEditDiv.appendChild(grundzeichenDiv);
        this.symbolEditDiv.appendChild(selectOrganisationDiv);
        this.symbolEditDiv.appendChild(verwaltungsstufeDiv);
        this.symbolEditDiv.appendChild(divFachaufgabe);
        this.symbolEditDiv.appendChild(divEinheit);
        this.symbolEditDiv.appendChild(divFunktion);
        this.symbolEditDiv.appendChild(divSymbol);
        this.symbolEditDiv.appendChild(divText);
        this.symbolEditDiv.appendChild(divTyp);
        this.symbolEditDiv.appendChild(divName);
        this.symbolEditDiv.appendChild(divOrgName);


        this.selectText.onchange = () => {
            this.item.getSymbol().text = this.selectText.value;
            this.updateIconDisplay();
        }
        this.selectTyp.onchange = () => {
            this.item.getSymbol().typ = this.selectTyp.value;
            this.updateIconDisplay();
        }
        this.selectName.onchange = () => {
            this.item.getSymbol().name = this.selectName.value;
            this.updateIconDisplay();
        }
        this.selectOrgName.onchange = () => {
            this.item.getSymbol().organisationName = this.selectOrgName.value;
            this.updateIconDisplay();
        }

        this.createButton.textContent = 'Clear & Create new';
        this.createButton.onclick = () => {

            const newItem = new NamedGeoReferencedObject({
                id: null,
                latitude: this.map.getCenter().lat,
                longitude: this.map.getCenter().lng,
                name: ''
            });
            this.setItem(newItem, true);
        }
        this.container.appendChild(this.createButton);

        this.saveButton.textContent = 'Save';
        this.saveButton.onclick = () => {
            ApiProvider.getInstance().saveMapItem(this.item).then((item) => {
                console.log("Item saved:", item);
                NotificationController.getInstance().showNotification("Saved Item: " + item.getId() + "")
            });
        }
        this.container.appendChild(this.saveButton);

        this.cancelButton.textContent = 'Cancel';
        this.cancelButton.onclick = () => {
            this.setItem(null); // Clear the item
            this.notifyListeners('cancel'); // Notify listeners about the cancel action
        }
        this.container.appendChild(this.cancelButton);

        this.deleteButton = document.createElement('button');
        this.deleteButton.textContent = 'Delete';
        this.deleteButton.onclick = () => {
            ApiProvider.getInstance().deleteMapItem(this.item?.getId()).then(() => {
                console.log("Item deleted:", this.item?.getId());
                DataProvider.getInstance().deleteMapLocation(this.item?.getId());
            });
        }
        this.container.appendChild(this.deleteButton);


        this.container.classList.add('p-4')

        this.createButton.classList.add('bg-white', 'hover:bg-gray-400', 'text-black', 'font-bold', 'py-2', 'px-4', 'border', 'border-black', 'rounded', 'm-2');
        this.deleteButton.classList.add('bg-white', 'hover:bg-gray-400', 'text-black', 'font-bold', 'py-2', 'px-4', 'border', 'border-black', 'rounded', 'm-2');
        this.saveButton.classList.add('bg-white', 'hover:bg-gray-400', 'text-black', 'font-bold', 'py-2', 'px-4', 'border', 'border-black', 'rounded', 'm-2');
        this.cancelButton.classList.add('bg-white', 'hover:bg-gray-400', 'text-black', 'font-bold', 'py-2', 'px-4', 'border', 'border-black', 'rounded', 'm-2');

        this.controlsEnabled(false); // Initially disable controls until an item is set
        this.enableImageControls(false);
    }

    private controlsEnabled(isEnabled: boolean) {
        this.saveButton.disabled = !isEnabled;
        this.itemNameInput.disabled = !isEnabled;
        this.cancelButton.disabled = !isEnabled;
        this.groupSelect.disabled = !isEnabled;
    }

    private enableImageControls(isEnabled: boolean) {
        if (isEnabled) {
            this.symbolEditDiv.style.visibility = 'visible';
        } else {
            this.symbolEditDiv.style.visibility = 'hidden';
        }
        this.selectGrundzeichen.disabled = !isEnabled;
        this.selectOrganisation.disabled = !isEnabled;
        this.selectVerwaltungsstufe.disabled = !isEnabled;
        this.selectFachaufgabe.disabled = !isEnabled;
        this.selectEinheit.disabled = !isEnabled;
        this.selectFunktion.disabled = !isEnabled;
        this.selectSymbol.disabled = !isEnabled;
        this.selectText.disabled = !isEnabled;
        this.selectTyp.disabled = !isEnabled;
        this.selectName.disabled = !isEnabled;
        this.selectOrgName.disabled = !isEnabled;
    }

    private updateIconDisplay() {
        if (this.item.getSymbol()) {
            this.iconDisplay.src = erzeugeTaktischesZeichen(this.item.getSymbol()).dataUrl;
        }
    }

    setItem(item: NamedGeoReferencedObject | null, selectInput: boolean = false) {
        this.item = item;
        if (selectInput) {
            this.itemNameInput.focus();
        }
        this.selectGrundzeichen.value = '';
        this.selectOrganisation.value = '';
        this.selectVerwaltungsstufe.value = '';
        this.selectFachaufgabe.value = '';
        this.selectEinheit.value = '';
        this.selectFunktion.value = '';
        this.selectSymbol.value = '';
        this.selectText.value = '';
        this.selectTyp.value = '';
        this.selectName.value = '';
        this.selectOrgName.value = '';
        this.itemNameInput.value = '';
        this.headerLabel.textContent = '-/-';
        this.iconDisplay.src = '';
        this.enableImageControls(false);
        if (!item) {
            this.controlsEnabled(false);
            return
        }
        this.controlsEnabled(true);
        this.itemNameInput.value = item.getName() || '';
        this.groupSelect.value = item.getGroupId() || '';
        if (item.getSymbol()) {
            this.selectGrundzeichen.value = item.getSymbol().grundzeichen || '';
            this.selectOrganisation.value = item.getSymbol().organisation || '';
            this.selectVerwaltungsstufe.value = item.getSymbol().verwaltungsstufe || '';
            this.selectFachaufgabe.value = item.getSymbol().fachaufgabe || '';
            this.selectEinheit.value = item.getSymbol().einheit || '';
            this.selectFunktion.value = item.getSymbol().funktion || '';
            this.selectSymbol.value = item.getSymbol().symbol || '';
            this.selectText.value = item.getSymbol().text || '';
            this.selectTyp.value = item.getSymbol().typ || '';
            this.selectName.value = item.getSymbol().name || '';
            this.selectOrgName.value = item.getSymbol().organisationName || '';

            this.updateIconDisplay();
            this.enableImageControls(true);
        }

        if (item.getId() === '') {
            this.headerLabel.textContent = "Lege an..";
        } else {
            this.headerLabel.textContent = item.getId();
        }

    }


    addEventListener(event: string, callback: () => void) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)?.push(callback);
    }

    private notifyListeners(event: string) {
        if (this.listeners.has(event)) {
            for (const callback of this.listeners.get(event) || []) {
                callback(event);
            }
        }
    }
}