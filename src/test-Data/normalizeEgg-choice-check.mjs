import { EGG_CHOICES } from "../api/eggs/constants/eggChoices.js";
import { normalizeEgg } from "../api/eggs/normalizers/normalizeEgg.js";

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

// ponytail: quick regression check for choice inference when the API omits eggType.
const instantSingleEgg = normalizeEgg(
  {
    id: "instant-single",
    slot: 2,
    status: "ready",
  },
  0,
  1
);

assertEqual(
  instantSingleEgg.choice,
  EGG_CHOICES.instant,
  "single ready egg should stay instant"
);

const delayedSingleEgg = normalizeEgg(
  {
    id: "delayed-single",
    slot: 2,
    status: "locked",
    hatch_at: "2026-07-30T00:00:00.000Z",
  },
  0,
  1
);

assertEqual(
  delayedSingleEgg.choice,
  EGG_CHOICES.delayed,
  "single cooldown egg should stay delayed"
);

const delayedSecondEgg = normalizeEgg(
  {
    id: "second-egg",
    slot: 2,
    status: "ready",
  },
  1,
  2
);

assertEqual(
  delayedSecondEgg.choice,
  EGG_CHOICES.delayed,
  "second egg in a pair should stay delayed"
);

const attachedAccountEgg = normalizeEgg(
  {
    id: "attached-account",
    status: "ready",
    account: {
      username: "still-locked",
    },
  },
  0,
  1
);

assertEqual(
  attachedAccountEgg.isClaimed,
  false,
  "ready egg with attached account payload should stay unopened"
);

const claimedEgg = normalizeEgg(
  {
    id: "claimed-egg",
    status: "claimed",
    account: {
      username: "opened-user",
    },
  },
  0,
  1
);

assertEqual(
  claimedEgg.isClaimed,
  true,
  "claimed egg should stay opened"
);

console.log("normalizeEgg choice check passed");
