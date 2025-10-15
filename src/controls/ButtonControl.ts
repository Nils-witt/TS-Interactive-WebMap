import type {ControlPosition, IControl} from "maplibre-gl";
import {DOM} from "maplibre-gl/src/util/dom";
import {faGear} from "@fortawesome/free-solid-svg-icons/faGear";
import {icon} from "@fortawesome/fontawesome-svg-core";
import {useControl} from "@vis.gl/react-maplibre";

type ReactButtonControlProps = {
    position: ControlPosition;
    onClick: () => void;
}
type ButtonControlOptions = {
    onClick: () => void;
}

export function ReactButtonControl(props: ReactButtonControlProps) {
    useControl(() => new ButtonControl(props as ButtonControlOptions), {
        position: props.position
    });

    return null;
}

export class ButtonControl implements IControl {
    private container: HTMLDivElement;
    private options: ButtonControlOptions;

    constructor(options: ButtonControlOptions) {
        this.options = options;
        this.container = DOM.create("div", "maplibregl-ctrl");
        this.container.classList.add(
            "maplibregl-ctrl-group",
            "grid"
        );
        this.container.classList.add("p-[5px]");


        const iconSpan = document.createElement("span");
        iconSpan.innerHTML = icon(faGear, {
            transform: {}
        }).html[0];
        this.container.appendChild(iconSpan)

        this.container.addEventListener("click", () => {
            this.options.onClick();
        })
    }

    onRemove(): void {
        this.container.parentNode?.removeChild(this.container);
    }

    onAdd(): HTMLElement {
        return this.container;
    }

}

export default ReactButtonControl;
