export default function RecordsCountLabel({
  totalCount,
  records,
}: {
  totalCount: number;
  records: unknown[];
}) {
  return (
    <div className="text-end">
      {records.length === totalCount ? (
        <i>{totalCount} records</i>
      ) : (
        <i>
          {records.length} of {totalCount} records
        </i>
      )}
    </div>
  );
}
