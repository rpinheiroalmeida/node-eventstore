import AWS = require('aws-sdk');
import DynamoDB = require("aws-sdk/clients/dynamodb");
import { AWSConfig } from "../aws/config";
import { EventsTableDefinition, EventsTableDefinitionDefaults } from './events-table-definition';

export class DynamoDBConfig {
    private eventsTableDefinition: EventsTableDefinition;
    private dynamoDB: DynamoDB;

    constructor(awsConfig: AWSConfig, eventsTableDefinitionOption: EventsTableDefinition) {
        AWS.config.update(awsConfig);
        this.eventsTableDefinition = { ...EventsTableDefinitionDefaults, ...eventsTableDefinitionOption };

        this.dynamoDB = new AWS.DynamoDB();
    }

    public async createTableIfNotExists() {
        const exists = await this.checkIfexists();
        if (!exists) {
            this.dynamoDB.createTable(this.eventsScheme()).promise();
        }
    }

    public async checkIfexists(): Promise<boolean> {
        const tables = await this.dynamoDB.listTables({}).promise();

        return tables.TableNames.filter(tableName => {

            return tableName === this.eventsTableDefinition.tableName;
        }).length === 1;
    }

    private eventsScheme() {
        return {
            AttributeDefinitions: [
                {
                    AttributeName: "aggregation_streamid",
                    AttributeType: "S"
                },
                {
                    AttributeName: "commitTimestamp",
                    AttributeType: "N"
                }
            ],
            KeySchema: [
                {
                    AttributeName: "aggregation_streamid",
                    KeyType: "HASH",
                },
                {
                    AttributeName: "commitTimestamp",
                    KeyType: "RANGE"
                }
            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: this.eventsTableDefinition.readCapacityUnits,
                WriteCapacityUnits: this.eventsTableDefinition.writeCapacityUnits
            },
            TableName: this.eventsTableDefinition.tableName,
        };
    }
}