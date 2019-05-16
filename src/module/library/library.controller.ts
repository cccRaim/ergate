import { Controller, Get, HttpException, Query } from '@nestjs/common';
import { LibraryUser } from './library.user';
import { LibraryService } from './library.service';

@Controller('library')
export class LibraryController {
  constructor(private libraryService: LibraryService) {}

  @Get('borrow')
  async borrow(@Query('username') username, @Query('password') password) {
    const user = new LibraryUser(username, password);
    if (!await this.libraryService.login(user)) {
      throw new HttpException('登录错误', 1);
    }
    return {
      code: 0,
      data: await this.libraryService.getBorrow(user),
    };
  }
}
