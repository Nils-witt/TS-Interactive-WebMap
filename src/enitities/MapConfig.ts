import {LocalStorageProvider} from '../dataProviders/LocalStorageProvider.ts';


export class MapConfig {


    private unitIconSize = parseInt(localStorage.getItem('unit_icon_size') || '50');
    private excludeStatuses = [6];
    private provider = new LocalStorageProvider();

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
        this.excludeStatuses = excludeStatuses;
    }
}