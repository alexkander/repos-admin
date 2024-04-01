import { Injectable } from '@nestjs/common';
import { GroupRepository } from '../repositories/group.repository';
import { RemoteRepository } from '../repositories/remote.repository';
import { Group } from '../schemas/group.schema';

@Injectable()
export class GroupService {
  constructor(
    private readonly groupRepository: GroupRepository,
    private readonly remoteRepository: RemoteRepository,
  ) { }

  list() {
    return this.groupRepository.find();
  }

  async listGroupsFromRemotes() {
    const remotes = await this.remoteRepository.find();
    const groups = remotes.reduce<Record<string, Group>>((acc, remote) => {
      const key = `${remote.targetHost}/${remote.targetGroup}`;
      return {
        ...acc,
        [key]: {
          host: remote.targetHost,
          group: remote.targetGroup,
        },
      };
    }, {});
    return Object.values(groups);
  }

  async saveGroupsFromRemote() {
    await this.groupRepository.deleteMany();
    const localRepos = await this.listGroupsFromRemotes();
    const createPromises = localRepos.map((record) => {
      return this.groupRepository.create(record);
    });
    const records = Promise.all(createPromises);
    return records;
  }
}
