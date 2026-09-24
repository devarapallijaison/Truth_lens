import { useState, useEffect } from "react";
import StatusBadge from "./StatusBadge.jsx";
import RiskBadge from "./RiskBadge.jsx";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

const REVIEW_VERDICTS = [
  {
    status: "VERIFIED_TRUE",
    label: "Verified True",
    description: "Factual claim supported by verifiable evidence and credible documentation.",
    badgeClass: "status-verified-true",
  },
  {
    status: "VERIFIED_FALSE",
    label: "Verified False",
    description: "Inaccurate, fabricated, or demonstrably untrue assertion.",
    badgeClass: "status-verified-false",
  },
  {
    status: "MISLEADING",
    label: "Misleading",
    description: "Partially true but missing critical context, exaggerated, or manipulated.",
    badgeClass: "status-misleading",
  },
  {
    status: "UNVERIFIED",
    label: "Keep Unverified",
    description: "Insufficient evidence to conclude; pending further investigation.",
    badgeClass: "status-unverified",
  },
];

export default function ReviewerPage({ initialClaimId }) {
  const [claims, setClaims] = useState([]);
  const [selectedClaimId, setSelectedClaimId] = useState(initialClaimId || null);
  const [statusFilter, setStatusFilter] = useState("UNVERIFIED");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Review Form state
  const [selectedVerdict, setSelectedVerdict] = useState("");
  const [reviewerNote, setReviewerNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [formError, setFormError] = useState("");

  async function loadClaims() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/claims`);
      if (!response.ok) throw new Error("Could not fetch claims queue.");
      const data = await response.json();
      const allClaims = data.claims || [];
      setClaims(allClaims);

      if (initialClaimId) {
        setSelectedClaimId(initialClaimId);
      } else if (!selectedClaimId && allClaims.length > 0) {
        // Default to first unreviewed claim if available, else first claim
        const unreviewed = allClaims.find((c) => c.status === "UNVERIFIED");
        setSelectedClaimId(unreviewed ? unreviewed.id : allClaims[0].id);
      }
    } catch (err) {
      console.error("Queue fetch error:", err);
      setError("Unable to load claims for review. Please check server connection.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClaims();
  }, []);

  const selectedClaim = claims.find((c) => c.id === selectedClaimId);

  useEffect(() => {
    if (selectedClaim) {
      setSelectedVerdict(selectedClaim.status || "VERIFIED_TRUE");
      setReviewerNote(selectedClaim.reviewerNote || "");
      setSuccessMessage("");
      setFormError("");
    }
  }, [selectedClaimId, selectedClaim]);

  async function handleSubmitReview(event) {
    event.preventDefault();
    if (!selectedClaimId || !selectedVerdict) return;

    if (!reviewerNote.trim() && selectedVerdict !== "UNVERIFIED") {
      setFormError("Please enter a short review note explaining your verification decision.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    setSuccessMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/claims/${selectedClaimId}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: selectedVerdict,
          reviewerNote: reviewerNote.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to submit review.");
      }

      // Update in-memory list
      setClaims((prev) =>
        prev.map((c) => (c.id === selectedClaimId ? data.claim : c)),
      );

      setSuccessMessage(
        `Review recorded successfully as "${REVIEW_VERDICTS.find((v) => v.status === selectedVerdict)?.label}". Public feed and claim details are updated.`,
      );
    } catch (err) {
      setFormError(err.message || "An error occurred while saving your review.");
    } finally {
      setSubmitting(false);
    }
  }

  const filteredQueue = claims.filter((c) => {
    if (statusFilter === "ALL") return true;
    if (statusFilter === "UNVERIFIED") return c.status === "UNVERIFIED";
    if (statusFilter === "REVIEWED") return c.status !== "UNVERIFIED";
    return true;
  });

  return (
    <div className="reviewer-page">
      <section className="page-intro compact-intro" aria-labelledby="reviewer-title">
        <p className="eyebrow">Reviewer Workspace</p>
        <h1 id="reviewer-title">Misinformation Review Queue</h1>
        <p className="lede">
          Evaluate submitted claims, inspect deterministic risk indicators, and record human
          verification verdicts. TruthLens preserves the original submitted claim without modification (DP3).
        </p>
      </section>

      {/* Role Notice */}
      <div className="reviewer-role-banner">
        <div className="role-badge">Reviewer Role</div>
        <p>
          <strong>Notice:</strong> As a reviewer, you decide the verification status. TruthLens&apos;s
          automated risk flags are triage signals only and do not establish truth.
        </p>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner" aria-hidden="true" />
          <p>Loading review queue...</p>
        </div>
      ) : error ? (
        <div className="error-card">
          <p>{error}</p>
          <button type="button" className="secondary-button" onClick={loadClaims}>
            Retry
          </button>
        </div>
      ) : (
        <div className="reviewer-workspace-layout">
          {/* Left: Queue Sidebar */}
          <aside className="queue-sidebar" aria-label="Claims awaiting review">
            <div className="queue-header">
              <h3>Claim Queue</h3>
              <div className="queue-filter-select">
                <button
                  type="button"
                  className={`queue-filter-tab ${statusFilter === "UNVERIFIED" ? "is-active" : ""}`}
                  onClick={() => setStatusFilter("UNVERIFIED")}
                >
                  Unreviewed ({claims.filter((c) => c.status === "UNVERIFIED").length})
                </button>
                <button
                  type="button"
                  className={`queue-filter-tab ${statusFilter === "REVIEWED" ? "is-active" : ""}`}
                  onClick={() => setStatusFilter("REVIEWED")}
                >
                  Reviewed ({claims.filter((c) => c.status !== "UNVERIFIED").length})
                </button>
                <button
                  type="button"
                  className={`queue-filter-tab ${statusFilter === "ALL" ? "is-active" : ""}`}
                  onClick={() => setStatusFilter("ALL")}
                >
                  All ({claims.length})
                </button>
              </div>
            </div>

            <div className="queue-list" role="listbox" aria-label="Select claim to review">
              {filteredQueue.length === 0 ? (
                <div className="queue-empty-msg">No claims in this category.</div>
              ) : (
                filteredQueue.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`queue-item ${item.id === selectedClaimId ? "is-selected" : ""}`}
                    onClick={() => setSelectedClaimId(item.id)}
                    aria-selected={item.id === selectedClaimId}
                  >
                    <div className="queue-item-meta">
                      <span className="queue-item-platform">{item.sourcePlatform}</span>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="queue-item-text">{item.text}</p>
                    <div className="queue-item-sub">
                      <span className={`queue-risk-pill risk-${item.riskLevel.toLowerCase()}`}>
                        {item.riskLevel} Risk
                      </span>
                      <span className="queue-item-cat">{item.category}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </aside>

          {/* Right: Review Workspace Pane */}
          <main className="review-action-pane">
            {selectedClaim ? (
              <div className="review-card">
                {/* Header with status */}
                <div className="review-card-header">
                  <div>
                    <span className="eyebrow">Claim Under Review</span>
                    <h2>Triage & Verdict</h2>
                  </div>
                  <StatusBadge status={selectedClaim.status} size="large" />
                </div>

                {/* Immutable Claim Quote */}
                <div className="review-claim-box">
                  <p className="review-claim-text">&ldquo;{selectedClaim.text}&rdquo;</p>
                  <div className="review-claim-taxonomy">
                    <span>Platform: <strong>{selectedClaim.sourcePlatform}</strong></span>
                    <span className="dot-sep">&bull;</span>
                    <span>Category: <strong>{selectedClaim.category}</strong></span>
                    <span className="dot-sep">&bull;</span>
                    <span>Submitted: {new Date(selectedClaim.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Risk Indicators */}
                <div className="review-signals-summary">
                  <span className="signals-title">Automated Triage Signals (Reference):</span>
                  <RiskBadge level={selectedClaim.riskLevel} flags={selectedClaim.riskFlags} />
                </div>

                {/* Success alert */}
                {successMessage && (
                  <div className="review-success-banner" role="status">
                    <p>{successMessage}</p>
                    <div className="success-banner-links">
                      <a href={`#claim/${selectedClaim.id}`} className="view-detail-link">
                        View Claim Detail &rarr;
                      </a>
                      <a href="#feed" className="view-feed-link">
                        View in Public Feed &rarr;
                      </a>
                    </div>
                  </div>
                )}

                {/* Error alert */}
                {formError && (
                  <div className="field-error submission-error" role="alert">
                    {formError}
                  </div>
                )}

                {/* Review Form */}
                <form className="verdict-form" onSubmit={handleSubmitReview}>
                  <div className="verdict-selection-group">
                    <label className="verdict-group-label" htmlFor="verdict-options">
                      Assign Verification Decision:
                    </label>
                    <div id="verdict-options" className="verdict-options-grid">
                      {REVIEW_VERDICTS.map((v) => (
                        <label
                          key={v.status}
                          className={`verdict-option-card ${selectedVerdict === v.status ? "is-selected" : ""}`}
                        >
                          <input
                            type="radio"
                            name="verdict"
                            value={v.status}
                            checked={selectedVerdict === v.status}
                            onChange={() => setSelectedVerdict(v.status)}
                            className="sr-only"
                          />
                          <div className="verdict-option-header">
                            <span className={`status-badge ${v.badgeClass}`}>{v.label}</span>
                          </div>
                          <p className="verdict-desc">{v.description}</p>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="form-field" style={{ marginTop: "1.75rem" }}>
                    <label htmlFor="reviewer-note">
                      Reviewer Context / Evidence Note:
                    </label>
                    <textarea
                      id="reviewer-note"
                      rows="4"
                      value={reviewerNote}
                      onChange={(e) => setReviewerNote(e.target.value)}
                      maxLength="1000"
                      placeholder="Explain your finding with source context (e.g. 'Debunked by public health registry report', 'Verified against primary transcript', etc.)..."
                      required={selectedVerdict !== "UNVERIFIED"}
                    />
                    <div className="field-meta">
                      <span>Provide clear context for the public.</span>
                      <span>{reviewerNote.length}/1000</span>
                    </div>
                  </div>

                  <div className="form-actions" style={{ marginTop: "1.5rem" }}>
                    <button
                      type="submit"
                      className="primary-button"
                      disabled={submitting}
                    >
                      {submitting ? "Saving Review..." : "Record Verification Verdict"}
                    </button>
                    <a
                      href={`#claim/${selectedClaim.id}`}
                      className="secondary-button"
                      style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}
                    >
                      Inspect Claim Details
                    </a>
                  </div>
                </form>
              </div>
            ) : (
              <div className="empty-state">
                <h3>Select a claim from the queue</h3>
                <p>Choose an unreviewed or reviewed claim from the left sidebar to inspect and verify.</p>
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
