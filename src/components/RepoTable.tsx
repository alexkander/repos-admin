import { FC } from 'react';

import InputSearch from './InputSearch';
import LabelSortBy from './LabelSortBy';
import RecordsCountLabel from './RecordsCountLabel';
import TableRow from './TableRow';

const fields = [
  { field: 'directory', text: 'directory' },
  { field: 'group', text: 'group' },
  { field: 'localName', text: 'name' },
  { field: 'valid', text: 'is valid' },
  { field: 'remotes', text: 'remotes' },
  { field: 'branches', text: 'branches' },
  { field: 'branchesToCheck', text: 'branchesToCheck' },
];

type RepoTableProps = {
  records: { _id: string }[];
};

const RepoTable: FC<RepoTableProps> = ({ records }) => {
  return (
    <div className="container mx-auto">
      <div>
        <div className="columns-6">
          <button>Sync repos</button>
          <button>Sync repos, remotes and branches</button>
        </div>
        <div className="columns-6">
          <RecordsCountLabel totalCount={records.length} records={records} />
        </div>
      </div>
      <table className="border-collapse border">
        <thead>
          <tr>
            <th>#</th>
            {fields.map((field) => (
              <th key={field.field}>
                <LabelSortBy field={field.field} value={'asc'} allowSort={true}>
                  {field.text}
                </LabelSortBy>
              </th>
            ))}
            <th></th>
          </tr>
          <tr>
            <td></td>
            {fields.map((field) => (
              <td key={field.field}>
                <InputSearch field={field.field} value="" />
              </td>
            ))}
            <td></td>
          </tr>
        </thead>
        <tbody>
          {records.map((record, index) => (
            <TableRow key={record._id} index={index} record={record} fields={fields} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RepoTable;
