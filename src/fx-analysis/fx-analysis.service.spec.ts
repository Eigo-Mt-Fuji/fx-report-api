import { Test, TestingModule } from '@nestjs/testing';
import { FxAnalysisService } from './fx-analysis.service';

describe('FxAnalysisService', () => {
  let service: FxAnalysisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FxAnalysisService],
    }).compile();

    service = module.get<FxAnalysisService>(FxAnalysisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
