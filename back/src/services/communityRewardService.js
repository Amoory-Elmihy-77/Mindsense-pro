const { User, CommunityBadge } = require("../repositories/communityRepository");

const XP_RULES = {
  post: 10,
  comment: 6,
  checkIn: 15,
  challengeTask: 10,
  challengeComplete: 50,
  buddyEncouragement: 8,
};

function computeLevel(xp) {
  let level = 1;
  while (xp >= (level * level * 100)) level += 1;
  return level;
}

async function grantXp(userId, amount, reason = "community") {
  const user = await User.findById(userId).select("gamification communityProfile");
  if (!user) return null;

  const currentXp = user.gamification?.xp || 0;
  const newXp = currentXp + amount;
  const newLevel = computeLevel(newXp);

  user.gamification = {
    ...(user.gamification || {}),
    xp: newXp,
    points: (user.gamification?.points || 0) + amount,
  };

  user.communityProfile = {
    ...(user.communityProfile || {}),
    reputation: {
      ...(user.communityProfile?.reputation || {}),
      contribution: (user.communityProfile?.reputation?.contribution || 0) + Math.ceil(amount / 5),
      level: newLevel,
    },
  };

  await user.save({ validateBeforeSave: false });
  return { amount, reason, totalXp: newXp, level: newLevel };
}

async function awardBadge(userId, key, name, description, category = "challenge") {
  try {
    return await CommunityBadge.create({ user: userId, key, name, description, category });
  } catch (err) {
    if (err.code === 11000) return null;
    throw err;
  }
}

module.exports = {
  XP_RULES,
  grantXp,
  awardBadge,
  computeLevel,
};
