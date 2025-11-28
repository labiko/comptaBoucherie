import { getFieldLabel, formatFieldValue } from '../lib/tracabilite';
import './FieldComparison.css';

interface FieldComparisonProps {
  fieldName: string;
  oldValue: any;
  newValue: any;
}

export function FieldComparison({ fieldName, oldValue, newValue }: FieldComparisonProps) {
  const label = getFieldLabel(fieldName);
  const formattedOld = formatFieldValue(fieldName, oldValue);
  const formattedNew = formatFieldValue(fieldName, newValue);

  // Détecter le type de changement
  const isCreation = oldValue === null || oldValue === undefined;
  const isDeletion = newValue === null || newValue === undefined;
  const isModification = !isCreation && !isDeletion;

  return (
    <div className="field-comparison">
      <div className="field-label">{label}</div>
      <div className="field-values">
        {isCreation ? (
          <div className="value-change">
            <span className="value-new creation">{formattedNew}</span>
          </div>
        ) : isDeletion ? (
          <div className="value-change">
            <span className="value-old deletion">{formattedOld}</span>
          </div>
        ) : (
          <div className="value-change">
            <span className="value-old">{formattedOld}</span>
            <svg className="arrow-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="value-new">{formattedNew}</span>
          </div>
        )}
      </div>
    </div>
  );
}
