import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseBoolPipe,
  Post,
  Put,
  Query,
  Render,
  Req
} from '@nestjs/common';
import { Request } from 'express';
import { Types } from 'mongoose';
import { RepoControllerConstants } from '../constants/repo.constants';
import { Repo } from '../schemas/repo.schema';
import { RepoService } from '../services/repo.service';
import { SearchService } from '../services/search.service';
import { SyncRepoActionType } from '../types/repos.types';
import { TableQueryParams } from '../types/utils.types';
import { repoSearchValidation } from '../validations/repo.search.validator';

const fields = [
  { field: 'directory', text: 'directory' },
  { field: 'group', text: 'group' },
  { field: 'localName', text: 'name' },
  { field: 'valid', text: 'is valid' },
  { field: 'remotes', text: 'remotes' },
  { field: 'branches', text: 'branches' },
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

  @Post('/sync')
  sync(
    @Query('type') type: SyncRepoActionType = SyncRepoActionType.base,
    @Query('doFetch', new ParseBoolPipe({ optional: true }))
    doFetch: boolean = false,
  ) {
    return this.repoService.syncAll(type, doFetch);
  }

  @Post('/:id/sync')
  syncById(
    @Param('id') id: Types.ObjectId,
    @Query('type') type: SyncRepoActionType = SyncRepoActionType.base,
    @Query('doFetch', new ParseBoolPipe({ optional: true }))
    doFetch: boolean = false,
  ) {
    return this.repoService.syncRepoById(id, type, doFetch);
  }

  @Put('/:id/fetchRemotes')
  fetchRemotes(@Param('id') id: Types.ObjectId) {
    return this.repoService.fetchRepoRemotesById(id);
  }

  @Get('/:id/checkStatus')
  @Render('repos/checkStatus.hbs')
  checkStatus(@Param('id') id: Types.ObjectId) {
    return this.repoService.checkStatusById(id);
  }
}
