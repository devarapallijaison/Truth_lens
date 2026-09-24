import Claim from "../models/Claim.js";
import { getDatabaseStatus } from "../config/database.js";

const initialSeedClaims = [
  {
    id: "seed-claim-1",
    _id: "seed-claim-1",
    text: "BREAKING: SECRET EMERGENCY DIRECTIVE FORCES EVERY CITIZEN TO SURRENDER BANK ACCOUNTS BEFORE MIDNIGHT! SHARE BEFORE DELETED!",
    sourcePlatform: "WhatsApp",
    category: "Finance",
    riskFlags: ["SENSATIONAL", "SHOUTING", "UNSOURCED"],
    riskLevel: "HIGH",
    status: "UNVERIFIED",
    reviewerNote: null,
    reviewedAt: null,
    agreeCount: 14,
    createdAt: new Date(Date.now() - 3600 * 1000 * 2), // 2 hours ago
  },
  {
    id: "seed-claim-2",
    _id: "seed-claim-2",
    text: "SHOCKING NEW CURE DISCOVERED: Drinking concentrated salt water eliminates all viral infections within 10 minutes according to top scientists.",
    sourcePlatform: "WhatsApp",
    category: "Health",
    riskFlags: ["SENSATIONAL", "UNSOURCED"],
    riskLevel: "HIGH",
    status: "VERIFIED_FALSE",
    reviewerNote: "Medical consensus and public health bodies warn that excessive salt water ingestion causes acute dehydration and sodium toxicity with zero antiviral efficacy.",
    reviewedAt: new Date(Date.now() - 3600 * 1000 * 5),
    agreeCount: 38,
    createdAt: new Date(Date.now() - 3600 * 1000 * 6),
  },
  {
    id: "seed-claim-3",
    _id: "seed-claim-3",
    text: "World Health Organization publishes updated nutrition guidance for school lunch programs at https://who.int/news/nutrition-guidelines",
    sourcePlatform: "X",
    category: "Health",
    riskFlags: [],
    riskLevel: "LOW",
    status: "VERIFIED_TRUE",
    reviewerNote: "Verified against the official publication portal and press release dated this week.",
    reviewedAt: new Date(Date.now() - 3600 * 1000 * 12),
    agreeCount: 19,
    createdAt: new Date(Date.now() - 3600 * 1000 * 14),
  },
  {
    id: "seed-claim-4",
    _id: "seed-claim-4",
    text: "Government announces tax rebates for all electric vehicle purchases starting next month.",
    sourcePlatform: "Instagram",
    category: "Politics",
    riskFlags: ["UNSOURCED"],
    riskLevel: "MEDIUM",
    status: "MISLEADING",
    reviewerNote: "The subsidy proposal applies exclusively to fleet operators and commercial transport, not general private vehicle purchases.",
    reviewedAt: new Date(Date.now() - 3600 * 1000 * 20),
    agreeCount: 7,
    createdAt: new Date(Date.now() - 3600 * 1000 * 24),
  },
  {
    id: "seed-claim-5",
    _id: "seed-claim-5",
    text: "URGENT VENDOR ADVISORY: Cloud service outage reported across regional data centers affecting payment gateways.",
    sourcePlatform: "Other",
    category: "Finance",
    riskFlags: ["SHOUTING", "UNSOURCED"],
    riskLevel: "HIGH",
    status: "UNVERIFIED",
    reviewerNote: null,
    reviewedAt: null,
    agreeCount: 5,
    createdAt: new Date(Date.now() - 3600 * 1000 * 1), // 1 hour ago
  },
];

let memoryClaims = [...initialSeedClaims];

const RISK_WEIGHTS = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

function sortClaimsDP1(claims) {
  return [...claims].sort((a, b) => {
    const weightA = RISK_WEIGHTS[a.riskLevel] ?? 0;
    const weightB = RISK_WEIGHTS[b.riskLevel] ?? 0;
    if (weightB !== weightA) {
      return weightB - weightA; // higher risk first
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // newer first
  });
}

export function serializeClaim(claim) {
  return {
    id: (claim.id || claim._id)?.toString(),
    text: claim.text,
    sourcePlatform: claim.sourcePlatform,
    category: claim.category,
    riskFlags: claim.riskFlags || [],
    riskLevel: claim.riskLevel || "LOW",
    status: claim.status || "UNVERIFIED",
    reviewerNote: claim.reviewerNote || null,
    reviewedAt: claim.reviewedAt || null,
    agreeCount: typeof claim.agreeCount === "number" ? claim.agreeCount : 0,
    createdAt: claim.createdAt || new Date(),
  };
}

export async function createClaim(claimData) {
  if (getDatabaseStatus() === "connected") {
    const created = await Claim.create(claimData);
    return serializeClaim(created);
  }

  const id = `claim-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const newClaim = {
    id,
    _id: id,
    ...claimData,
    status: "UNVERIFIED",
    reviewerNote: null,
    reviewedAt: null,
    agreeCount: 0,
    createdAt: new Date(),
  };

  memoryClaims.unshift(newClaim);
  return serializeClaim(newClaim);
}

export async function getClaims({ category, status } = {}) {
  if (getDatabaseStatus() === "connected") {
    const match = {};
    if (category) match.category = category;
    if (status) match.status = status;

    const claims = await Claim.aggregate([
      { $match: match },
      {
        $addFields: {
          riskOrder: {
            $switch: {
              branches: [
                { case: { $eq: ["$riskLevel", "HIGH"] }, then: 3 },
                { case: { $eq: ["$riskLevel", "MEDIUM"] }, then: 2 },
                { case: { $eq: ["$riskLevel", "LOW"] }, then: 1 },
              ],
              default: 0,
            },
          },
        },
      },
      { $sort: { riskOrder: -1, createdAt: -1 } },
    ]);

    return claims.map(serializeClaim);
  }

  let filtered = [...memoryClaims];
  if (category) {
    filtered = filtered.filter((c) => c.category === category);
  }
  if (status) {
    filtered = filtered.filter((c) => c.status === status);
  }

  return sortClaimsDP1(filtered).map(serializeClaim);
}

export async function getClaimById(id) {
  if (getDatabaseStatus() === "connected") {
    try {
      const claim = await Claim.findById(id);
      return claim ? serializeClaim(claim) : null;
    } catch {
      return null;
    }
  }

  const claim = memoryClaims.find((c) => (c.id || c._id)?.toString() === id.toString());
  return claim ? serializeClaim(claim) : null;
}

export async function reviewClaim(id, { status, reviewerNote }) {
  const reviewedAt = status === "UNVERIFIED" ? null : new Date();

  if (getDatabaseStatus() === "connected") {
    const updated = await Claim.findByIdAndUpdate(
      id,
      {
        status,
        reviewerNote: reviewerNote || null,
        reviewedAt,
      },
      { new: true, runValidators: true },
    );
    return updated ? serializeClaim(updated) : null;
  }

  const index = memoryClaims.findIndex((c) => (c.id || c._id)?.toString() === id.toString());
  if (index === -1) return null;

  // Immutability enforcement (DP3): only status, reviewerNote, and reviewedAt are modified.
  memoryClaims[index] = {
    ...memoryClaims[index],
    status,
    reviewerNote: reviewerNote || null,
    reviewedAt,
  };

  return serializeClaim(memoryClaims[index]);
}

export async function agreeToClaim(id) {
  if (getDatabaseStatus() === "connected") {
    const updated = await Claim.findByIdAndUpdate(
      id,
      { $inc: { agreeCount: 1 } },
      { new: true },
    );
    return updated ? serializeClaim(updated) : null;
  }

  const claim = memoryClaims.find((c) => (c.id || c._id)?.toString() === id.toString());
  if (!claim) return null;
  claim.agreeCount = (claim.agreeCount || 0) + 1;
  return serializeClaim(claim);
}

export async function unagreeToClaim(id) {
  if (getDatabaseStatus() === "connected") {
    const claim = await Claim.findById(id);
    if (!claim) return null;
    claim.agreeCount = Math.max(0, (claim.agreeCount || 0) - 1);
    await claim.save();
    return serializeClaim(claim);
  }

  const claim = memoryClaims.find((c) => (c.id || c._id)?.toString() === id.toString());
  if (!claim) return null;
  claim.agreeCount = Math.max(0, (claim.agreeCount || 0) - 1);
  return serializeClaim(claim);
}
