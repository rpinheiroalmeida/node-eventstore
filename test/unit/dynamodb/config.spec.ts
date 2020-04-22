
import AWS = require('aws-sdk');
import * as chai from 'chai';
import 'mocha';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { DynamoDBConfig } from '../../../src/dynamodb/config';
import { EventsTableDefinitionDefaults } from '../../../src/dynamodb/events-table-definition';

chai.use(sinonChai);

const expect = chai.expect;

// tslint:disable:no-unused-expression
describe('Config', () => {

    let dynamodbStub: sinon.SinonStub;
    let createTableStub: sinon.SinonStubbedInstance<any>;
    let promiseStub: sinon.SinonStubbedInstance<any>;
    let listTablesStub: sinon.SinonStubbedInstance<any>;

    beforeEach(() => {

        createTableStub = sinon.spy((data: any): any => {
            return {
                promise: (): any => ({})
            };
        });

        promiseStub = sinon.stub();
        listTablesStub = sinon.spy((data: any): any => {
            return {
                promise: promiseStub,
            };
        });

        sinon.stub(AWS, "config").returns({ update: (): any => null });
        dynamodbStub = sinon.stub(AWS, 'DynamoDB').returns({
            createTable: createTableStub,
            listTables: listTablesStub,
        });
    });

    afterEach(() => {
        dynamodbStub.restore();
    });

    it('should create tables', async () => {
        promiseStub.returns({ TableNames: ['table_a', 'table_c'] });
        const dynamoDBConfig: DynamoDBConfig = new DynamoDBConfig({ region: 'any region' },
            EventsTableDefinitionDefaults);

        await dynamoDBConfig.createTableIfNotExists();

        expect(listTablesStub).to.have.been.calledOnce;
        expect(createTableStub).to.have.been.calledOnceWith({
            AttributeDefinitions: [
                { AttributeName: "aggregation_streamid", AttributeType: "S" },
                { AttributeName: "commitTimestamp", AttributeType: "N" }
            ],
            KeySchema: [
                { AttributeName: "aggregation_streamid", KeyType: "HASH" },
                { AttributeName: "commitTimestamp", KeyType: "RANGE" }
            ],
            ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 },
            TableName: "events"
        });
    });

    it('should create tables when there is no table', async () => {
        promiseStub.returns({ TableNames: [] });
        const dynamoDBConfig: DynamoDBConfig = new DynamoDBConfig({ region: 'any region' },
            EventsTableDefinitionDefaults);

        await dynamoDBConfig.createTableIfNotExists();

        expect(listTablesStub).to.have.been.calledOnce;
        expect(createTableStub).to.have.been.calledOnceWith({
            AttributeDefinitions: [
                { AttributeName: "aggregation_streamid", AttributeType: "S" },
                { AttributeName: "commitTimestamp", AttributeType: "N" }
            ],
            KeySchema: [
                { AttributeName: "aggregation_streamid", KeyType: "HASH" },
                { AttributeName: "commitTimestamp", KeyType: "RANGE" }
            ],
            ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 },
            TableName: "events"
        });
    });

    it('should not create tables', async () => {
        promiseStub.returns({ TableNames: ['table_a', 'events'] });
        const dynamoDBConfig: DynamoDBConfig = new DynamoDBConfig({ region: 'any region' },
            EventsTableDefinitionDefaults);

        await dynamoDBConfig.createTableIfNotExists();

        expect(listTablesStub).to.have.been.calledOnce;
        expect(createTableStub).to.not.have.been.called;
    });
});