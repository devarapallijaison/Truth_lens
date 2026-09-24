import { Router } from "express";
import {
  CLAIM_CATEGORIES,
  CLAIM_STATUSES,
  SOURCE_PLATFORMS,
} from "../models/Claim.js";
import { assessClaimRisk } from "../utils/riskAssessment.js";
import {
  createClaim,
  getClaims,
  getClaimById,
  reviewClaim,
  agreeToClaim,
  unagreeToClaim,
} from "../services/claimService.js";

const router = Router();

function validateClaimInput(body) {
  const errors = {};
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  const sourcePlatform =
    typeof body?.sourcePlatform === "string" ? body.sourcePlatform.trim() : "";
  const category = typeof body?.category === "string" ? body.category.trim() : "";

  if (!text) {
    errors.text = "Claim text is required.";
  } else if (text.length > 2000) {
    errors.text = "Claim text must be 2,000 characters or fewer.";
  }

  if (!SOURCE_PLATFORMS.includes(sourcePlatform)) {
    errors.sourcePlatform = "Choose a valid source platform.";
  }

  if (!CLAIM_CATEGORIES.includes(category)) {
    errors.category = "Choose a valid category.";
  }

  return {
    errors,
    value: { text, sourcePlatform, category },
  };
}

// GET /api/claims - Public Feed with category & status filters, sorted by DP1
router.get("/", async (request, response, next) => {
  try {
    const { category, status } = request.query;

    const filter = {};
    if (category && CLAIM_CATEGORIES.includes(category)) {
      filter.category = category;
    }
    if (status && CLAIM_STATUSES.includes(status)) {
      filter.status = status;
    }

    const claims = await getClaims(filter);
    return response.status(200).json({ claims });
  } catch (error) {
    return next(error);
  }
});

// GET /api/claims/:id - Claim Detail
router.get("/:id", async (request, response, next) => {
  try {
    const claim = await getClaimById(request.params.id);
    if (!claim) {
      return response.status(404).json({ error: "Claim not found." });
    }
    return response.status(200).json({ claim });
  } catch (error) {
    return next(error);
  }
});

// POST /api/claims - Submit Claim
router.post("/", async (request, response, next) => {
  const { errors, value } = validateClaimInput(request.body);

  if (Object.keys(errors).length > 0) {
    return response.status(400).json({
      error: "Please correct the highlighted fields.",
      errors,
    });
  }

  try {
    const { riskFlags, riskLevel } = assessClaimRisk(value.text);
    const claim = await createClaim({
      ...value,
      riskFlags,
      riskLevel,
      status: "UNVERIFIED",
    });

    return response.status(201).json({ claim });
  } catch (error) {
    return next(error);
  }
});

// PATCH /api/claims/:id/review - Reviewer update (DP3: only status & note, original text is immutable)
router.patch("/:id/review", async (request, response, next) => {
  const { status, reviewerNote } = request.body || {};

  if (!status || !CLAIM_STATUSES.includes(status)) {
    return response.status(400).json({
      error: `Status must be one of: ${CLAIM_STATUSES.join(", ")}.`,
    });
  }

  if (reviewerNote && typeof reviewerNote === "string" && reviewerNote.length > 1000) {
    return response.status(400).json({
      error: "Reviewer note must be 1,000 characters or fewer.",
    });
  }

  try {
    const updated = await reviewClaim(request.params.id, {
      status,
      reviewerNote: typeof reviewerNote === "string" ? reviewerNote.trim() : "",
    });

    if (!updated) {
      return response.status(404).json({ error: "Claim not found." });
    }

    return response.status(200).json({ claim: updated });
  } catch (error) {
    return next(error);
  }
});

// POST /api/claims/:id/agree - Community Reaction (+1)
router.post("/:id/agree", async (request, response, next) => {
  try {
    const updated = await agreeToClaim(request.params.id);
    if (!updated) {
      return response.status(404).json({ error: "Claim not found." });
    }
    return response.status(200).json({
      id: updated.id,
      agreeCount: updated.agreeCount,
      claim: updated,
    });
  } catch (error) {
    return next(error);
  }
});

// DELETE /api/claims/:id/agree - Community Reaction (-1 toggle off)
router.delete("/:id/agree", async (request, response, next) => {
  try {
    const updated = await unagreeToClaim(request.params.id);
    if (!updated) {
      return response.status(404).json({ error: "Claim not found." });
    }
    return response.status(200).json({
      id: updated.id,
      agreeCount: updated.agreeCount,
      claim: updated,
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
