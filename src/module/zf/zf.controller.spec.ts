import { Test, TestingModule } from '@nestjs/testing';
import { ZfController } from './zf.controller';

describe('Zf Controller', () => {
  let controller: ZfController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ZfController],
    }).compile();

    controller = module.get<ZfController>(ZfController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
