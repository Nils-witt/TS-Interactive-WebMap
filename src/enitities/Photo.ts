import { AbstractEntity, type DBRecord } from './AbstractEntity';
import { EmbeddablePosition, type IPosition } from './embeddables/EmbeddablePosition';



export interface IPhoto {
    id?: string;
    name: string;
    position?: IPosition;
}

export class Photo extends AbstractEntity {
    id: string | null = null;
    name: string;
    position: EmbeddablePosition | null;


    constructor(data: IPhoto) {
        super();
        this.id = data.id ?? null;
        this.name = data.name;
        this.position = EmbeddablePosition.of(data.position);
    }

    public static of(data: DBRecord): Photo {
        return new Photo({
            name: data.name as string,
            position: data.position as IPosition,
        });
    }

    record(): DBRecord {
        return {
            id: this.id ?? null,
            name: this.name,
            position: this.position ? this.position.record() : null,
        };
    }
}