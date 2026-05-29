const MEDICAL_PATTERNS = [
  /\bdiagnos(e|is|ed|ing)\b/i,
  /\byou have\b.*\b(depression|bipolar|ptsd|adhd|anxiety disorder)\b/i,
  /\btake\b.*\b(medicine|medication|pills|dose|dosage)\b/i,
  /\bstop\b.*\b(medicine|medication|therapy)\b/i,
  /ØªØ´Ø®ÙŠØµ|Ø¯ÙˆØ§Ø¡|Ø¹Ù„Ø§Ø¬Ùƒ|Ø§Ù†Øª Ø¹Ù†Ø¯Ùƒ/i,
];

const SPAM_PATTERNS = [
  /\b(bitcoin|crypto giveaway|forex|casino|loan)\b/i,
  /(https?:\/\/\S+){2,}/i,
  /(.)\1{12,}/,
];

const UNSAFE_PATTERNS = [
  /\b(kill myself|suicide|self harm|hurt myself)\b/i,
  /Ø§Ù†ØªØ­Ø§Ø±|Ø£Ø°ÙŠ Ù†ÙØ³ÙŠ|Ø§Ù‚ØªÙ„ Ù†ÙØ³ÙŠ/i,
];

function reviewText(text = "") {
  const labels = [];
  let score = 0;

  if (MEDICAL_PATTERNS.some((pattern) => pattern.test(text))) {
    labels.push("medical_advice_or_diagnosis");
    score += 80;
  }

  if (SPAM_PATTERNS.some((pattern) => pattern.test(text))) {
    labels.push("spam");
    score += 70;
  }

  if (UNSAFE_PATTERNS.some((pattern) => pattern.test(text))) {
    labels.push("crisis_or_self_harm");
    score += 90;
  }

  const status = score >= 70 ? "pending_review" : "published";
  const reason = labels.length ? `Flagged for ${labels.join(", ")}` : null;

  return {
    status,
    score: Math.min(score, 100),
    labels,
    reason,
  };
}

module.exports = {
  reviewText,
};
