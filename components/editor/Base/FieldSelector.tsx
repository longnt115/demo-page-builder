// Component để hiển thị các option field trong select
export type FieldSelectorProps = {
  fields: string[];
  noUse?: boolean;  
};

export const FieldSelector: React.FC<FieldSelectorProps> = ({ fields, noUse = true }) => (
  <>
    {noUse && <option value="">Không sử dụng</option>}
    {fields.map((field) => (
      <option key={field} value={field}>
        {field}
      </option>
    ))}
  </>
);
