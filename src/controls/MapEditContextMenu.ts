import {EditorController} from "../EditorController.ts";
import {Map as MapLibreMap, MapMouseEvent} from "maplibre-gl";

export type MapEditContextMenuOptions = {
    /**
     * The map instance to which the context menu will be attached.
     */
    map: MapLibreMap;
    editor: EditorController;

}

export class MapEditContextMenu {

    private map: MapLibreMap;
    private editor: EditorController;
    private contextMenu: HTMLDivElement = document.createElement('div');
    private event: MapMouseEvent | undefined;

    constructor(options: MapEditContextMenuOptions) {

        this.map = options.map;
        this.editor = options.editor;

        this.map.on('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(e);
        });
        this.setupContextMenu();
    }

    showContextMenu(event: MapMouseEvent): void {
        console.log("Context menu event:", event.lngLat, event.point);

        this.contextMenu.style.top = `${event.originalEvent.clientY}px`;
        this.contextMenu.style.left = `${event.originalEvent.clientX}px`;
        this.contextMenu.style.visibility = 'visible'; // Show the context menu
        this.event = event; // Store the event for later use
    }

    private setupContextMenu(): void {
        this.contextMenu.classList.add('map-edit-context-menu');
        document.body.appendChild(this.contextMenu);


        let btnCreate = document.createElement('button');
        btnCreate.innerText = 'Create Item';
        btnCreate.onclick = () => {
            this.editor.createNewItem(this.event!.lngLat);
            this.contextMenu.style.visibility = 'hidden'; // Hide the context menu after action
        };
        this.contextMenu.appendChild(btnCreate);

    }
}