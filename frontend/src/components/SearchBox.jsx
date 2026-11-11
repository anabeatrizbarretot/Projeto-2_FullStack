import Icon from './Icon.jsx';

export default function SearchBox({ value, onChange, placeholder }) {
  return (
    <div className="search">
      <Icon name="search" size={18} />
      <input
        className="input"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </div>
  );
}
