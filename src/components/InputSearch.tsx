export default function InputSearch({ field }: { field: string; value: string }) {
  return (
    <div>
      <input type="text" aria-label={`field ${field}`} title={`field ${field}`} name={field} />
      <button type="button">
        <i></i>
      </button>
    </div>
  );
}
