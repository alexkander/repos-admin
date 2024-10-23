import Datastore from '@seald-io/nedb';
import path from 'path';

const DATA_DIRECTORY = 'data';

export class Repository<Model extends Record<string, any>> {
  constructor(protected readonly db: Datastore) {}

  findAsync(filter: Partial<Model> = {}) {
    return this.db.findAsync<Model>(filter);
  }

  findOneAsync(filter: Partial<Model> = {}) {
    return this.db.findOneAsync<Model>(filter);
  }

  insertAsync(data: Model) {
    return this.db.insertAsync<Model>(data);
  }

  update(id: string, data: Partial<Model>) {
    return this.db.updateAsync({ _id: id }, { $set: data }, {});
  }

  remove(id: string) {
    return this.db.removeAsync({ _id: id }, {});
  }

  static build<T extends Record<string, any>>(ModelClass: new (...args: any[]) => T) {
    const db = new Datastore({
      filename: path.join(process.cwd(), `${DATA_DIRECTORY}/${ModelClass.name}.db`),
      autoload: true,
    });
    return new Repository<T>(db);
  }
}
