import { Test, TestingModule } from '@nestjs/testing';
import { RepoRepository } from './repo.repository';

describe('RepoRepository', () => {
  let repository: RepoRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RepoRepository],
    }).compile();

    repository = module.get<RepoRepository>(RepoRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });
});
