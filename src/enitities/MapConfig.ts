import {LocalStorageProvider} from '../dataProviders/LocalStorageProvider.ts';


export class MapConfig {


    private unitIconSize = parseInt(localStorage.getItem('unit_icon_size') || '50');
    private excludeStatuses = JSON.parse(localStorage.getItem('exclude_statuses') || '[6]') as number[];
    private provider = new LocalStorageProvider();
    private hideUnitsAfterPositionUpdate = parseInt(localStorage.getItem('hide_units_after_position_update') || '21600'); // 6 hours in seconds

    public getUnitIconSize(): number {
        return this.unitIconSize;
    }

    public setUnitIconSize(unitIconSize: number): void {
        void this.provider.setItem('unit_icon_size', unitIconSize.toString());
        this.unitIconSize = unitIconSize;
    }

    public getExcludeStatuses(): number[] {
        return this.excludeStatuses;
    }

    public setExcludeStatuses(excludeStatuses: number[]): void {
        void this.provider.setItem('exclude_statuses', JSON.stringify(excludeStatuses));
        this.excludeStatuses = excludeStatuses;
    }

    public getHideUnitsAfterPositionUpdate(): number {
        return this.hideUnitsAfterPositionUpdate;
    }

    public setHideUnitsAfterPositionUpdate(seconds: number): void {
        void this.provider.setItem('hide_units_after_position_update', seconds.toString());
        this.hideUnitsAfterPositionUpdate = seconds;
    }
}