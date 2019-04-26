import { CanActivate, ExecutionContext, HttpException, Injectable, HttpStatus } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class ZfGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const { username, password } = request.query
    if (!username || !password) {
      throw new HttpException('参数错误', 1);
    }
    return true;
  }
}
