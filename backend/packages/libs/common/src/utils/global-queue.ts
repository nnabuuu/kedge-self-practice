import PQueue from 'p-queue';
import memoize from 'lodash/memoize';



type QueueConfig = ConstructorParameters<typeof PQueue>[0];
export const getGlobalPQueue = memoize(
  (queueName: string, config?: QueueConfig) => new PQueue(config),
  (queueName: string) => queueName, // custom resolver
);
