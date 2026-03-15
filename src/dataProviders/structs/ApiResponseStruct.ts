import type {UUID} from 'node:crypto';
import type {TaktischesZeichen} from 'taktische-zeichen-core/dist/types/types';


export interface ApiResponseStruct {

    _embedded?: {
        mapBaseLayerDtoList?: MapBaseLayerStruct[]
        mapOverlayDtoList?: MapOverlayStruct[]
        mapItemDtoList?: MapItemStruct[]
        unitDtoList?: UnitStruct[]
        mapGroupDtoList?: MapGroupStruct[]
        photoDtoList?: PhotoStruct[]
        userDtoList?: UserStruct[]
        missionGroupDtoList?: MissionGroupStruct[]
    }
    _links: unknown
}

export interface AbstractEntityStruct {
    id: UUID
    createdAt: string
    updatedAt: string
    permissions: string[]
}

export interface MapBaseLayerStruct extends AbstractEntityStruct{
    name: string
    url: string
    cacheUrl: string
}
export interface MapOverlayStruct extends AbstractEntityStruct{
    name: string
    fullTileUrl: string
    layerVersion: number
}

export interface MapItemStruct extends AbstractEntityStruct{
    name: string
    position: PositionStruct
    zoomLevel: number
    mapGroupId: string
}

export interface MapGroupStruct extends AbstractEntityStruct{
    name: string
}


export interface PositionStruct {
    latitude: number
    longitude: number
    accuracy: number
    timestamp: string
}

export interface UnitStruct extends AbstractEntityStruct{
    name: string
    position: PositionStruct
    status: number
    speakRequest: boolean
    icon?: TaktischesZeichen
}

export interface PhotoStruct extends AbstractEntityStruct{
    name: string
    position?: PositionStruct
    authorId: string;
    missionGroupId: string;
}

export interface UserStruct extends AbstractEntityStruct{
    email: string;
    firstName: string;
    lastName: string;
    unitId: string;
    username: string;
}

export interface MissionGroupStruct extends AbstractEntityStruct{
    name: string;
    startTime: string;
    endTime: string | null;
    mapGroupIds: string[];
    unitIds: string[];
    position: PositionStruct | null;
}