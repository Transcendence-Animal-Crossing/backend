import {
  Catch,
  ArgumentsHost,
  ExceptionFilter,
  HttpException,
  UnauthorizedException,
} from '@nestjs/common';
import { Socket } from 'socket.io';

@Catch(HttpException)
export class WsExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToWs();
    const client: Socket = ctx.getClient();
    const ackCallback = host.getArgByIndex(2);
    ackCallback({ status: exception.getStatus(), body: exception.message });

    if (exception instanceof UnauthorizedException) {
      client.disconnect(true);
    }
  }
}
