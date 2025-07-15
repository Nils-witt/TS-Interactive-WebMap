import type {MapEntity} from "../types/MapEntity.ts";


export class MapEntityProvider {
    static getDummyEntities(): MapEntity[] {

        let entities: MapEntity[] = [];


        entities.push({
            name: "Dummy Entity 1",
            id: "dummy-entity-1",
            description: "This is a dummy entity for testing purposes.",
            latitude: 50.7270,
            longitude: 7.0861,
            groups: [1]
        });
        entities.push({
            name: "Dummy Entity 2",
            id: "dummy-entity-2",
            description: "This is a dummy entity for testing purposes.",
            latitude: 50.7290,
            longitude: 7.0261,
            groups: [1]
        });

        for (let i = 3; i <= 100; i++) {
            entities.push({
                name: `Dummy Entity ${i}`,
                id: `dummy-entity-${i}`,
                description: `This is a dummy entity number ${i} for testing purposes.`,
                latitude: 50.72 + (i * 0.001),
                longitude: 7.02 + (i * 0.001),
                groups: [1]
            });
        }

        return entities;

    }

    static async getProductionEntities(): Promise<MapEntity[]> {
        const url = 'http://127.0.0.1:8000/api/mapobjects/'

        let data = await fetch(url)

        if (data.ok) {
            let jsonData = await data.json();
            return jsonData.map((item: any) => ({
                name: item.name,
                id: item.id,
                description: "No description available",
                latitude: item.latitude,
                longitude: item.longitude,
                groups:  []
            }) as MapEntity);
        } else {
            console.error("Failed to fetch entities:", data.statusText);
        }
        return [];
    }
}