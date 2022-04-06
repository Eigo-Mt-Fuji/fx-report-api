import { Test, TestingModule } from '@nestjs/testing';
import { FxAnalysisController } from './fx-analysis.controller';

describe('FxAnalysisController', () => {
  let controller: FxAnalysisController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FxAnalysisController],
    }).compile();

    controller = module.get<FxAnalysisController>(FxAnalysisController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
