import { InfluxDB, Point } from '@influxdata/influxdb-client';
import { InfluxDBClient } from '@influxdata/influxdb3-client';
import { Controller, Get, Param, Post, Query, Render } from '@nestjs/common';
import { Types } from 'mongoose';
import { configuration } from 'src/configuration/configuration';
import { Repo } from '../schemas/repo.schema';
import { RepoService } from '../services/repo.service';
import { SearchService } from '../services/search.service';
import { TableQueryParams } from '../types/utils.types';
import { repoSearchValidation } from '../validations/repo.search.validator';

const token = configuration.INFLUXDB_TOKEN;
const url = 'http://localhost:8086';
const org = 'alex';
const bucket = 'repo-admin';
const client = new InfluxDB({ url, token });

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
  async syncAllById(@Param('id') id: Types.ObjectId) {
    const now = Date.now();
    const result = await this.repoService.syncRepoById(id, {
      doFetch: true,
      syncBranches: true,
      syncRemotes: true,
      syncTags: true,
    });

    const duration = Date.now() - now;
    this.writePoint(duration);
    return result;
  }

  @Get('/stats1')
  async stats1() {
    const queryClient = client.getQueryApi(org);
    const fluxQuery = `from(bucket: "${bucket}")
      |> range(start: -2h)
      |> filter(fn: (r) => r._measurement == "measurement1")`;

    const result = new Promise((resolve, reject) => {
      const tableObject: any[] = [];
      queryClient.queryRows(fluxQuery, {
        next: (row, tableMeta) => {
          tableObject.push(tableMeta.toObject(row));
        },
        error: reject,
        complete: () => {
          resolve(tableObject);
        },
      });
    });
    return await result;
  }

  @Get('/stats2')
  async stats2() {
    const client = new InfluxDBClient({ host: url, token });
    const query = `SELECT * FROM 'repo-admin' WHERE time >= now() - INTERVAL '2h'`;
    const result = await client.query(query, org);

    const rows: any[] = [];

    for await (const row of result) {
      rows.push(row);
    }
    client.close();
    return rows;
  }

  writePoint(duration: number) {
    const writeClient = client.getWriteApi(org, bucket, 'ns');
    const point = new Point('measurement1')
      .tag('tagname1', 'tagvalue1')
      .intField('field1', duration);

    setTimeout(() => {
      writeClient.writePoint(point);
    }, 1000);

    setTimeout(() => {
      writeClient.flush();
    }, 2000);
  }

  @Get('/:id/checkStatus')
  @Render('repos/checkStatus.hbs')
  checkStatus(@Param('id') id: Types.ObjectId) {
    return this.repoService.checkStatusById(id);
  }
}
