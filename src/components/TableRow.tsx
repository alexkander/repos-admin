export default function TableRow({
  index,
  record,
  fields,
}: {
  index: number;
  record: any;
  fields: { field: string }[];
}) {
  return (
    <tr>
      <td>{index + 1}</td>
      {fields.map((field) => (
        <td key={field.field}>{record[field.field]}</td>
      ))}
      <td className="text-nowrap">
        <a data-app--url={`/repo/${record._id}/syncAll`} data-app--method="POST">
          [sync]
        </a>
        <a href={`/repo/${record._id}/checkStatus`}>[details]</a>
      </td>
    </tr>
  );
}
