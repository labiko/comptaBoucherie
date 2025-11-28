import './DashboardCard.css';

interface DashboardCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export function DashboardCard({ title, children, className = '', icon }: DashboardCardProps) {
  return (
    <div className={`dashboard-card ${className}`}>
      <div className="dashboard-card-header">
        {icon && <div className="dashboard-card-icon">{icon}</div>}
        <h3 className="dashboard-card-title">{title}</h3>
      </div>
      <div className="dashboard-card-content">
        {children}
      </div>
    </div>
  );
}
