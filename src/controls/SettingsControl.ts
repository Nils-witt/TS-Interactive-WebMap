import type {ControlPosition, IControl} from "maplibre-gl";
import {DOM} from "maplibre-gl/src/util/dom";
import {faGear} from "@fortawesome/free-solid-svg-icons/faGear";
import {icon} from "@fortawesome/fontawesome-svg-core";
import {useControl} from "@vis.gl/react-maplibre";
import {ApiProvider} from "../dataProviders/ApiProvider.ts";
import {CacheManager} from "../dataProviders/CacheManager";
import {faXmark} from "@fortawesome/free-solid-svg-icons/faXmark";

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

        this.iconSpan.addEventListener("click", () => {
            this.toggleOpen();
        })

        this.setUpUI();
    }


    private setUpUI() {
        this.settingsContainer = DOM.create("div");
        this.container.appendChild(this.settingsContainer);
        this.container.classList.add("bg-white");

        this.settingsContainer.classList.add("grid", "hidden");

        const logoutBtn = DOM.create("button");
        logoutBtn.classList.add("w-[5em]", "h-[2.5em]", "bg-red-500");
        logoutBtn.textContent = "Logout";
        this.settingsContainer.appendChild(logoutBtn);
        logoutBtn.addEventListener("click", () => {
            if (confirm("Are you sure you want to logout?")) {
                ApiProvider.getInstance().logout();
            }
        });

        const clearCacheBtn = DOM.create("button");
        clearCacheBtn.classList.add("w-[8em]", "h-[2.5em]", "mt-[10px]", "bg-orange-500");
        clearCacheBtn.textContent = "Clear Cache";
        this.settingsContainer.appendChild(clearCacheBtn);
        clearCacheBtn.addEventListener("click", () => {
            if (confirm("Are you sure you want to clear the cache?")) {
                CacheManager.clearMapData();
            }
        });
    }

    toggleOpen() {
        if (this.isShown) {
            this.settingsContainer.classList.add("hidden");
            this.iconSpan.innerHTML = icon(faGear).html[0];
        } else {
            this.settingsContainer.classList.remove("hidden");
            this.iconSpan.innerHTML = icon(faXmark).html[0];
        }

        this.isShown = !this.isShown;
    }

    onRemove(): void {
        this.container.parentNode?.removeChild(this.container);
    }

    onAdd(): HTMLElement {
        return this.container;
    }

}

export default ReactSettingsControl;
