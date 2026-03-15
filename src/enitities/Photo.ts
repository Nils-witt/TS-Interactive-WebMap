import { DataProvider } from '../dataProviders/DataProvider';
import { AbstractEntity, type DBRecord, type IAbstractEntity } from './AbstractEntity';
import { EmbeddablePosition, type IPosition } from './embeddables/EmbeddablePosition';



export interface IPhoto extends IAbstractEntity {
    name: string;
    position?: IPosition;
    authorId: string;
    missionGroupId: string;
}

export class Photo extends AbstractEntity {
    private name: string;
    private position: EmbeddablePosition | null;
    private authorId: string;
    private missionGroupId: string;


    constructor(data: IPhoto) {
        super(data.id, data.createdAt, data.updatedAt, data.permissions);
        this.name = data.name;
        this.position = EmbeddablePosition.of(data.position);
        this.authorId = data.authorId;
        this.missionGroupId = data.missionGroupId;
    }

    public static of(data: DBRecord): Photo {
        return new Photo({
            id: data.id as string,
            createdAt: new Date(data.createdAt as string).getTime(),
            updatedAt: new Date(data.updatedAt as string).getTime(),
            permissions: data.permissions as string[],
            name: data.name as string,
            position: data.position as IPosition,
            authorId: data.authorId as string,
            missionGroupId: data.missionGroupId as string
        });
    }

    record(): DBRecord {
        return {
            ...super.record(),
            name: this.name,
            position: this.position ? this.position.record() : null,
            authorId: this.authorId,
            missionGroupId: this.missionGroupId,
        };
    }


    public getImageSrc(): string {
        if (!this.getId()) {
            return '';
        }
        return DataProvider.getInstance().getApiUrl() + '/photos/' + this.getId() + '/image?token=' + DataProvider.getInstance().getApiToken();
    }

    public getName(): string {
        return this.name;
    }

    public getPosition(): EmbeddablePosition | null {
        return this.position;
    }

    public getAuthorId(): string {
        return this.authorId;
    }

    public getMissionGroupId(): string {
        return this.missionGroupId;
    }

    public setName(name: string) {
        this.name = name;
    }

    public setPosition(position: EmbeddablePosition | null) {
        this.position = position;
    }

    public setAuthorId(authorId: string) {
        this.authorId = authorId;
    }

    public setMissionGroupId(missionGroupId: string) {
        this.missionGroupId = missionGroupId;
    }
}