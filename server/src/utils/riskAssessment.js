const SENSATIONAL_PATTERN = /\b(?:breaking|shocking)\b|share\s+before\s+deleted/i;
const SOURCE_URL_PATTERN = /\b(?:https?:\/\/|www\.)[^\s<]+/i;

export function assessClaimRisk(text) {
  const riskFlags = [];

  if (SENSATIONAL_PATTERN.test(text)) {
    riskFlags.push("SENSATIONAL");
  }

  const alphabeticCharacters = text.match(/[A-Za-z]/g) ?? [];
  const uppercaseCharacters = alphabeticCharacters.filter(
    (character) => character === character.toUpperCase(),
  );

  if (
    alphabeticCharacters.length > 0 &&
    uppercaseCharacters.length / alphabeticCharacters.length > 0.5
  ) {
    riskFlags.push("SHOUTING");
  }

  if (!SOURCE_URL_PATTERN.test(text)) {
    riskFlags.push("UNSOURCED");
  }

  return {
    riskFlags,
    riskLevel: riskFlags.length >= 2 ? "HIGH" : riskFlags.length === 1 ? "MEDIUM" : "LOW",
  };
}
