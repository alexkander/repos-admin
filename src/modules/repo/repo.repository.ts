import { Repository } from '../../libs/nedb';
import { RepoModel } from './repo.model';

export const repoRepository = Repository.build(RepoModel);

export class RepoRepository {
  protected readonly repository = Repository.build(RepoModel);

  findAll() {
    return this.repository.find();
  }

  findRepoById(id: string) {
    return this.repository.findOne({ _id: id });
  }
}
