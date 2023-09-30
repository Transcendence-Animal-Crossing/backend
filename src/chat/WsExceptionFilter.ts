import {
  Catch,
  ArgumentsHost,
  ExceptionFilter,
  HttpException, UnauthorizedException
} from "@nestjs/common";
import { Socket } from 'socket.io';

@Catch(HttpException)
export class WsExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToWs();
    const client: Socket = ctx.getClient();

    client.emit('exception', {
      status: exception.getStatus(),
      message: exception.message,
    });
    if (exception instanceof UnauthorizedException) {
      client.disconnect(true);
    }
  }
}
