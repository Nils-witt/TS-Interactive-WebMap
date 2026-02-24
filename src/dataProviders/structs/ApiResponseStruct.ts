import type {UUID} from 'node:crypto';
import type {TaktischesZeichen} from 'taktische-zeichen-core/dist/types/types';


export interface ApiResponseStruct {

    _embedded?: {
        mapBaseLayerDtoList?: MapBaseLayerStruct[]
        mapOverlayDtoList?: MapOverlayStruct[]
        mapItemDtoList?: MapItemStruct[]
        unitDtoList?: UnitStruct[]
    }
    _links: unknown
}

export interface AbstractEntityStruct {
    id: UUID
    createdAt: string
    updatedAt: string
}

export interface MapBaseLayerStruct extends AbstractEntityStruct{
    name: string
    url: string
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