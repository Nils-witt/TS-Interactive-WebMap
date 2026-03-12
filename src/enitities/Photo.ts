import { DataProvider } from '../dataProviders/DataProvider';
import { AbstractEntity, type DBRecord } from './AbstractEntity';
import { EmbeddablePosition, type IPosition } from './embeddables/EmbeddablePosition';



export interface IPhoto {
    id: string;
    name: string;
    position?: IPosition;
    authorId: string;
    missionGroupId: string;
}

export class Photo extends AbstractEntity {
    id: string;
    name: string;
    position: EmbeddablePosition | null;
    authorId: string;
    missionGroupId: string;


    constructor(data: IPhoto) {
        super();
        this.id = data.id;
        this.name = data.name;
        this.position = EmbeddablePosition.of(data.position);
        this.authorId = data.authorId;
        this.missionGroupId = data.missionGroupId;
    }

    public static of(data: DBRecord): Photo {
        return new Photo({
            name: data.name as string,
            position: data.position as IPosition,
            authorId: data.authorId as string,
            missionGroupId: data.missionGroupId as string,
            id: data.id as string
        });
    }

    record(): DBRecord {
        return {
            id: this.id ?? null,
            name: this.name,
            position: this.position ? this.position.record() : null,
            authorId: this.authorId,
            missionGroupId: this.missionGroupId,
        };
    }


    public getImageSrc(): string {
        if (!this.id) {
            return '';
        }
        return DataProvider.getInstance().getApiUrl() + '/photos/' + this.id + '/image?token=' + DataProvider.getInstance().getApiToken();
    }

    public getId(): string{
        return this.id;
    }
}