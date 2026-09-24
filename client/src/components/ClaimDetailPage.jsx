import { useState, useEffect } from "react";
import StatusBadge from "./StatusBadge.jsx";
import RiskBadge, { RISK_FLAG_LABELS } from "./RiskBadge.jsx";
import AgreeButton from "./AgreeButton.jsx";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

const RISK_FLAG_DESCRIPTIONS = {
  SENSATIONAL: "Contains high-urgency or alarmist phrasing (e.g. 'breaking', 'shocking', 'share before deleted').",
  SHOUTING: "More than 50% uppercase alphabetic characters, indicating an aggressive or shouting presentation.",
  UNSOURCED: "Does not contain a verifiable URL link to an original reporting source.",
};

export default function ClaimDetailPage({ claimId }) {
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchClaim() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/api/claims/${claimId}`);
        if (!response.ok) {
          throw new Error("Claim not found or API unavailable.");
        }
        const data = await response.json();
        setClaim(data.claim);
      } catch (err) {
        console.error("Detail fetch error:", err);
        setError("Unable to find this claim. It may have been removed or the ID is invalid.");
      } finally {
        setLoading(false);
      }
    }

    if (claimId) {
      fetchClaim();
    }
  }, [claimId]);

  function formatDateTime(isoString) {
    if (!isoString) return "N/A";
    try {
      const date = new Date(isoString);
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  }

  function handleCountChange(_id, newCount) {
    setClaim((current) => (current ? { ...current, agreeCount: newCount } : null));
  }

  if (loading) {
    return (
      <div className="detail-loading-state">
        <a href="#feed" className="back-link">&larr; Back to Public Feed</a>
        <div className="loading-spinner" aria-hidden="true" style={{ marginTop: "2rem" }} />
        <p>Loading claim details...</p>
      </div>
    );
  }

  if (error || !claim) {
    return (
      <div className="detail-error-state">
        <a href="#feed" className="back-link">&larr; Back to Public Feed</a>
        <div className="error-card" style={{ marginTop: "2rem" }}>
          <h2>Claim Not Found</h2>
          <p>{error || "The requested claim does not exist."}</p>
          <a href="#feed" className="secondary-button" style={{ display: "inline-block", marginTop: "1rem" }}>
            Return to Feed
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="claim-detail-page">
      <nav className="detail-nav-bar" aria-label="Breadcrumb navigation">
        <a href="#feed" className="back-link">&larr; Back to Public Feed</a>
        <span className="detail-claim-id">ID: {claim.id}</span>
      </nav>

      <section className="detail-header-section">
        <div className="detail-status-strip">
          <StatusBadge status={claim.status} size="large" />
          <div className="detail-platform-tag">
            <span>Platform: <strong>{claim.sourcePlatform}</strong></span>
            <span className="dot-sep">&bull;</span>
            <span>Category: <strong>{claim.category}</strong></span>
          </div>
        </div>

        <blockquote className="detail-claim-quote">
          &ldquo;{claim.text}&rdquo;
        </blockquote>

        <p className="immutable-notice">
          <strong>DP3 Immutability:</strong> The submitted claim text cannot be modified after submission.
        </p>
      </section>

      {/* Grid of metadata, risk analysis, and review outcome */}
      <div className="detail-content-grid">
        {/* Left Column: Review Outcome and Community reaction */}
        <section className="detail-card review-outcome-card">
          <div className="card-header-line">
            <h2 className="detail-subhead">Verification Review</h2>
            <span className="review-time-stamp">
              {claim.reviewedAt ? `Reviewed ${formatDateTime(claim.reviewedAt)}` : "Pending Review"}
            </span>
          </div>

          <div className="review-body-block">
            {claim.status === "UNVERIFIED" ? (
              <div className="unreviewed-banner">
                <p className="unreviewed-text">
                  This claim has not been evaluated by a reviewer yet. Automated triage signals indicate review priority. Official classification and context notes will appear here once recorded by a reviewer.
                </p>
              </div>
            ) : (

              <div className="reviewed-content">
                <div className="verdict-summary">
                  <span className="verdict-label">Assigned Status:</span>
                  <StatusBadge status={claim.status} />
                </div>

                <div className="reviewer-note-box">
                  <span className="note-title">Reviewer Context & Evidence:</span>
                  <p className="note-body">{claim.reviewerNote || "No explanatory note provided."}</p>
                </div>
              </div>
            )}
          </div>

          {/* Community Reaction Section */}
          <div className="detail-reaction-section">
            <div className="reaction-header">
              <h3>Community Agreement</h3>
              <p className="reaction-disclaimer-text">
                Community reaction expresses public sentiment. It is NOT factual confirmation or evidence.
              </p>
            </div>
            <div className="reaction-action-row">
              <AgreeButton
                claimId={claim.id}
                initialCount={claim.agreeCount}
                onCountChange={handleCountChange}
              />
              <span className="reaction-stat">
                {claim.agreeCount} {claim.agreeCount === 1 ? "person agrees" : "people agree"}
              </span>
            </div>
          </div>
        </section>

        {/* Right Column: Automated Risk Signals & Triage breakdown */}
        <section className="detail-card risk-triage-card">
          <div className="card-header-line">
            <h2 className="detail-subhead">Automated Risk Signals</h2>
            <RiskBadge level={claim.riskLevel} flags={claim.riskFlags} showFlags={false} />
          </div>

          <p className="risk-lead-text">
            Risk signals are deterministic warnings calculated from formatting and language patterns to prioritize triage. They do not constitute a factual verdict.
          </p>

          <div className="detected-flags-list">
            <h4>Signal Analysis:</h4>
            {claim.riskFlags && claim.riskFlags.length > 0 ? (
              <ul className="signals-breakdown">
                {claim.riskFlags.map((flag) => (
                  <li key={flag} className="signal-item">
                    <span className="signal-badge">{RISK_FLAG_LABELS[flag] || flag}</span>
                    <span className="signal-description">
                      {RISK_FLAG_DESCRIPTIONS[flag] || "Flag detected by automated triage pattern."}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-flags-notice">
                No automated risk flags detected. (Low risk triage priority).
              </p>
            )}
          </div>

          <div className="audit-timeline">
            <h4>Timeline Audit:</h4>
            <dl className="audit-list">
              <div>
                <dt>Submitted At:</dt>
                <dd>{formatDateTime(claim.createdAt)}</dd>
              </div>
              <div>
                <dt>Reviewed At:</dt>
                <dd>{claim.reviewedAt ? formatDateTime(claim.reviewedAt) : "Awaiting review"}</dd>
              </div>
            </dl>
          </div>
        </section>
      </div>
    </div>
  );
}
