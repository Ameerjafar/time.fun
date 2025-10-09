import Redis, { createClient, RedisClientType } from "redis";

export class RedisClient {
  private publisher: RedisClientType;
  private subscriber: RedisClientType;

  constructor(url: string) {
    this.publisher = Redis.createClient({ url });
    this.subscriber = Redis.createClient({ url });
  }
  async connect() {
    this.publisher.connect();
    this.subscriber.connect();
  }
   async publish(channel: string, message: any) {
    console.log("channel name and message", channel, message);
    await this.publisher.publish(channel, message);
    console.log("this is working perfectly");
  }
  async subscribe(channel: string, handler: (msg: string) => void) {
    await this.subscriber.subscribe(channel, (msg: string) => {
      console.log("Received message", msg);
      handler(msg);
    });
  }
  async disconnect() {
    await this.publisher.quit();
    await this.subscriber.quit();
  }
}
export const redis = createClient({ url: process.env.REDIS_URL });
