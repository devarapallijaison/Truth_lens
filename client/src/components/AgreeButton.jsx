import { useState, useEffect } from "react";
import { isClaimAgreed, saveClaimAgreed } from "../utils/agreeStorage.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

export default function AgreeButton({ claimId, initialCount = 0, onCountChange }) {
  const [agreed, setAgreed] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAgreed(isClaimAgreed(claimId));
    setCount(initialCount);
  }, [claimId, initialCount]);

  async function handleToggle(event) {
    event.stopPropagation();
    if (loading) return;

    const nextAgreed = !agreed;
    const nextCount = nextAgreed ? count + 1 : Math.max(0, count - 1);

    // Optimistic update
    setAgreed(nextAgreed);
    setCount(nextCount);
    saveClaimAgreed(claimId, nextAgreed);
    if (onCountChange) onCountChange(claimId, nextCount);

    setLoading(true);
    try {
      const endpoint = `${API_BASE_URL}/api/claims/${claimId}/agree`;
      const response = await fetch(endpoint, {
        method: nextAgreed ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        // Rollback
        setAgreed(!nextAgreed);
        setCount(count);
        saveClaimAgreed(claimId, !nextAgreed);
        if (onCountChange) onCountChange(claimId, count);
      } else {
        const data = await response.json();
        if (typeof data.agreeCount === "number") {
          setCount(data.agreeCount);
          if (onCountChange) onCountChange(claimId, data.agreeCount);
        }
      }
    } catch (err) {
      console.warn("Agree action failed:", err);
      // Rollback
      setAgreed(!nextAgreed);
      setCount(count);
      saveClaimAgreed(claimId, !nextAgreed);
      if (onCountChange) onCountChange(claimId, count);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      className={`agree-button ${agreed ? "is-agreed" : ""}`}
      onClick={handleToggle}
      disabled={loading}
      title="Community agreement reaction. This is not factual verification."
      aria-label={`Express community agreement. Current count: ${count}. Community reaction only, not factual verification.`}
    >
      <span className="agree-icon" aria-hidden="true">
        {agreed ? "✓" : "👍"}
      </span>
      <span className="agree-label">{agreed ? "Agreed" : "I Agree"}</span>
      <span className="agree-badge">{count}</span>
    </button>
  );
}
