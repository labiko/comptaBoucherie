import './Switch.css';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export function Switch({ checked, onChange, label }: SwitchProps) {
  return (
    <label className="switch-container">
      <span className="switch-label">{label}</span>
      <div className="switch-wrapper">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="switch-input"
        />
        <span className="switch-slider"></span>
      </div>
    </label>
  );
}
