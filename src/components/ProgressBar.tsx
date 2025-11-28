import './ProgressBar.css';

interface ProgressBarProps {
  current: number;
  target: number;
  label?: string;
}

export function ProgressBar({ current, target, label }: ProgressBarProps) {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;

  let color = '#FF6B6B'; // Rouge par défaut
  if (percentage >= 80) {
    color = '#2D7D4C'; // Vert
  } else if (percentage >= 50) {
    color = '#FF9800'; // Orange
  }

  return (
    <div className="progress-bar-container">
      {label && <div className="progress-bar-label">{label}</div>}
      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        >
          <span className="progress-bar-percentage">{percentage.toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
}
