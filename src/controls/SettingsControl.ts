import type {ControlPosition, IControl} from "maplibre-gl";
import {DOM} from "maplibre-gl/src/util/dom";
import {faGear} from "@fortawesome/free-solid-svg-icons/faGear";
import {icon} from "@fortawesome/fontawesome-svg-core";
import {useControl} from "@vis.gl/react-maplibre";
import {ApiProvider} from "../dataProviders/ApiProvider.ts";

type ReactSettingsControlProps = {
    position: ControlPosition;
}


export function ReactSettingsControl(props: ReactSettingsControlProps) {
    useControl(() => new SettingsControl(), {
        position: props.position
    });

    return null;
}

export class SettingsControl implements IControl {
    private container: HTMLDivElement;
    private isShown: boolean = false;
    private settingsContainer: HTMLDivElement;
    private iconSpan: HTMLSpanElement;

    constructor() {
        this.container = DOM.create("div", "maplibregl-ctrl");
        this.settingsContainer = DOM.create("div");
        this.container.classList.add(
            "grid"
        );
        this.container.classList.add("p-[5px]");



        this.iconSpan = document.createElement("span");
        this.iconSpan.innerHTML = icon(faGear, {
            transform: {}
        }).html[0];
        this.container.appendChild(this.iconSpan)

        this.container.addEventListener("click", () => {
            console.log("Settings clicked");
            if(!this.isShown){
                this.showSettings();
            }
        })

        this.setUpUI();
    }


    private setUpUI(){
        this.settingsContainer = DOM.create("div");
        this.container.appendChild(this.settingsContainer);
        this.container.classList.add( "bg-white")

        this.settingsContainer.classList.add("grid", "hidden");

        const logoutBtn = DOM.create("button");
        logoutBtn.classList.add("w-[5em]", "bg-red-500");
        logoutBtn.textContent = "Logout";
        this.settingsContainer.appendChild(logoutBtn);
        logoutBtn.addEventListener("click", () => {
            console.log("Logout clicked");
            ApiProvider.getInstance().logout();
        })
    }

    showSettings() {
        this.isShown = true;
        this.settingsContainer.classList.remove("hidden");
        this.iconSpan.classList.add("hidden");
    }

    onRemove(): void {
        this.container.parentNode?.removeChild(this.container);
    }

    onAdd(): HTMLElement {
        return this.container;
    }

}

export default ReactSettingsControl;
