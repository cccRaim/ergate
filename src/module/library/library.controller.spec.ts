import { Test, TestingModule } from '@nestjs/testing';
import { LibraryController } from './library.controller';

describe('Library Controller', () => {
  let controller: LibraryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LibraryController],
    }).compile();

    controller = module.get<LibraryController>(LibraryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
