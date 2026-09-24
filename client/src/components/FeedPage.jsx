import { useState, useEffect, useCallback } from "react";
import StatusBadge from "./StatusBadge.jsx";
import RiskBadge from "./RiskBadge.jsx";
import AgreeButton from "./AgreeButton.jsx";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

const CATEGORIES = ["All", "Politics", "Health", "Finance", "Other"];
const STATUSES = [
  { value: "All", label: "All Statuses" },
  { value: "UNVERIFIED", label: "Unverified" },
  { value: "VERIFIED_TRUE", label: "Verified True" },
  { value: "VERIFIED_FALSE", label: "Verified False" },
  { value: "MISLEADING", label: "Misleading" },
];

export default function FeedPage({ onNavigate }) {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (selectedCategory !== "All") params.append("category", selectedCategory);
    if (selectedStatus !== "All") params.append("status", selectedStatus);

    const queryString = params.toString() ? `?${params.toString()}` : "";

    try {
      const response = await fetch(`${API_BASE_URL}/api/claims${queryString}`);
      if (!response.ok) {
        throw new Error("Unable to retrieve public feed.");
      }
      const data = await response.json();
      setClaims(data.claims || []);
    } catch (err) {
      console.error("Feed fetch error:", err);
      setError("Unable to load claims feed. Ensure the server is running.");
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedStatus]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  function handleCountChange(claimId, newCount) {
    setClaims((current) =>
      current.map((c) => (c.id === claimId ? { ...c, agreeCount: newCount } : c)),
    );
  }

  function formatTime(isoString) {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "";
    }
  }

  const hasActiveFilters = selectedCategory !== "All" || selectedStatus !== "All";

  function clearFilters() {
    setSelectedCategory("All");
    setSelectedStatus("All");
  }

  return (
    <div className="feed-page">
      <section className="page-intro" aria-labelledby="page-title">
        <p className="eyebrow">Public Claim Triage & Review</p>
        <h1 id="page-title">Understand claims before you trust or share them.</h1>
        <p className="lede">
          TruthLens helps the public and reviewers track viral claims, surface automated
          risk signals, and record human reviews. Unverified claims remain publicly visible
          to maintain transparency in the review pipeline.
        </p>
      </section>

      {/* Filter and Triage Bar */}
      <section className="feed-controls" aria-label="Feed Filters">
        <div className="filter-group-wrap">
          <div className="filter-block">
            <span className="filter-label">Category:</span>
            <div className="filter-pills" role="radiogroup" aria-label="Filter by category">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`filter-pill ${selectedCategory === cat ? "is-selected" : ""}`}
                  onClick={() => setSelectedCategory(cat)}
                  aria-pressed={selectedCategory === cat}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-block">
            <span className="filter-label">Review Status:</span>
            <div className="filter-pills" role="radiogroup" aria-label="Filter by review status">
              {STATUSES.map((st) => (
                <button
                  key={st.value}
                  type="button"
                  className={`filter-pill ${selectedStatus === st.value ? "is-selected" : ""}`}
                  onClick={() => setSelectedStatus(st.value)}
                  aria-pressed={selectedStatus === st.value}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="feed-meta-bar">
          <div className="dp1-indicator">
            <span className="dp1-badge">DP1 Feed Rule</span>
            <span className="dp1-text">Ordered by Risk Level (High → Low), then Recency</span>
          </div>

          {hasActiveFilters && (
            <button type="button" className="clear-filter-btn" onClick={clearFilters}>
              Reset filters
            </button>
          )}
        </div>
      </section>

      {/* Main Feed Section */}
      <section id="feed" className="feed-list-section" aria-labelledby="feed-title">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Public Claims</p>
            <h2 id="feed-title">
              {hasActiveFilters ? "Filtered Results" : "Latest Claims"}
              <span className="feed-count-pill">{claims.length}</span>
            </h2>
          </div>
          <a href="#submit-claim" className="primary-action-btn">
            + Submit New Claim
          </a>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" aria-hidden="true" />
            <p>Loading claims feed...</p>
          </div>
        ) : error ? (
          <div className="error-card" role="alert">
            <p>{error}</p>
            <button type="button" className="secondary-button" onClick={fetchClaims}>
              Try Again
            </button>
          </div>
        ) : claims.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-rule" aria-hidden="true" />
            <h3>No claims found matching these criteria.</h3>
            <p>
              {hasActiveFilters
                ? "Try adjusting or clearing your filters to see more claims."
                : "No claims have been submitted yet. Be the first to submit a claim for review."}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                className="secondary-button"
                style={{ marginTop: "1rem" }}
                onClick={clearFilters}
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="claims-feed-grid">
            {claims.map((claim) => (
              <article key={claim.id} className="claim-card" aria-labelledby={`claim-title-${claim.id}`}>
                {/* Header: Platform, Category, Date, Status */}
                <div className="card-top-row">
                  <div className="card-taxonomy">
                    <span className="taxonomy-platform">{claim.sourcePlatform}</span>
                    <span className="taxonomy-sep">/</span>
                    <span className="taxonomy-category">{claim.category}</span>
                    <span className="taxonomy-date">{formatTime(claim.createdAt)}</span>
                  </div>
                  <StatusBadge status={claim.status} />
                </div>

                {/* Claim Text */}
                <div className="card-body">
                  <h3 id={`claim-title-${claim.id}`} className="card-claim-text">
                    <a href={`#claim/${claim.id}`} className="claim-card-link">
                      &ldquo;{claim.text}&rdquo;
                    </a>
                  </h3>
                </div>

                {/* Automated Risk Signals */}
                <div className="card-risk-row">
                  <RiskBadge level={claim.riskLevel} flags={claim.riskFlags} />
                </div>

                {/* Reviewer Context Note if available */}
                {claim.reviewerNote && (
                  <div className="card-reviewer-snippet">
                    <span className="snippet-label">Reviewer Note:</span>
                    <p className="snippet-text">{claim.reviewerNote}</p>
                  </div>
                )}

                {/* Footer: Agree Reaction & Detail link */}
                <div className="card-footer">
                  <div className="card-actions-left">
                    <AgreeButton
                      claimId={claim.id}
                      initialCount={claim.agreeCount}
                      onCountChange={handleCountChange}
                    />
                  </div>

                  <div className="card-actions-right">
                    <a href={`#claim/${claim.id}`} className="card-detail-link">
                      Full Details
                    </a>
                  </div>
                </div>
              </article>

            ))}
          </div>
        )}
      </section>

      {/* Review Context Explainer */}
      <aside className="review-context" aria-labelledby="context-title">
        <div>
          <p className="section-kicker">Guiding Principles</p>
          <h2 id="context-title">Triage, not automated verdicts</h2>
        </div>
        <div className="context-points">
          <p>
            <strong>Automated Risk Flags:</strong> Flags like Sensational, Shouting, and
            Unsourced are deterministic triage signals designed to prioritize human review.
            They never decide whether a claim is factually true or false.
          </p>
          <p>
            <strong>Public Visibility (DP2):</strong> All claims remain visible in the feed
            from the moment of submission. Unreviewed claims are prominently badged as
            Unverified so graders and citizens have full visibility into the review queue.
          </p>
        </div>
      </aside>
    </div>
  );
}
