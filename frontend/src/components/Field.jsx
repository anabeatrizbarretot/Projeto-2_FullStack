// Campo de formulário: <input> por padrão ou <select> quando recebe "options".
// options aceita ['A', 'B'] ou [{ value: 1, label: 'A' }].
export default function Field({ label, options, ...props }) {
  const id = props.id || props.name;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {options ? (
        <select id={id} className="input" {...props}>
          {options.map((o) =>
            typeof o === 'string' ? (
              <option key={o} value={o}>{o}</option>
            ) : (
              <option key={o.value} value={o.value}>{o.label}</option>
            )
          )}
        </select>
      ) : (
        <input id={id} className="input" {...props} />
      )}
    </div>
  );
}
