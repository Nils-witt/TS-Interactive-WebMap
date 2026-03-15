import { AbstractEntity, type DBRecord, type IAbstractEntity } from './AbstractEntity';


export interface IUser extends IAbstractEntity {
    email: string;
    firstName: string;
    lastName: string;
    unitId: string;
    username: string;
}

export class User extends AbstractEntity {
    private email: string;
    private firstName: string;
    private lastName: string;
    private unitId: string;
    private username: string;

    constructor(data: IUser) {
        super(data.id, data.createdAt, data.updatedAt, data.permissions);
        this.email = data.email;
        this.firstName = data.firstName;
        this.lastName = data.lastName;
        this.unitId = data.unitId;
        this.username = data.username;
    }

    public static of(data: DBRecord): User {
        return new User({
            id: data.id as string,
            createdAt: new Date(data.createdAt as string).getTime(),
            updatedAt: new Date(data.updatedAt as string).getTime(),
            permissions: data.permissions as string[],
            email: data.email as string,
            firstName: data.first_name as string,
            lastName: data.last_name as string,
            unitId: data.unit_id as string,
            username: data.username as string,
        });
    }


    record(): DBRecord {
        return {
            ...super.record(),
            email: this.email,
            first_name: this.firstName,
            last_name: this.lastName,
            unit_id: this.unitId,
            username: this.username,
        };
    }

    getEmail(): string {
        return this.email;
    }

    getFirstName(): string {
        return this.firstName;
    }

    getLastName(): string {
        return this.lastName;
    }

    getUnitId(): string {
        return this.unitId;
    }

    getUsername(): string {
        return this.username;
    }
}