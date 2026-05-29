const mongoose = require("mongoose");
const {
  CommunityPost,
  CommunityComment,
  Circle,
  CheckIn,
  Challenge,
  ChallengeParticipation,
  Buddy,
  ReflectionRoom,
  RoomMessage,
  CommunityNotification,
  CommunityReport,
  ModerationAction,
  CommunityBadge,
  CommunityGroupSession,
  User,
} = require("../repositories/communityRepository");
const moderation = require("./communityModerationService");
const rewards = require("./communityRewardService");
const notificationService = require("./communityNotificationService");
const realtimeHub = require("../realtime/communityHub");

const DEFAULT_CIRCLES = [
  {
    name: "Focus Circle",
    slug: "focus",
    description: "A quiet space for focus, deep work, and mindful progress.",
    tags: ["focus", "productivity"],
    rules: ["Share progress, not pressure.", "No diagnosis or medical advice."],
  },
  {
    name: "Study Circle",
    slug: "study",
    description: "For students building consistency and calmer study routines.",
    tags: ["study", "consistency"],
    rules: ["Be specific and supportive.", "Respect different learning speeds."],
  },
  {
    name: "Sleep Circle",
    slug: "sleep",
    description: "Reflect on rest, night routines, and sustainable recovery.",
    tags: ["sleep", "recovery"],
    rules: ["Keep advice non-medical.", "Share what helped you personally."],
  },
  {
    name: "Stress Management",
    slug: "stress-management",
    description: "Small practices for stress awareness and emotional regulation.",
    tags: ["stress", "breathing"],
    rules: ["Use encouragement, not instructions.", "Escalate crisis content to support."],
  },
  {
    name: "Consistency",
    slug: "consistency",
    description: "Build daily streaks, reflect, and return gently after missed days.",
    tags: ["habits", "streaks"],
    rules: ["Progress beats perfection.", "Celebrate small wins."],
  },
];

const DEFAULT_ROOMS = [
  { name: "Study Room", slug: "study", type: "study", description: "Shared quiet study reflections.", prompts: ["What is one small task for this session?"] },
  { name: "Focus Room", slug: "focus", type: "focus", description: "Short focus sprints and grounding prompts.", prompts: ["What would make the next 20 minutes successful?"] },
  { name: "Night Room", slug: "night", type: "night", description: "Evening reflections without pressure.", prompts: ["What can you release before sleep?"] },
  { name: "Weekend Room", slug: "weekend", type: "weekend", description: "Reset, plan, and reflect for the week ahead.", prompts: ["What deserves your attention this weekend?"] },
];

const DEFAULT_CHALLENGES = [
  {
    title: "Three Calm Breaths",
    description: "A short breathing reset to return to the present moment.",
    type: "breathing",
    durationDays: 1,
    xp: 40,
    difficulty: "easy",
    badgeKey: "three-calm-breaths",
    tasks: [
      { title: "Inhale for four counts", xp: 10 },
      { title: "Exhale slowly for six counts", xp: 10 },
      { title: "Write one word for how you feel", xp: 10 },
    ],
  },
  {
    title: "Focus Sprint",
    description: "Choose one task and complete a 20-minute focused sprint.",
    type: "focus",
    durationDays: 1,
    xp: 60,
    difficulty: "medium",
    badgeKey: "focus-sprint",
    tasks: [
      { title: "Pick one task", xp: 10 },
      { title: "Remove one distraction", xp: 10 },
      { title: "Complete 20 focused minutes", xp: 20 },
    ],
  },
  {
    title: "Evening Reflection",
    description: "Close the day with a simple reflection and a small plan.",
    type: "journaling",
    durationDays: 1,
    xp: 50,
    difficulty: "easy",
    badgeKey: "evening-reflection",
    tasks: [
      { title: "Name one win", xp: 10 },
      { title: "Name one lesson", xp: 10 },
      { title: "Choose tomorrow's first step", xp: 10 },
    ],
  },
];

function slugify(value = "") {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function ensureModerator(user) {
  if (!["community_moderator", "admin"].includes(user.role)) {
    const err = new Error("Moderator permission required");
    err.statusCode = 403;
    throw err;
  }
}

function ensureProfessionalHost(user) {
  if (!["professional", "admin"].includes(user.role)) {
    const err = new Error("Professional host permission required");
    err.statusCode = 403;
    throw err;
  }
}

function getCommunityProfile(user) {
  const seed = user.communityProfile?.avatarSeed || String(user._id).slice(-8);
  const nickname = user.communityProfile?.nickname || `Mindful ${seed.slice(0, 4).toUpperCase()}`;
  return { nickname, seed };
}

function displayAuthorFor(user, visibility = "nickname") {
  const profile = getCommunityProfile(user);
  if (visibility === "anonymous") {
    return { name: "Anonymous Member", avatarSeed: "anonymous", mode: "anonymous" };
  }
  if (visibility === "public") {
    return { name: user.name, avatarSeed: profile.seed, mode: "public" };
  }
  return { name: profile.nickname, avatarSeed: profile.seed, mode: "nickname" };
}

async function ensureSeedData() {
  const circleCount = await Circle.estimatedDocumentCount();
  if (circleCount === 0) {
    await Circle.insertMany(DEFAULT_CIRCLES);
  }

  const roomCount = await ReflectionRoom.estimatedDocumentCount();
  if (roomCount === 0) {
    await ReflectionRoom.insertMany(DEFAULT_ROOMS);
  }

  const challengeCount = await Challenge.estimatedDocumentCount();
  if (challengeCount === 0) {
    await Challenge.insertMany(DEFAULT_CHALLENGES);
  }
}

async function getOverview(userId) {
  await ensureSeedData();
  const [circles, recentPosts, challenges, notifications, badges] = await Promise.all([
    Circle.find({ visibility: "public" }).sort({ memberCount: -1 }).limit(8).lean(),
    CommunityPost.find({ status: "published" }).sort({ createdAt: -1 }).limit(5).populate("circle", "name slug").lean(),
    Challenge.find({}).sort({ createdAt: -1 }).limit(5).lean(),
    CommunityNotification.find({ user: userId, readAt: null }).sort({ createdAt: -1 }).limit(5).lean(),
    CommunityBadge.find({ user: userId }).sort({ earnedAt: -1 }).limit(8).lean(),
  ]);

  const user = await User.findById(userId).select("gamification communityProfile").lean();
  return {
    tagline: "Grow Together. Reflect Together. Progress Together.",
    circles,
    recentPosts,
    challenges,
    notifications,
    badges,
    reputation: user?.communityProfile?.reputation,
    xp: user?.gamification?.xp || 0,
  };
}

async function listFeed(user, filters = {}) {
  await ensureSeedData();
  const query = { status: "published" };
  const type = filters.type || "recent";

  if (filters.circle) {
    query.circle = filters.circle;
  }

  if (type === "circle" && !filters.circle) {
    const joined = user.communityProfile?.joinedCircles || [];
    query.circle = { $in: joined };
  }

  if (type === "following") {
    query.author = { $in: user.following || [] };
  }

  let sort = { createdAt: -1 };
  if (type === "trending") sort = { trendingScore: -1, createdAt: -1 };

  return CommunityPost.find(query)
    .sort(sort)
    .limit(Math.min(Number(filters.limit) || 30, 100))
    .populate("circle", "name slug")
    .lean();
}

async function createPost(user, payload) {
  const visibility = payload.visibility || user.communityProfile?.defaultVisibility || "nickname";
  const review = moderation.reviewText(payload.content);
  const post = await CommunityPost.create({
    author: user._id,
    circle: payload.circle || null,
    type: payload.type,
    content: payload.content,
    visibility,
    displayAuthor: displayAuthorFor(user, visibility),
    status: review.status,
    moderation: {
      score: review.score,
      labels: review.labels,
      reason: review.reason,
    },
    trendingScore: 1,
  });

  if (payload.circle) {
    await Circle.findByIdAndUpdate(payload.circle, { $inc: { "stats.posts": 1 } });
  }
  await rewards.grantXp(user._id, rewards.XP_RULES.post, "community_post");
  realtimeHub.publish("feed:update", { postId: post._id, status: post.status });
  return post;
}

async function updatePost(user, postId, payload) {
  const post = await CommunityPost.findOne({ _id: postId, author: user._id });
  if (!post) {
    const err = new Error("Post not found or not editable");
    err.statusCode = 404;
    throw err;
  }
  const review = moderation.reviewText(payload.content || post.content);
  post.content = payload.content || post.content;
  post.type = payload.type || post.type;
  post.visibility = payload.visibility || post.visibility;
  post.displayAuthor = displayAuthorFor(user, post.visibility);
  post.status = review.status;
  post.moderation = { ...post.moderation, ...review };
  post.editedAt = Date.now();
  await post.save();
  return post;
}

async function deletePost(user, postId) {
  const query = ["admin", "community_moderator"].includes(user.role)
    ? { _id: postId }
    : { _id: postId, author: user._id };
  const post = await CommunityPost.findOne(query);
  if (!post) {
    const err = new Error("Post not found");
    err.statusCode = 404;
    throw err;
  }
  post.status = "removed";
  await post.save();
  return post;
}

async function reactToPost(user, postId, type = "support") {
  const post = await CommunityPost.findById(postId);
  if (!post || post.status !== "published") {
    const err = new Error("Post not found");
    err.statusCode = 404;
    throw err;
  }
  post.reactions = post.reactions.filter((r) => String(r.user) !== String(user._id));
  post.reactions.push({ user: user._id, type });
  post.trendingScore += 2;
  await post.save();

  if (String(post.author) !== String(user._id)) {
    await notificationService.createNotification(post.author, {
      type: "comment",
      title: "New support reaction",
      body: `${displayAuthorFor(user, "nickname").name} reacted with ${type}.`,
      link: `/community?post=${post._id}`,
    });
  }
  return post;
}

async function savePost(user, postId) {
  return CommunityPost.findByIdAndUpdate(postId, { $addToSet: { savedBy: user._id } }, { new: true });
}

async function sharePost(user, postId) {
  return CommunityPost.findByIdAndUpdate(postId, { $inc: { shareCount: 1, trendingScore: 1 } }, { new: true });
}

async function addComment(user, postId, payload) {
  const post = await CommunityPost.findById(postId);
  if (!post || post.status !== "published") {
    const err = new Error("Post not found");
    err.statusCode = 404;
    throw err;
  }
  const visibility = payload.visibility || user.communityProfile?.defaultVisibility || "nickname";
  const review = moderation.reviewText(payload.content);
  const comment = await CommunityComment.create({
    post: postId,
    author: user._id,
    content: payload.content,
    visibility,
    displayAuthor: displayAuthorFor(user, visibility),
    status: review.status,
  });

  await CommunityPost.findByIdAndUpdate(postId, { $inc: { commentCount: 1, trendingScore: 3 } });
  await rewards.grantXp(user._id, rewards.XP_RULES.comment, "community_comment");
  if (String(post.author) !== String(user._id)) {
    await notificationService.createNotification(post.author, {
      type: "comment",
      title: "New comment on your reflection",
      body: `${comment.displayAuthor.name} replied supportively.`,
      link: `/community?post=${postId}`,
    });
  }
  return comment;
}

async function listComments(postId) {
  return CommunityComment.find({ post: postId, status: "published" }).sort({ createdAt: 1 }).lean();
}

async function reportTarget(user, payload) {
  const report = await CommunityReport.create({
    reporter: user._id,
    targetType: payload.targetType,
    targetId: payload.targetId,
    reason: payload.reason,
    note: payload.note,
  });
  if (payload.targetType === "post") {
    await CommunityPost.findByIdAndUpdate(payload.targetId, { $inc: { reportCount: 1 } });
  }
  return report;
}

async function listCircles() {
  await ensureSeedData();
  return Circle.find({ visibility: "public" }).sort({ memberCount: -1, name: 1 }).lean();
}

async function createCircle(user, payload) {
  ensureModerator(user);
  return Circle.create({
    name: payload.name,
    slug: payload.slug || slugify(payload.name),
    description: payload.description,
    tags: payload.tags || [],
    rules: payload.rules || [],
    admins: [user._id],
    members: [user._id],
    memberCount: 1,
    premiumOnly: payload.premiumOnly === true,
    createdBy: user._id,
  });
}

async function joinCircle(user, circleId) {
  const userDoc = await User.findById(user._id).select("role communityProfile");
  const circle = await Circle.findById(circleId);
  if (!circle) {
    const err = new Error("Circle not found");
    err.statusCode = 404;
    throw err;
  }

  const joined = userDoc.communityProfile?.joinedCircles || [];
  const isPremium = ["premium", "professional", "community_moderator", "admin"].includes(userDoc.role);
  if (!isPremium && joined.length >= 3 && !joined.some((id) => String(id) === String(circleId))) {
    const err = new Error("Free users can join up to 3 circles. Upgrade for unlimited circles.");
    err.statusCode = 402;
    throw err;
  }

  if (circle.premiumOnly && !isPremium) {
    const err = new Error("This circle is available to premium members.");
    err.statusCode = 402;
    throw err;
  }

  const alreadyMember = circle.members.some((id) => String(id) === String(user._id));
  await User.findByIdAndUpdate(user._id, { $addToSet: { "communityProfile.joinedCircles": circleId } });
  await Circle.findByIdAndUpdate(
    circleId,
    alreadyMember
      ? { $addToSet: { members: user._id } }
      : { $addToSet: { members: user._id }, $inc: { memberCount: 1 } },
  );
  return Circle.findById(circleId).lean();
}

async function leaveCircle(user, circleId) {
  const circle = await Circle.findById(circleId).select("members");
  const wasMember = circle?.members?.some((id) => String(id) === String(user._id));
  await User.findByIdAndUpdate(user._id, { $pull: { "communityProfile.joinedCircles": circleId } });
  await Circle.findByIdAndUpdate(
    circleId,
    wasMember
      ? { $pull: { members: user._id }, $inc: { memberCount: -1 } }
      : { $pull: { members: user._id } },
  );
  return { left: true };
}

async function createCheckIn(user, payload) {
  const existingToday = await CheckIn.findOne({
    user: user._id,
    createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
  });

  const xp = existingToday ? 5 : rewards.XP_RULES.checkIn;
  const summary = `${payload.mood} mood with ${payload.energy || "medium"} energy. Progress: ${payload.progress || 0}%.`;
  const checkIn = await CheckIn.create({
    user: user._id,
    circle: payload.circle || null,
    mood: payload.mood,
    energy: payload.energy || "medium",
    reflection: payload.reflection,
    progress: payload.progress || 0,
    publishPost: payload.publishPost === true,
    summary,
    xpEarned: xp,
  });
  await rewards.grantXp(user._id, xp, "daily_check_in");

  let post = null;
  if (payload.publishPost) {
    post = await createPost(user, {
      circle: payload.circle,
      type: "reflection",
      content: payload.reflection || summary,
      visibility: payload.visibility || "nickname",
    });
  }
  return { checkIn, post };
}

async function listMyCheckIns(userId) {
  return CheckIn.find({ user: userId }).sort({ createdAt: -1 }).limit(60).lean();
}

async function listChallenges(filters = {}) {
  const query = {};
  if (filters.circle) query.circle = filters.circle;
  if (filters.type) query.type = filters.type;
  return Challenge.find(query).sort({ createdAt: -1 }).limit(50).lean();
}

async function createChallenge(user, payload) {
  if (!["community_moderator", "professional", "admin"].includes(user.role)) {
    const err = new Error("Challenge creation requires professional or moderator permission");
    err.statusCode = 403;
    throw err;
  }
  return Challenge.create({
    ...payload,
    createdBy: user._id,
    badgeKey: payload.badgeKey || slugify(payload.title),
  });
}

async function joinChallenge(user, challengeId) {
  const challenge = await Challenge.findById(challengeId);
  if (!challenge) {
    const err = new Error("Challenge not found");
    err.statusCode = 404;
    throw err;
  }
  return ChallengeParticipation.findOneAndUpdate(
    { user: user._id, challenge: challengeId },
    { $setOnInsert: { circle: challenge.circle, status: "active" } },
    { upsert: true, new: true },
  );
}

async function completeChallengeTask(user, challengeId, taskId) {
  const challenge = await Challenge.findById(challengeId);
  const participation = await joinChallenge(user, challengeId);
  const before = participation.completedTasks.length;
  participation.completedTasks.addToSet(new mongoose.Types.ObjectId(taskId));
  participation.progress = Math.round((participation.completedTasks.length / Math.max(challenge.tasks.length, 1)) * 100);
  const newlyCompleted = participation.completedTasks.length > before;
  if (newlyCompleted) {
    participation.xpEarned += rewards.XP_RULES.challengeTask;
  }
  await participation.save();
  if (newlyCompleted) {
    await rewards.grantXp(user._id, rewards.XP_RULES.challengeTask, "challenge_task");
  }
  return participation;
}

async function completeChallenge(user, challengeId) {
  const challenge = await Challenge.findById(challengeId);
  const participation = await joinChallenge(user, challengeId);
  if (participation.status === "completed") {
    return participation;
  }
  participation.status = "completed";
  participation.progress = 100;
  participation.completedAt = Date.now();
  participation.xpEarned += challenge.xp || rewards.XP_RULES.challengeComplete;
  await participation.save();
  await rewards.grantXp(user._id, challenge.xp || rewards.XP_RULES.challengeComplete, "challenge_complete");
  if (challenge.badgeKey) {
    await rewards.awardBadge(user._id, challenge.badgeKey, challenge.title, `Completed ${challenge.title}`, "challenge");
  }
  return participation;
}

async function myChallengeProgress(userId) {
  return ChallengeParticipation.find({ user: userId }).populate("challenge").sort({ startedAt: -1 }).lean();
}

async function inviteBuddy(user, payload) {
  if (!payload.recipientId || String(payload.recipientId) === String(user._id)) {
    const err = new Error("A valid recipient is required");
    err.statusCode = 400;
    throw err;
  }
  const buddy = await Buddy.findOneAndUpdate(
    { requester: user._id, recipient: payload.recipientId },
    { $setOnInsert: { sharedGoals: payload.sharedGoals || [] } },
    { upsert: true, new: true },
  );
  await notificationService.createNotification(payload.recipientId, {
    type: "buddy",
    title: "New buddy invite",
    body: `${user.name} invited you to share wellbeing goals.`,
    link: "/community?tab=buddies",
  });
  return buddy;
}

async function acceptBuddy(user, buddyId) {
  const buddy = await Buddy.findOne({ _id: buddyId, recipient: user._id });
  if (!buddy) {
    const err = new Error("Buddy invite not found");
    err.statusCode = 404;
    throw err;
  }
  buddy.status = "accepted";
  buddy.updatedAt = Date.now();
  await buddy.save();
  await notificationService.createNotification(buddy.requester, {
    type: "buddy",
    title: "Buddy invite accepted",
    body: `${user.name} accepted your buddy invite.`,
    link: "/community?tab=buddies",
  });
  return buddy;
}

async function listBuddies(userId) {
  return Buddy.find({ $or: [{ requester: userId }, { recipient: userId }] })
    .populate("requester recipient", "name email communityProfile")
    .sort({ updatedAt: -1 })
    .lean();
}

async function encourageBuddy(user, buddyId, message) {
  const buddy = await Buddy.findOne({
    _id: buddyId,
    status: "accepted",
    $or: [{ requester: user._id }, { recipient: user._id }],
  });
  if (!buddy) {
    const err = new Error("Buddy relationship not found");
    err.statusCode = 404;
    throw err;
  }
  const recipient = String(buddy.requester) === String(user._id) ? buddy.recipient : buddy.requester;
  buddy.encouragements.push({ from: user._id, message });
  buddy.updatedAt = Date.now();
  await buddy.save();
  await rewards.grantXp(user._id, rewards.XP_RULES.buddyEncouragement, "buddy_encouragement");
  await notificationService.createNotification(recipient, {
    type: "buddy",
    title: "Buddy encouragement",
    body: message,
    link: "/community?tab=buddies",
  });
  return buddy;
}

async function listRooms() {
  await ensureSeedData();
  return ReflectionRoom.find({}).sort({ activeCount: -1, name: 1 }).lean();
}

async function createRoom(user, payload) {
  ensureModerator(user);
  return ReflectionRoom.create({
    name: payload.name,
    slug: payload.slug || slugify(payload.name),
    description: payload.description,
    type: payload.type || "custom",
    prompts: payload.prompts || [],
    isVoiceEnabled: payload.isVoiceEnabled === true,
    createdBy: user._id,
  });
}

async function joinRoom(user, roomId) {
  return ReflectionRoom.findByIdAndUpdate(
    roomId,
    { $addToSet: { participants: user._id }, $inc: { activeCount: 1 } },
    { new: true },
  );
}

async function leaveRoom(user, roomId) {
  return ReflectionRoom.findByIdAndUpdate(
    roomId,
    { $pull: { participants: user._id }, $inc: { activeCount: -1 } },
    { new: true },
  );
}

async function addRoomMessage(user, roomId, payload) {
  const visibility = payload.visibility || user.communityProfile?.defaultVisibility || "nickname";
  const review = moderation.reviewText(payload.content);
  if (review.score >= 70) {
    const err = new Error("Message needs moderation review before it can be shared");
    err.statusCode = 422;
    throw err;
  }
  const message = await RoomMessage.create({
    room: roomId,
    author: user._id,
    content: payload.content,
    visibility,
    displayAuthor: displayAuthorFor(user, visibility),
  });
  realtimeHub.publish(`room:${roomId}`, { event: "message", message });
  return message;
}

async function listRoomMessages(roomId) {
  return RoomMessage.find({ room: roomId }).sort({ createdAt: -1 }).limit(60).lean();
}

async function leaderboard(filters = {}) {
  const circleId = filters.circle;
  const match = circleId ? { "communityProfile.joinedCircles": circleId } : {};
  return User.find(match)
    .select("name communityProfile gamification")
    .sort({ "communityProfile.reputation.contribution": -1, "gamification.xp": -1 })
    .limit(50)
    .lean();
}

async function notifications(userId) {
  return CommunityNotification.find({ user: userId }).sort({ createdAt: -1 }).limit(50).lean();
}

async function markNotificationRead(userId, notificationId) {
  return CommunityNotification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { readAt: Date.now() },
    { new: true },
  );
}

async function moderationQueue(user) {
  ensureModerator(user);
  const [posts, reports] = await Promise.all([
    CommunityPost.find({ status: "pending_review" }).sort({ createdAt: 1 }).limit(50).populate("author", "name email").lean(),
    CommunityReport.find({ status: { $in: ["open", "reviewing"] } }).sort({ createdAt: 1 }).limit(50).populate("reporter", "name email").lean(),
  ]);
  return { posts, reports };
}

async function moderatePost(user, postId, action, reason) {
  ensureModerator(user);
  const post = await CommunityPost.findById(postId);
  if (!post) {
    const err = new Error("Post not found");
    err.statusCode = 404;
    throw err;
  }
  if (action === "approve") post.status = "published";
  if (["hide", "remove"].includes(action)) post.status = action === "hide" ? "hidden" : "removed";
  post.moderation.reviewedBy = user._id;
  post.moderation.reviewedAt = Date.now();
  post.moderation.reason = reason || post.moderation.reason;
  await post.save();
  await ModerationAction.create({ actor: user._id, targetUser: post.author, targetType: "post", targetId: postId, action, reason });
  await notificationService.createNotification(post.author, {
    type: "moderation",
    title: "Community moderation update",
    body: action === "approve" ? "Your post is now published." : "A community post was reviewed by moderators.",
    link: "/community",
  });
  return post;
}

async function reviewReport(user, reportId, payload) {
  ensureModerator(user);
  const report = await CommunityReport.findById(reportId);
  if (!report) {
    const err = new Error("Report not found");
    err.statusCode = 404;
    throw err;
  }
  report.status = payload.status || "resolved";
  report.resolution = payload.resolution;
  report.reviewedBy = user._id;
  report.reviewedAt = Date.now();
  await report.save();
  await ModerationAction.create({ actor: user._id, targetType: "report", targetId: reportId, action: payload.action || "dismiss", reason: payload.resolution });
  return report;
}

async function communityHealth() {
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);
  const [posts, checkIns, reports, completions] = await Promise.all([
    CommunityPost.countDocuments({ status: "published", createdAt: { $gte: since } }),
    CheckIn.countDocuments({ createdAt: { $gte: since } }),
    CommunityReport.countDocuments({ createdAt: { $gte: since } }),
    ChallengeParticipation.countDocuments({ status: "completed", completedAt: { $gte: since } }),
  ]);

  return {
    window: "7d",
    posts,
    checkIns,
    reports,
    challengeCompletions: completions,
    healthScore: Math.max(0, Math.min(100, 70 + checkIns + completions - reports * 5)),
    recommendations: [
      "Promote circles with high check-in activity.",
      "Invite professionals to host guided group sessions where stress trends rise.",
      "Keep insights aggregated and avoid exposing individual emotional states.",
    ],
  };
}

async function listGroupSessions(filters = {}) {
  const query = { status: { $in: ["open", "full"] } };
  if (filters.circle) query.circle = filters.circle;
  if (filters.type) query.type = filters.type;

  return CommunityGroupSession.find(query)
    .sort({ startsAt: 1 })
    .limit(50)
    .populate("host", "name role professionalProfile communityProfile")
    .populate("circle", "name slug")
    .lean();
}

async function createGroupSession(user, payload) {
  if (payload.type === "professional") {
    ensureProfessionalHost(user);
  }

  const session = await CommunityGroupSession.create({
    host: user._id,
    circle: payload.circle,
    title: payload.title,
    description: payload.description,
    type: payload.type || "open",
    capacity: payload.capacity || 12,
    durationMinutes: payload.durationMinutes || 45,
    meeting: payload.meeting || {},
    startsAt: payload.startsAt || new Date(Date.now() + 1000 * 60 * 60),
    participants: [user._id],
  });

  realtimeHub.publish("group-session:created", { sessionId: session._id });
  return session;
}

async function joinGroupSession(user, sessionId) {
  const session = await CommunityGroupSession.findById(sessionId);
  if (!session || !["open", "full"].includes(session.status)) {
    const err = new Error("Group session is not available");
    err.statusCode = 404;
    throw err;
  }
  const alreadyJoined = session.participants.some((id) => String(id) === String(user._id));
  if (!alreadyJoined && session.participants.length >= session.capacity) {
    session.status = "full";
    await session.save();
    const err = new Error("Group session is full");
    err.statusCode = 409;
    throw err;
  }
  session.participants.addToSet(user._id);
  if (session.participants.length >= session.capacity) session.status = "full";
  await session.save();

  if (String(session.host) !== String(user._id)) {
    await notificationService.createNotification(session.host, {
      type: "session",
      title: "New group session participant",
      body: `${user.name} joined ${session.title}.`,
      link: "/community?tab=sessions",
    });
  }
  return session;
}

async function leaveGroupSession(user, sessionId) {
  const session = await CommunityGroupSession.findById(sessionId);
  if (!session) {
    const err = new Error("Group session not found");
    err.statusCode = 404;
    throw err;
  }
  session.participants.pull(user._id);
  if (session.status === "full" && session.participants.length < session.capacity) {
    session.status = "open";
  }
  await session.save();
  return session;
}

module.exports = {
  ensureProfessionalHost,
  getOverview,
  listFeed,
  createPost,
  updatePost,
  deletePost,
  reactToPost,
  savePost,
  sharePost,
  addComment,
  listComments,
  reportTarget,
  listCircles,
  createCircle,
  joinCircle,
  leaveCircle,
  createCheckIn,
  listMyCheckIns,
  listChallenges,
  createChallenge,
  joinChallenge,
  completeChallengeTask,
  completeChallenge,
  myChallengeProgress,
  inviteBuddy,
  acceptBuddy,
  listBuddies,
  encourageBuddy,
  listRooms,
  createRoom,
  joinRoom,
  leaveRoom,
  addRoomMessage,
  listRoomMessages,
  leaderboard,
  notifications,
  markNotificationRead,
  moderationQueue,
  moderatePost,
  reviewReport,
  communityHealth,
  listGroupSessions,
  createGroupSession,
  joinGroupSession,
  leaveGroupSession,
};
