// Component để hiển thị các option field trong select
export const FieldSelector: React.FC<{
  fields: string[];
}> = ({ fields }) => (
  <>
    <option value="">Không sử dụng</option>
    {fields.map((field) => (
      <option key={field} value={field}>
        {field}
      </option>
    ))}
  </>
);
