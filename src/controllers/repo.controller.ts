import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Render,
  Req
} from '@nestjs/common';
import { Request } from 'express';
import { Types } from 'mongoose';
import { repoSearchValidation } from '../validations/repo.search.validator';
import { RepoControllerConstants } from '../constants/repo.constants';
import { Repo } from '../schemas/repo.schema';
import { RepoService } from '../services/repo.service';
import { SearchService } from '../services/search.service';
import { TableQueryParams } from '../types/utils.types';

@Controller('repo')
export class RepoController {
  constructor(
    private readonly repoService: RepoService,
    private readonly searchService: SearchService,
  ) { }

  @Get('/')
  @Render('list-repos.hbs')
  async tableRepos(@Query() searchQuery: TableQueryParams<Repo>) {
    const errors = this.searchService.validateSearchParams(
      searchQuery,
      repoSearchValidation,
    );
    const { filterQuery, sortQuery } =
      this.searchService.queryToFilterParams(searchQuery);

    const useQuery = !errors.length ? filterQuery : {};
    const repos = await this.repoService.searchRepos(useQuery, sortQuery);
    return { repos, searchQuery, errors };
  }

  @Get('/listLocalRepos')
  listLocalRepos() {
    return this.repoService.listLocalRepos();
  }

  @Post('/saveLocalRepos')
  saveLocalRepos() {
    return this.repoService.saveLocalRepos();
  }

  @Put('/:id/refresh')
  refresh(@Param('id') id: Types.ObjectId) {
    return this.repoService.refresh(id);
  }

  @Post('/gitFetch/:type')
  gitFetch(@Param('type') type: string) {
    return this.repoService.gitFetch(type);
  }

  @Get('/compareWith/*')
  compareWith(@Req() req?: Request) {
    const repos = req.params['0'];
    const regex = new RegExp(RepoControllerConstants.compareWithExtractor);
    const matches = regex.exec(repos);
    if (!matches) {
      throw new BadRequestException('bad request');
    }
    const [, folderKeyFrom, directoryFrom, folderKeyTo, directoryTo] = matches;
    return this.repoService.compareRepos({
      folderKeyFrom,
      directoryFrom,
      folderKeyTo,
      directoryTo,
    });
  }
}
