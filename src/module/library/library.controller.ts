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
      data: {
        info: await this.libraryService.getInfo(user),
        borrowList: await this.libraryService.getBorrow(user),
      },
    };
  }

  @Get('search')
  async search(@Query('wd') wd, @Query('page') page) {
    const user = new LibraryUser(0, 0);
    return {
      code: 0,
      data: await this.libraryService.search(user, wd, page),
    };
  }
}
