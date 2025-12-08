import type {Overlay} from '../enitities/Overlay.ts';
import type {MapStyle} from '../enitities/MapStyle.ts';
import type {NamedGeoReferencedObject} from '../enitities/NamedGeoReferencedObject.ts';


export interface StorageInterface {

    setUp(): Promise<void>;

    saveOverlay(overlay: Overlay): Promise<Overlay>;

    loadOverlay(id: string): Promise<Overlay | null>;

    loadAllOverlays(): Promise<Record<string, Overlay>>;

    deleteOverlay(id: string): Promise<boolean>;

    saveMapStyle(mapStyle: MapStyle): Promise<MapStyle>;

    loadMapStyle(id: string): Promise<MapStyle | null>;

    loadAllMapStyles(): Promise<Record<string, MapStyle>>;

    deleteMapStyle(id: string): Promise<void>;

    saveNamedGeoReferencedObject(namedGeoReferencedObject: NamedGeoReferencedObject): Promise<NamedGeoReferencedObject>;

    loadNamedGeoReferencedObject(id: string): Promise<NamedGeoReferencedObject | null>;

    loadAllNamedGeoReferencedObjects(): Promise<Record<string, NamedGeoReferencedObject>>;

    deleteNamedGeoReferencedObject(id: string): Promise<void>;

}