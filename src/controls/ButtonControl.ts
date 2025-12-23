/*
 * ButtonControl.ts
 * -----------------
 * Small wrapper for map control buttons used inside the Map component.
 * Purpose: provide a consistent control interface (position prop) and render icons.
 * Exports: default ReactButtonControl component
 * Notes: integrates with map control layout and accepts onClick handler and FontAwesome icons.
 */

import type {ControlPosition, IControl} from 'maplibre-gl';
import {DOM} from 'maplibre-gl/src/util/dom';
import {faGear} from '@fortawesome/free-solid-svg-icons/faGear';
import {icon} from '@fortawesome/fontawesome-svg-core';
import {useControl} from '@vis.gl/react-maplibre';
import type {IconDefinition} from '@fortawesome/free-brands-svg-icons';

import './css/button.scss';

interface ReactButtonControlProps {
    position: ControlPosition;
    onClick: () => void;
    icon?: IconDefinition;
}

interface ButtonControlOptions {
    onClick: () => void;
    icon?: IconDefinition;
}

export function ReactButtonControl(props: ReactButtonControlProps): null {
    useControl(() => new ButtonControl(props as ButtonControlOptions), {
        position: props.position
    });

    return null;
}

export class ButtonControl implements IControl {
    private container: HTMLDivElement;
    private options: ButtonControlOptions;
    private static fallBackIcon: IconDefinition = faGear;

    constructor(options: ButtonControlOptions) {
        this.options = options;
        this.container = DOM.create('div', 'maplibregl-ctrl');
        this.container.classList.add(
            'maplibregl-ctrl-group',
            'grid'
        );
        this.container.classList.add('buttoncontrol-root');


        const iconDef = this.options.icon || ButtonControl.fallBackIcon;


        const iconSpan = document.createElement('span');
        iconSpan.innerHTML = icon(iconDef, {
            transform: {}
        }).html[0];
        this.container.appendChild(iconSpan);

        this.container.addEventListener('click', () => {
            this.options.onClick();
        });
    }

    onRemove(): void {
        this.container.parentNode?.removeChild(this.container);
    }

    onAdd(): HTMLElement {
        return this.container;
    }

}

export default ReactButtonControl;
