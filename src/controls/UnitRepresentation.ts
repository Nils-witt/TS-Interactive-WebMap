import type {Unit} from '../enitities/Unit.ts';
import {Map as MapLibreMap, Marker, type MarkerOptions} from 'maplibre-gl';
import type {EmbeddablePosition} from '../enitities/embeddables/EmbeddablePosition.ts';


export class UnitRepresentation {

    private unit: Unit;

    private marker: Marker | null = null;

    private map: maplibregl.Map | undefined;
    private iconSize = 75;

    private showStatusBar = true;

    private container: HTMLDivElement = document.createElement('div');
    private statusNumberElement = document.createElement('label');
    private status_time_label = document.createElement('label');
    private tzImg = document.createElement('img');
    private timeout = 21600; // 6 hours in seconds
    private excludedStatuses = [6];

    private timeUpdateInterval: NodeJS.Timeout | null = null;

    private status_div = document.createElement('div');

    constructor(unit: Unit, map: maplibregl.Map | undefined) {
        this.unit = unit;
        this.map = map;

        this.createRepresentation();

        this.updatePosition(unit.getPosition());

        this.updateVisibility();
    }


    private createRepresentation(): void {
        this.container.className = 'unit-marker-container';
        const imgContainer = document.createElement('div');
        imgContainer.className = 'unit-icon-container';

        this.tzImg.width = this.iconSize;
        imgContainer.appendChild(this.tzImg);
        this.container.appendChild(imgContainer);

        const markerOptions: MarkerOptions = {};
        markerOptions.element = this.container;
        this.marker = new Marker(markerOptions);

        this.updateTZIcon();
        this.status_div.className = 'unit-status-indicator';
        if (!this.showStatusBar) {
            this.status_div.style.visibility = 'hidden';
        } else {
            this.status_div.style.visibility = 'visible';
        }

        const status_num_div = document.createElement('div');

        this.statusNumberElement.className = 'unit-status-num-label';
        status_num_div.appendChild(this.statusNumberElement);
        this.status_div.appendChild(status_num_div);

        const status_time_div = document.createElement('div');
        this.status_time_label.className = 'unit-status-time-label';
        status_time_div.appendChild(this.status_time_label);
        this.status_div.appendChild(status_time_div);
        this.container.appendChild(this.status_div);
    }

    private updateTZIcon(): void {
        this.tzImg.src = this.unit.getImgSrc();
    }

    update(unit: Unit): void {
        this.updatePosition(unit.getPosition());
        this.updateStatusBar(unit);

        this.unit = unit;
    }

    private updateStatusBar(unit: Unit): void {
        this.updateStatus(unit);
        this.updateTime(unit);
    }

    private updateStatus(unit: Unit): void {
        this.statusNumberElement.textContent = unit.getStatus()?.toString() || '';
    }

    private updateTime(unit: Unit): void {
        if (this.timeUpdateInterval) {
            clearInterval(this.timeUpdateInterval);
        }
        if (this.marker) {
            if (this.status_time_label) {
                const timestamp = unit.getPosition()?.getTimestamp().getTime();

                if (typeof timestamp === 'number') {
                    if ((Date.now() - unit.getPosition()!.getTimestamp().getTime()) / 1000 > this.timeout) {
                        this.updateVisibility();
                        return;
                    }
                    const timeDiff = Date.now() - timestamp;
                    const minutes = Math.floor(timeDiff / 60000);
                    const seconds = Math.floor((timeDiff % 60000) / 1000);
                    this.status_time_label.innerText = `${minutes}m ${seconds}s ago`;
                    this.timeUpdateInterval = setInterval(() => this.updateTime(unit), 1000);
                    return;
                } else {
                    this.status_time_label.innerText = 'No data';
                }
            }
        }
    }

    setMap(map: MapLibreMap | undefined): void {
        this.map = map;

        if (this.marker != null) {
            this.marker.remove();
        }
        this.updateVisibility();
    }

    setExcludeStatuses(excludedStatuses: number[]): void {
        this.excludedStatuses = excludedStatuses;
        this.updateVisibility();
    }

    setShowIconTimeout(timeout: number): void {
        this.timeout = timeout;
        this.updateVisibility();
        this.updateTime(this.unit);
    }

    setShowStatusBar(show: boolean): void {
        this.showStatusBar = show;
        if (show) {
            this.status_div.style.visibility = 'visible';
        } else {
            this.status_div.style.visibility = 'hidden';
        }
    }

    setIconSize(size: number): void {
        this.iconSize = size;
        this.tzImg.width = this.iconSize;
    }

    private updateVisibility(): void {
        if(this.marker != null) {
            if (
                this.map != null &&
                this.unit.getStatus() != null &&
                !this.excludedStatuses.includes(this.unit.getStatus() as number) &&
                this.unit.getPosition() != null &&
                (Date.now() - this.unit.getPosition()!.getTimestamp().getTime()) / 1000 < this.timeout
            ) {
                this.marker.addTo(this.map);
            } else {
                this.marker.remove();
            }
        }
    }

    private updatePosition(positon: EmbeddablePosition | null): void {
        if (positon != null && this.marker != null) {
            this.marker.setLngLat([positon.getLongitude(), positon.getLatitude()]);
        }
        this.updateVisibility();
    }
}