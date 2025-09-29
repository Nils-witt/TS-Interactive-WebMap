import {EditorController} from "./EditorController";
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
        this.contextMenu.classList.remove('hidden');
        this.event = event;
    }

    private setupContextMenu(): void {
        this.contextMenu.classList.add('absolute', 'hidden');
        document.body.appendChild(this.contextMenu);


        const btnCreate = document.createElement('button');
        btnCreate.innerText = 'Create Item';
        btnCreate.classList.add('bg-white', 'hover:bg-gray-400', 'text-black', 'font-bold', 'py-2', 'px-4');
        btnCreate.onclick = () => {
            this.editor.createNewItem(this.event!.lngLat);
            this.contextMenu.classList.add('hidden');
        };
        this.contextMenu.appendChild(btnCreate);

        document.body.addEventListener('click', (e) => {
            if (!this.contextMenu.contains(e.target as Node)) {
                this.contextMenu.classList.add('hidden');
                this.event = undefined; // Clear the event when clicking outside
            }
        });
    }
}