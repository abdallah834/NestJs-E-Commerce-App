import {
  Ack,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Types } from 'mongoose';
import { Server, Socket } from 'socket.io';
import { Auth, User } from 'src/common/decorators';
import { RoleEnums } from 'src/common/enums';
import { CacheService, TokenService } from 'src/common/services';
import { getAuthenticatedSocket } from 'src/common/utils/socketIo';
import type { hydratedUserDocument } from 'src/models';
// import type { CacheService, TokenService } from 'src/common/services';

// to separate the events from backend we can specify a name space ex:http://localhost:80/admin
// @WebSocketGateway(3100, { namespace: 'admin', cors: ['http://localhost:3000'] })
@WebSocketGateway()
export class RealTimeGateWay
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly tokenService: TokenService,
    private readonly redis: CacheService,
  ) {}
  @WebSocketServer()
  private server!: Server; // IO for global usage

  afterInit() {
    // server: Server
    console.log('Gateway is initialized');
  }
  async handleConnection(client: Socket) {
    try {
      const { userAccount, decodedToken } = await this.tokenService.decodeToken(
        {
          token: getAuthenticatedSocket(client),
        },
      );

      client.data = { userAccount, decodedToken };

      await this.redis.addSocket(userAccount._id, client.id);
    } catch (error) {
      client.emit('custom_error', error);
    }
  }
  async handleDisconnect() {
    // client: Socket,
    //   try {
    //     await this.redis.removeSocket(client.data.user._id , client.id);
    //     const connections =
    //       (await this.redis.getSockets(client.data.user._id)) || [];
    //     if (connections.length < 1) {
    //       this.server.emit('user_offline', {
    //         userId: client.data.user._id,
    //         status: 'Offline',
    //       });
    //     }
    //   } catch (error) {
    //     client.emit('custom_error', error);
    //   }
  }
  @Auth({ roles: [RoleEnums.ADMIN, RoleEnums.USER] })
  @SubscribeMessage('Hi')
  sayHi(
    @User() user: hydratedUserDocument,
    @MessageBody() message: string,
    @ConnectedSocket() client: Socket,
    @Ack()
    acknowledgement: (response: { status: string; date: string }) => void,
  ) {
    try {
      acknowledgement({
        date: new Date(Date.now()).toISOString(),
        status: 'Done',
      });
      client.emit('Hi', { test: 'done', user });
      // to emit to all connected clients
      // this.server.emit('Hi', { test: 'done' });
    } catch (error) {
      client.emit('custom_error', error);
    }
  }
  changeStock(products: { productId: Types.ObjectId; stock: number }[]) {
    this.server.emit('stock', products);
  }
}
