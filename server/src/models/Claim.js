import mongoose from "mongoose";

export const CLAIM_STATUSES = [
  "UNVERIFIED",
  "VERIFIED_TRUE",
  "VERIFIED_FALSE",
  "MISLEADING",
];

export const CLAIM_CATEGORIES = ["Politics", "Health", "Finance", "Other"];

export const SOURCE_PLATFORMS = ["WhatsApp", "X", "Instagram", "Other"];

export const RISK_FLAGS = ["SENSATIONAL", "SHOUTING", "UNSOURCED"];

export const RISK_LEVELS = ["LOW", "MEDIUM", "HIGH"];

const claimSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 2000,
      immutable: true,
    },
    sourcePlatform: {
      type: String,
      required: true,
      enum: SOURCE_PLATFORMS,
      immutable: true,
    },
    category: {
      type: String,
      required: true,
      enum: CLAIM_CATEGORIES,
      immutable: true,
    },
    riskFlags: {
      type: [String],
      enum: RISK_FLAGS,
      default: [],
      immutable: true,
    },
    riskLevel: {
      type: String,
      enum: RISK_LEVELS,
      default: "LOW",
      immutable: true,
    },
    status: {
      type: String,
      enum: CLAIM_STATUSES,
      default: "UNVERIFIED",
    },
    reviewerNote: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    agreeCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

const Claim = mongoose.model("Claim", claimSchema);

export default Claim;
