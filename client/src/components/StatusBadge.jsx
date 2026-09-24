export const STATUS_CONFIG = {
  UNVERIFIED: {
    label: "Unverified",
    className: "status-badge status-unverified",
    description: "Awaiting human review. Risk flags are triage signals, not a verdict.",
  },
  VERIFIED_TRUE: {
    label: "Verified True",
    className: "status-badge status-verified-true",
    description: "Evaluated by reviewer as factual and supported by credible sources.",
  },
  VERIFIED_FALSE: {
    label: "Verified False",
    className: "status-badge status-verified-false",
    description: "Evaluated by reviewer as demonstrably false, fabricated, or debunked.",
  },
  MISLEADING: {
    label: "Misleading",
    className: "status-badge status-misleading",
    description: "Evaluated by reviewer as lacking essential context or exaggerating facts.",
  },
};

export default function StatusBadge({ status, size = "normal" }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.UNVERIFIED;

  return (
    <span
      className={`${config.className} ${size === "large" ? "status-badge-lg" : ""}`}
      title={config.description}
    >
      {config.label}
    </span>
  );
}
