import { useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

const INITIAL_FORM = {
  text: "",
  sourcePlatform: "",
  category: "",
};

const RISK_FLAG_LABELS = {
  SENSATIONAL: "Sensational",
  SHOUTING: "Shouting",
  UNSOURCED: "Unsourced",
};

function validateForm(values) {
  const errors = {};

  if (!values.text.trim()) {
    errors.text = "Enter the claim you want reviewed.";
  } else if (values.text.trim().length > 2000) {
    errors.text = "Claim text must be 2,000 characters or fewer.";
  }

  if (!values.sourcePlatform) {
    errors.sourcePlatform = "Select the platform where you saw this claim.";
  }

  if (!values.category) {
    errors.category = "Select the category that best fits this claim.";
  }

  return errors;
}

function SubmitClaimPage() {
  const [formValues, setFormValues] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submissionError, setSubmissionError] = useState("");
  const [submittedClaim, setSubmittedClaim] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;

    setFormValues((currentValues) => ({ ...currentValues, [name]: value }));
    setErrors((currentErrors) => ({ ...currentErrors, [name]: undefined }));
    setSubmissionError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validateForm(formValues);
    setErrors(nextErrors);
    setSubmissionError("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/claims`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formValues),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrors(payload.errors ?? {});
        setSubmissionError(payload.error ?? "Unable to submit the claim. Please try again.");
        return;
      }

      setSubmittedClaim(payload.claim);
    } catch {
      setSubmissionError(
        "We could not reach TruthLens. Check that the API server is running and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function startAnotherSubmission() {
    setFormValues(INITIAL_FORM);
    setErrors({});
    setSubmissionError("");
    setSubmittedClaim(null);
  }

  if (submittedClaim) {
    return (
      <section className="submission-page" aria-labelledby="submission-success-title">
        <div className="page-intro compact-intro">
          <p className="eyebrow">Submission recorded</p>
          <h1 id="submission-success-title">Claim submitted successfully.</h1>
          <p className="lede">
            This claim is now marked <strong>Unverified</strong> and awaits human
            review.
          </p>
        </div>

        <section className="claim-confirmation" aria-label="Submitted claim summary">
          <div className="confirmation-heading">
            <p className="section-kicker">Submitted claim</p>
            <span className="status-badge status-unverified">Unverified</span>
          </div>
          <p className="claim-text">{submittedClaim.text}</p>

          <dl className="claim-details">
            <div>
              <dt>Source platform</dt>
              <dd>{submittedClaim.sourcePlatform}</dd>
            </div>
            <div>
              <dt>Category</dt>
              <dd>{submittedClaim.category}</dd>
            </div>
            <div>
              <dt>Risk level</dt>
              <dd>{submittedClaim.riskLevel}</dd>
            </div>
            <div>
              <dt>Review status</dt>
              <dd>Unverified</dd>
            </div>
          </dl>

          <div className="risk-summary">
            <p className="risk-label">Detected risk flags</p>
            <div className="risk-flags">
              {submittedClaim.riskFlags.length > 0 ? (
                submittedClaim.riskFlags.map((flag) => (
                  <span className="risk-flag" key={flag}>
                    {RISK_FLAG_LABELS[flag]}
                  </span>
                ))
              ) : (
                <span className="no-risk-flags">No automated risk flags detected</span>
              )}
            </div>
            <p className="risk-disclaimer">
              Risk flags are review-priority indicators, not a decision about
              whether this claim is true or false.
            </p>
          </div>
        </section>

        <div className="confirmation-actions" style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "1.5rem" }}>
          <button className="primary-button" type="button" onClick={startAnotherSubmission}>
            Submit another claim
          </button>
          <a
            href={`#claim/${submittedClaim.id}`}
            className="secondary-button"
            style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}
          >
            View Claim Details &rarr;
          </a>
          <a
            href="#feed"
            className="secondary-button"
            style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}
          >
            View in Public Feed
          </a>
        </div>
      </section>
    );
  }


  return (
    <section className="submission-page" aria-labelledby="submit-claim-title">
      <div className="page-intro compact-intro">
        <p className="eyebrow">Public submission</p>
        <h1 id="submit-claim-title">Submit a claim for review.</h1>
        <p className="lede">
          Share the claim as you encountered it. New submissions remain
          Unverified until a human reviewer records a decision.
        </p>
      </div>

      <form className="claim-form" noValidate onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="claim-text">Claim text</label>
          <textarea
            id="claim-text"
            name="text"
            value={formValues.text}
            onChange={updateField}
            aria-invalid={Boolean(errors.text)}
            aria-describedby="claim-text-help claim-text-error"
            maxLength="2000"
            rows="7"
            placeholder="Enter the claim as you saw or heard it..."
          />
          <div className="field-meta">
            <p id="claim-text-help">
              Include a source link in the claim text when one is available.
            </p>
            <span>{formValues.text.length}/2000</span>
          </div>
          {errors.text ? (
            <p className="field-error" id="claim-text-error" role="alert">
              {errors.text}
            </p>
          ) : null}
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="source-platform">Source platform</label>
            <select
              id="source-platform"
              name="sourcePlatform"
              value={formValues.sourcePlatform}
              onChange={updateField}
              aria-invalid={Boolean(errors.sourcePlatform)}
              aria-describedby="source-platform-error"
            >
              <option value="">Select a platform</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="X">X</option>
              <option value="Instagram">Instagram</option>
              <option value="Other">Other</option>
            </select>
            {errors.sourcePlatform ? (
              <p className="field-error" id="source-platform-error" role="alert">
                {errors.sourcePlatform}
              </p>
            ) : null}
          </div>

          <div className="form-field">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={formValues.category}
              onChange={updateField}
              aria-invalid={Boolean(errors.category)}
              aria-describedby="category-error"
            >
              <option value="">Select a category</option>
              <option value="Politics">Politics</option>
              <option value="Health">Health</option>
              <option value="Finance">Finance</option>
              <option value="Other">Other</option>
            </select>
            {errors.category ? (
              <p className="field-error" id="category-error" role="alert">
                {errors.category}
              </p>
            ) : null}
          </div>
        </div>

        {submissionError ? (
          <p className="submission-error" role="alert">
            {submissionError}
          </p>
        ) : null}

        <div className="form-actions">
          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting claim..." : "Submit claim"}
          </button>
          <p>
            Risk signals support review prioritization. They are not factual
            verdicts.
          </p>
        </div>
      </form>
    </section>
  );
}

export default SubmitClaimPage;
