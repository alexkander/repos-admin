import { Controller, Get, Param, Post, Query, Render } from '@nestjs/common';
import { Types } from 'mongoose';
import { Repo } from '../schemas/repo.schema';
import { RepoService } from '../services/repo.service';
import { SearchService } from '../services/search.service';
import { TableQueryParams } from '../types/utils.types';
import { repoSearchValidation } from '../validations/repo.search.validator';

const fields = [
  { field: 'directory', text: 'directory' },
  { field: 'group', text: 'group' },
  { field: 'localName', text: 'name' },
  { field: 'valid', text: 'is valid' },
  { field: 'remotes', text: 'remotes' },
  { field: 'branches', text: 'branches' },
  { field: 'branchesToCheck', text: 'branchesToCheck' },
];

@Controller('repo')
export class RepoController {
  constructor(
    private readonly repoService: RepoService,
    private readonly searchService: SearchService,
  ) { }

  @Get('/')
  @Render('repos/index.hbs')
  async tableRepos(@Query() query: TableQueryParams<Repo>) {
    const searchQuery = { search: {}, sort: {}, ...query };
    const errors = this.searchService.validateSearchParams(
      query,
      repoSearchValidation,
    );
    const { filterQuery, sortQuery } =
      this.searchService.queryToFilterParams(query);

    const useQuery = !errors.length ? filterQuery : {};
    const records = await this.repoService.searchRepos(useQuery, sortQuery);
    const totalCount = await this.repoService.count();
    return { records, totalCount, searchQuery, errors, fields };
  }

  @Post('/syncBase')
  syncBase() {
    return this.repoService.syncAll({
      doFetch: false,
      syncBranches: false,
      syncRemotes: false,
      syncTags: false,
    });
  }

  @Post('/syncAll')
  syncAll() {
    return this.repoService.syncAll({
      doFetch: true,
      syncBranches: true,
      syncRemotes: true,
      syncTags: true,
    });
  }

  @Post('/:id/syncAll')
  syncAllById(@Param('id') id: Types.ObjectId) {
    return this.repoService.syncRepoById(id, {
      doFetch: true,
      syncBranches: true,
      syncRemotes: true,
      syncTags: true,
    });
  }

  @Get('/:id/checkStatus')
  @Render('repos/checkStatus.hbs')
  checkStatus(@Param('id') id: Types.ObjectId) {
    return this.repoService.checkStatusById(id);
  }
}
