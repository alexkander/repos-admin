import {
  Controller,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  Post,
  Query,
  Render,
} from '@nestjs/common';
import { Remote } from '../schemas/remote.schema';
import { RemoteService } from '../services/remote.service';
import { SearchService } from '../services/search.service';
import { RemoteGroupType, SyncRemoteActionType } from '../types/remotes.type';
import { TableQueryParams } from '../types/utils.types';
import { remoteSearchValidation } from '../validations/remote.search.validator';
import { Types } from 'mongoose';

const fields = [
  { field: 'directory', text: 'directory' },
  { field: 'name', text: 'name' },
  { field: 'rare', text: 'rare' },
  { field: 'targetHost', text: 'targetHost' },
  { field: 'targetGroup', text: 'targetGroup' },
  { field: 'targetName', text: 'targetName' },
  { field: 'url', text: 'url' },
  { field: 'urlType', text: 'urlType' },
  { field: 'fetchStatus', text: 'status' },
];
@Controller('remote')
export class RemoteController {
  constructor(
    private readonly remoteService: RemoteService,
    private readonly searchService: SearchService,
  ) { }

  @Get('/')
  @Render('remote/index.hbs')
  async tableRepos(@Query() query: TableQueryParams<Remote>) {
    const searchQuery = { search: {}, sort: {}, ...query };
    const errors = this.searchService.validateSearchParams(
      query,
      remoteSearchValidation,
    );
    const { filterQuery, sortQuery } =
      this.searchService.queryToFilterParams(query);

    const useQuery = !errors.length ? filterQuery : {};
    const records = await this.remoteService.searchRepos(useQuery, sortQuery);
    const totalCount = await this.remoteService.count();
    return { records, totalCount, searchQuery, errors, fields };
  }

  @Post('/fetchRemotesByGroup/:group')
  fetchRemotesByGroup(@Param('group') group: RemoteGroupType) {
    return this.remoteService.fetchRemotesByGroup(group);
  }

  @Post('/:id/sync')
  syncById(
    @Param('id') id: Types.ObjectId,
    @Query('type') type: SyncRemoteActionType = SyncRemoteActionType.base,
    @Query('doFetch', new ParseBoolPipe({ optional: true }))
    doFetch: boolean = false,
  ) {
    return this.remoteService.syncRemoteById(id, type, doFetch);
  }

  /////////////////////
  @Get('/:host/:group/remotesLonelyBranchesByGroup')
  getRemotesLonelyBranchesByGroup(
    @Param('host') host: string,
    @Param('group') group: string,
  ) {
    return this.remoteService.remotesLonelyBranchesByGroup(host, group);
  }

  @Delete('/:host/:group/removeRemotesWithNoLonelyBranches')
  removeRemotesWithNoLonelyBranches(
    @Param('host') host: string,
    @Param('group') group: string,
  ) {
    return this.remoteService.removeRemotesWithNoLonelyBranches(host, group);
  }
}
