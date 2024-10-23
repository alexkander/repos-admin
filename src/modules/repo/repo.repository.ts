import { Repository } from '../../libs/nedb';
import { RepoModel } from './repo.model';

export const repoRepository = Repository.build(RepoModel);
