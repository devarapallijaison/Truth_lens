const STORAGE_KEY = "truthlens_agreed_claims";

export function getAgreedClaims() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function isClaimAgreed(claimId) {
  if (!claimId) return false;
  return getAgreedClaims().has(claimId.toString());
}

export function saveClaimAgreed(claimId, agreed) {
  try {
    const current = getAgreedClaims();
    if (agreed) {
      current.add(claimId.toString());
    } else {
      current.delete(claimId.toString());
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(current)));
  } catch (error) {
    console.warn("Unable to save reaction to localStorage:", error);
  }
}
