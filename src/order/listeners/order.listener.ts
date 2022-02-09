import { Inject, Injectable } from '@nestjs/common';
import { Order } from '../order';
import { OnEvent } from '@nestjs/event-emitter';
import { RedisService } from '../../shared/redis.service';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class OrderListener {
  constructor(
    private redisService: RedisService,
    @Inject('KAFKA_SERVICE') private client: ClientKafka,
  ) {}

  @OnEvent('order.completed')
  async handleOrderCompletedEvent(order: Order) {
    const client = this.redisService.getClient();
    client.zincrby('rankings', order.ambassador_revenue, order.user.name);

    console.log('fire event');
    const data = {
      ...order,
      total: order.total,
      ambassador_revenue: order.ambassador_revenue,
    };
    // emit a kafka event to the email server
    this.client.emit('default', JSON.stringify(data));
  }
}
