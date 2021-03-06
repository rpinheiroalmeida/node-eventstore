'use strict';

import * as chai from 'chai';
import 'mocha';
import * as proxyquire from 'proxyquire';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { Message } from '../../../src/model/message';
import { RedisFactory } from '../../../src/redis/connect';

chai.use(sinonChai);
const expect = chai.expect;
// tslint:disable:no-unused-expression

describe('EventStory Redis Publisher', () => {
    let factoryStub: sinon.SinonStub;
    let redisStub: sinon.SinonStubbedInstance<any>;
    let RedisPublisher: any;
    beforeEach(() => {
        redisStub = sinon.stub({
            on: (key: string, callback: (aggregation: string, received: string) => void) => this,
            publish: (key: string, message: string) => null,
            subscribe: (key: string) => null,
            unsubscribe: (key: string) => null
        });
        factoryStub = sinon.stub(RedisFactory, 'createClient').returns(redisStub as any);
        RedisPublisher = proxyquire('../../../src/publisher/redis', { '../redis/connect': factoryStub }).RedisPublisher;
    });

    afterEach(() => {
        factoryStub.restore();
    });

    it('should be able to publish events to redis', async () => {
        const redisPublisher: any = new RedisPublisher({ standalone: { host: 'localhost' } });

        const message: Message = {
            event: {
                commitTimestamp: 123,
                payload: 'PAYLOAD',
                sequence: 2
            },
            stream: {
                aggregation: 'orders',
                id: '1'
            }
        };
        redisStub.publish.returns(1);
        const status = await redisPublisher.publish(message);

        expect(redisStub.publish).to.have.been.calledOnceWithExactly(message.stream.aggregation, JSON.stringify(message));
        expect(status).to.be.true;
    });

    it('should be able to notify when no listener reacted to a publish event', async () => {
        const redisPublisher: any = new RedisPublisher({ standalone: { host: 'localhost' } });

        const message: Message = {
            event: {
                commitTimestamp: 123,
                payload: 'PAYLOAD',
                sequence: 2
            },
            stream: {
                aggregation: 'offers',
                id: '1'
            }
        };
        redisStub.publish.returns(0);
        const status = await redisPublisher.publish(message);

        expect(redisStub.publish).to.have.been.calledOnceWithExactly(message.stream.aggregation, JSON.stringify(message));
        expect(status).to.be.false;
    });

    it('should be able to subscribe to listen changes in the eventstore', async () => {
        redisStub.on.returns(redisStub);
        const redisPublisher: any = new RedisPublisher({ standalone: { host: 'localhost' } });

        const subscriberOrdersStub = sinon.stub();
        const subscriberOrdersStub2 = sinon.stub();
        const subscription = await redisPublisher.subscribe('orders', subscriberOrdersStub);
        await redisPublisher.subscribe('orders', () => subscriberOrdersStub2);

        await subscription.remove();

        expect(redisStub.subscribe).to.have.been.calledTwice;
        expect(redisStub.subscribe).to.have.been.calledWithExactly('orders');
        expect(redisStub.on).to.have.been.calledOnce;
        expect(redisStub.unsubscribe).to.not.have.been.called;
    });

    it('should be able to unsubscribe to redis channel', async () => {
        redisStub.on.returns(redisStub);
        const redisPublisher: any = new RedisPublisher({ standalone: { host: 'localhost' } });

        const subscriberOrdersStub = sinon.stub();
        const subscription = await redisPublisher.subscribe('orders', subscriberOrdersStub);
        await subscription.remove();

        expect(redisStub.subscribe).to.have.been.calledOnceWithExactly('orders');
        expect(redisStub.on).to.have.been.calledOnce;
        expect(redisStub.unsubscribe).to.have.been.calledOnceWithExactly('orders');
    });
});
