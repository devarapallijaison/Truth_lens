export const RISK_FLAG_LABELS = {
  SENSATIONAL: "Sensational",
  SHOUTING: "Shouting",
  UNSOURCED: "Unsourced",
};

export const RISK_LEVEL_CONFIG = {
  HIGH: {
    label: "High Risk",
    className: "risk-level-badge risk-high",
    description: "2 or more warning signals detected. Prioritized for triage.",
  },
  MEDIUM: {
    label: "Medium Risk",
    className: "risk-level-badge risk-medium",
    description: "1 warning signal detected.",
  },
  LOW: {
    label: "Low Risk",
    className: "risk-level-badge risk-low",
    description: "No immediate warning signals detected.",
  },
};

export default function RiskBadge({ level, flags = [], showFlags = true }) {
  const levelConfig = RISK_LEVEL_CONFIG[level] || RISK_LEVEL_CONFIG.LOW;

  return (
    <div className="risk-indicator-group">
      <span className={levelConfig.className} title={levelConfig.description}>
        {levelConfig.label}
      </span>
      {showFlags && flags.length > 0 && (
        <div className="risk-tags">
          {flags.map((flag) => (
            <span key={flag} className="risk-tag">
              {RISK_FLAG_LABELS[flag] || flag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
