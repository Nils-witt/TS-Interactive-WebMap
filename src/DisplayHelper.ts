import type {TaktischesZeichen} from "taktische-zeichen-core/dist/types/types";
import {erzeugeTaktischesZeichen} from "taktische-zeichen-core";


export class DisplayHelper {
    public static iconsSize = 70; // Default size for icons

    public static createTacMarker(conf: TaktischesZeichen): HTMLElement {
        let el = document.createElement('div');
        el.className = 'marker';

        let icon = document.createElement('img');

        el.appendChild(icon);
        el.style.width = `${DisplayHelper.iconsSize}px`;
        el.style.height = `${DisplayHelper.iconsSize}px`;

        let tac = erzeugeTaktischesZeichen(conf);
        icon.src = tac.dataUrl;

        return el;
    }

    public static updateTacMarker(el: HTMLElement, conf: TaktischesZeichen): void {
        let icon = el.querySelector('img');
        if (icon) {
            let tac = erzeugeTaktischesZeichen(conf);
            icon.src = tac.dataUrl;
        } else {
            console.warn("No image found in the marker element to update.");
        }
    }
}