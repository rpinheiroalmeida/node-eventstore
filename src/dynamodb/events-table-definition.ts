export interface EventsTableDefinition {
    tableName: string;
    readCapacityUnits: number;
    writeCapacityUnits: number;
}

export const EventsTableDefinitionDefaults: EventsTableDefinition = {
    readCapacityUnits: 1,
    tableName: 'events',
    writeCapacityUnits: 1,
};
