import { Test, TestingModule } from '@nestjs/testing';
import { ZfService } from './zf.service';

describe('ZfService', () => {
  let service: ZfService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ZfService],
    }).compile();

    service = module.get<ZfService>(ZfService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
