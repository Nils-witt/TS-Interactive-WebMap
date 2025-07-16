

export type MapEntity = {
    name: string; // The name of the entity, used for display purposes
    id: string; // Unique identifier for the entity, used for source and layer creation
    description: string; // A brief description of the entity's content and purpose
    latitude: number; // The latitude coordinate of the entity's location
    longitude: number; // The longitude coordinate of the entity's location
    groups: number[]; // Array of group names the entity belongs to, used for filtering and categorization
    zoomLevel?: number; // Optional zoom level for the entity, used to control visibility at different zoom levels

}

export type MapEntityGroup = {
    id: number; // Unique identifier for the group
    name: string; // Name of the group, used for display purposes
    description: string; // Description of the group, providing context about its purpose
    color: string; // Color associated with the group, used for visual representation on the map
}
