import {NamedGeoReferencedObject} from "../enitites/NamedGeoReferencedObject.ts";
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
import {verwaltungsstufen} from "taktische-zeichen-core/src/verwaltungsstufen.ts";
import type {GrundzeichenId} from "taktische-zeichen-core/src/grundzeichen.ts";
import {DataProvider, DataProviderEventType} from "../dataProviders/DataProvider.ts";
import {ApiProvider} from "../dataProviders/ApiProvider.ts";


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
    groupSelect = document.createElement('select');

    private listeners: Map<string, ((event: any) => void)[]> = new Map();

    constructor() {

        DataProvider.getInstance().on(DataProviderEventType.MAP_GROUPS_UPDATED, (event) => {
            const group = event.data;
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

        let itemNameLabel = document.createElement('label');
        itemNameLabel.textContent = 'Item Name:';
        this.itemNameInput.type = 'text';
        this.itemNameInput.placeholder = 'Enter item name';
        this.itemNameInput.onchange = () => {
            if (this.item) {
                this.item.name = this.itemNameInput.value;
            }
        };
        let itemNameDiv = document.createElement('div');
        itemNameDiv.appendChild(itemNameLabel);
        itemNameDiv.appendChild(this.itemNameInput);
        this.container.appendChild(itemNameDiv)

        let groupSelectDiv = document.createElement('div');

        let groupSelectLabel = document.createElement('label');
        groupSelectLabel.textContent = 'Group:';
        groupSelectDiv.appendChild(groupSelectLabel);
        groupSelectDiv.appendChild(this.groupSelect);
        this.container.appendChild(groupSelectDiv);

        this.groupSelect.onchange = () => {
            if (this.item) {
                if (this.groupSelect.value === '') {
                    this.item.groupId = undefined;
                } else {
                    this.item.groupId = this.groupSelect.value;
                }
            }
        }


        this.iconDisplay.style.height = '50px';

        let selectGrundzeichenLabel = document.createElement('label');
        selectGrundzeichenLabel.textContent = 'Grundzeichen:';
        this.selectGrundzeichen.options.add(new Option("Keine", ""));

        for (const value of grundzeichen) {
            this.selectGrundzeichen.options.add(new Option(value.label, value.id));
        }
        let grundzeichenDiv = document.createElement('div');
        grundzeichenDiv.appendChild(selectGrundzeichenLabel);
        grundzeichenDiv.appendChild(this.selectGrundzeichen);

        let selectVerwaltungsstufeLabel = document.createElement('label');
        selectVerwaltungsstufeLabel.textContent = 'Verwaltungsstufe:';

        this.selectVerwaltungsstufe.options.add(new Option("Keine", ""));

        for (const value of verwaltungsstufen) {
            this.selectVerwaltungsstufe.options.add(new Option(value.label, value.id));
        }
        let verwaltungsstufeDiv = document.createElement('div');
        verwaltungsstufeDiv.appendChild(selectVerwaltungsstufeLabel);
        verwaltungsstufeDiv.appendChild(this.selectVerwaltungsstufe);

        let selectOrganisationLabel = document.createElement('label');
        selectOrganisationLabel.textContent = 'Organisation:';

        this.selectOrganisation.options.add(new Option("Keine", ""));

        for (const value of organisationen) {
            this.selectOrganisation.options.add(new Option(value.label, value.id));
        }
        let selectOrganisationDiv = document.createElement('div');
        selectOrganisationDiv.appendChild(selectOrganisationLabel);
        selectOrganisationDiv.appendChild(this.selectOrganisation);

        let selectFachaufgabeLabel = document.createElement('label');
        selectFachaufgabeLabel.textContent = 'Fachaufgabe:';

        this.selectFachaufgabe.options.add(new Option("Keine", ""));

        for (const value of fachaufgaben) {
            this.selectFachaufgabe.options.add(new Option(value.label, value.id));
        }

        let divFachaufgabe = document.createElement('div');
        divFachaufgabe.appendChild(selectFachaufgabeLabel);
        divFachaufgabe.appendChild(this.selectFachaufgabe);

        let selectEinheitLabel = document.createElement('label');
        selectEinheitLabel.textContent = 'Einheit:';

        this.selectEinheit.options.add(new Option("Keine", ""));

        for (const value of einheiten) {
            this.selectEinheit.options.add(new Option(value.label, value.id));
        }
        let divEinheit = document.createElement('div');
        divEinheit.appendChild(selectEinheitLabel);
        divEinheit.appendChild(this.selectEinheit);

        let selectFunktionLabel = document.createElement('label');
        selectFunktionLabel.textContent = 'Funktion:';

        this.selectFunktion.options.add(new Option("Keine", ""));

        for (const value of funktionen) {
            this.selectFunktion.options.add(new Option(value.label, value.id));
        }
        let divFunktion = document.createElement('div');
        divFunktion.appendChild(selectFunktionLabel);
        divFunktion.appendChild(this.selectFunktion);

        let selectSymbolLabel = document.createElement('label');
        selectSymbolLabel.textContent = 'Symbol:';

        this.selectSymbol.options.add(new Option("Keine", ""));
        for (const value of symbole) {
            this.selectSymbol.options.add(new Option(value.label, value.id));
        }
        let divSymbol = document.createElement('div');
        divSymbol.appendChild(selectSymbolLabel);
        divSymbol.appendChild(this.selectSymbol);

        let selectTextLabel = document.createElement('label');
        selectTextLabel.textContent = 'Text:';

        this.selectText.type = 'text';
        let divText = document.createElement('div');
        divText.appendChild(selectTextLabel);
        divText.appendChild(this.selectText);

        let selectTypLabel = document.createElement('label');
        selectTypLabel.textContent = 'Type:';

        this.selectTyp.type = 'text';
        let divTyp = document.createElement('div');
        divTyp.appendChild(selectTypLabel);
        divTyp.appendChild(this.selectTyp);

        let selectNameLabel = document.createElement('label');
        selectNameLabel.textContent = 'Name:';

        this.selectName.type = 'text';
        let divName = document.createElement('div');
        divName.appendChild(selectNameLabel);
        divName.appendChild(this.selectName);


        let selectOrgNameLabel = document.createElement('label');
        selectOrgNameLabel.textContent = 'Organisation Name:';

        this.selectOrgName.type = 'text';
        let divOrgName = document.createElement('div');
        divOrgName.appendChild(selectOrgNameLabel);
        divOrgName.appendChild(this.selectOrgName);

        this.selectGrundzeichen.onchange = () => {
            this.item.symbol.grundzeichen = this.selectGrundzeichen.value as GrundzeichenId;
            this.updateIconDisplay();
        };
        this.selectVerwaltungsstufe.onchange = () => {
            this.item.symbol.verwaltungsstufe = this.selectVerwaltungsstufe.value as VerwaltungsstufeId;
            this.updateIconDisplay();
        }
        this.selectOrganisation.onchange = () => {
            this.item.symbol.organisation = this.selectOrganisation.value as OrganisationId;
            this.updateIconDisplay();
        }
        this.selectFachaufgabe.onchange = () => {
            this.item.symbol.fachaufgabe = this.selectFachaufgabe.value as FachaufgabeId;
            this.updateIconDisplay();
        }
        this.selectEinheit.onchange = () => {
            this.item.symbol.einheit = this.selectEinheit.value as EinheitId;
            this.updateIconDisplay();
        }
        this.selectFunktion.onchange = () => {
            this.item.symbol.funktion = this.selectFunktion.value as FunktionId;
            this.updateIconDisplay();
        }
        this.selectSymbol.onchange = () => {
            this.item.symbol.symbol = this.selectSymbol.value as SymbolId;
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
            this.item.symbol.text = this.selectText.value;
            this.updateIconDisplay();
        }
        this.selectTyp.onchange = () => {
            this.item.symbol.typ = this.selectTyp.value;
            this.updateIconDisplay();
        }
        this.selectName.onchange = () => {
            this.item.symbol.name = this.selectName.value;
            this.updateIconDisplay();
        }
        this.selectOrgName.onchange = () => {
            this.item.symbol.organisationName = this.selectOrgName.value;
            this.updateIconDisplay();
        }


        this.saveButton.textContent = 'Save';
        this.saveButton.onclick = () => {
            ApiProvider.getInstance().saveMapItem(this.item).then((item) => {
                console.log("Item saved:", item);
                DataProvider.getInstance().addMapLocation(item.id, item);
            });
        }
        this.container.appendChild(this.saveButton);

        this.cancelButton.textContent = 'Cancel';
        this.cancelButton.onclick = () => {
            this.setItem(null); // Clear the item
            this.notifyListeners('cancel'); // Notify listeners about the cancel action
        }
        this.container.appendChild(this.cancelButton);
        this.container.classList.add('p-4')

        this.saveButton.classList.add('bg-white', 'hover:bg-gray-400', 'text-black', 'font-bold', 'py-2', 'px-4','border','border-black','rounded', 'm-2');
        this.cancelButton.classList.add('bg-white', 'hover:bg-gray-400', 'text-black', 'font-bold', 'py-2', 'px-4','border','border-black','rounded', 'm-2');

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
        if (this.item.symbol) {
            this.iconDisplay.src = erzeugeTaktischesZeichen(this.item.symbol).dataUrl;
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
        this.itemNameInput.value = item.name || '';
        this.groupSelect.value = item.groupId || '';
        if (item.symbol) {
            this.selectGrundzeichen.value = item.symbol.grundzeichen || '';
            this.selectOrganisation.value = item.symbol.organisation || '';
            this.selectVerwaltungsstufe.value = item.symbol.verwaltungsstufe || '';
            this.selectFachaufgabe.value = item.symbol.fachaufgabe || '';
            this.selectEinheit.value = item.symbol.einheit || '';
            this.selectFunktion.value = item.symbol.funktion || '';
            this.selectSymbol.value = item.symbol.symbol || '';
            this.selectText.value = item.symbol.text || '';
            this.selectTyp.value = item.symbol.typ || '';
            this.selectName.value = item.symbol.name || '';
            this.selectOrgName.value = item.symbol.organisationName || '';

            this.updateIconDisplay();
            this.enableImageControls(true);
        }

        if (item.id === '') {
            this.headerLabel.textContent = "Lege an..";
        } else {
            this.headerLabel.textContent = item.id;
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