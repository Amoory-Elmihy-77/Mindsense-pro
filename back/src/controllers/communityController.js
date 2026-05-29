const communityService = require("../services/communityService");

const send = (res, data, status = 200) => res.status(status).json({ status: "success", data });
const fail = (res, err) => res.status(err.statusCode || 500).json({ status: "fail", message: err.message });

exports.overview = async (req, res) => {
  try { send(res, await communityService.getOverview(req.user.id)); } catch (err) { fail(res, err); }
};

exports.feed = async (req, res) => {
  try { send(res, await communityService.listFeed(req.user, req.query)); } catch (err) { fail(res, err); }
};

exports.createPost = async (req, res) => {
  try { send(res, await communityService.createPost(req.user, req.body), 201); } catch (err) { fail(res, err); }
};

exports.updatePost = async (req, res) => {
  try { send(res, await communityService.updatePost(req.user, req.params.id, req.body)); } catch (err) { fail(res, err); }
};

exports.deletePost = async (req, res) => {
  try { send(res, await communityService.deletePost(req.user, req.params.id)); } catch (err) { fail(res, err); }
};

exports.reactToPost = async (req, res) => {
  try { send(res, await communityService.reactToPost(req.user, req.params.id, req.body.type)); } catch (err) { fail(res, err); }
};

exports.savePost = async (req, res) => {
  try { send(res, await communityService.savePost(req.user, req.params.id)); } catch (err) { fail(res, err); }
};

exports.sharePost = async (req, res) => {
  try { send(res, await communityService.sharePost(req.user, req.params.id)); } catch (err) { fail(res, err); }
};

exports.comments = async (req, res) => {
  try { send(res, await communityService.listComments(req.params.id)); } catch (err) { fail(res, err); }
};

exports.addComment = async (req, res) => {
  try { send(res, await communityService.addComment(req.user, req.params.id, req.body), 201); } catch (err) { fail(res, err); }
};

exports.report = async (req, res) => {
  try { send(res, await communityService.reportTarget(req.user, req.body), 201); } catch (err) { fail(res, err); }
};

exports.circles = async (req, res) => {
  try { send(res, await communityService.listCircles()); } catch (err) { fail(res, err); }
};

exports.createCircle = async (req, res) => {
  try { send(res, await communityService.createCircle(req.user, req.body), 201); } catch (err) { fail(res, err); }
};

exports.joinCircle = async (req, res) => {
  try { send(res, await communityService.joinCircle(req.user, req.params.id)); } catch (err) { fail(res, err); }
};

exports.leaveCircle = async (req, res) => {
  try { send(res, await communityService.leaveCircle(req.user, req.params.id)); } catch (err) { fail(res, err); }
};

exports.checkIn = async (req, res) => {
  try { send(res, await communityService.createCheckIn(req.user, req.body), 201); } catch (err) { fail(res, err); }
};

exports.myCheckIns = async (req, res) => {
  try { send(res, await communityService.listMyCheckIns(req.user.id)); } catch (err) { fail(res, err); }
};

exports.challenges = async (req, res) => {
  try { send(res, await communityService.listChallenges(req.query)); } catch (err) { fail(res, err); }
};

exports.createChallenge = async (req, res) => {
  try { send(res, await communityService.createChallenge(req.user, req.body), 201); } catch (err) { fail(res, err); }
};

exports.joinChallenge = async (req, res) => {
  try { send(res, await communityService.joinChallenge(req.user, req.params.id)); } catch (err) { fail(res, err); }
};

exports.completeChallengeTask = async (req, res) => {
  try { send(res, await communityService.completeChallengeTask(req.user, req.params.id, req.body.taskId)); } catch (err) { fail(res, err); }
};

exports.completeChallenge = async (req, res) => {
  try { send(res, await communityService.completeChallenge(req.user, req.params.id)); } catch (err) { fail(res, err); }
};

exports.myChallenges = async (req, res) => {
  try { send(res, await communityService.myChallengeProgress(req.user.id)); } catch (err) { fail(res, err); }
};

exports.buddies = async (req, res) => {
  try { send(res, await communityService.listBuddies(req.user.id)); } catch (err) { fail(res, err); }
};

exports.inviteBuddy = async (req, res) => {
  try { send(res, await communityService.inviteBuddy(req.user, req.body), 201); } catch (err) { fail(res, err); }
};

exports.acceptBuddy = async (req, res) => {
  try { send(res, await communityService.acceptBuddy(req.user, req.params.id)); } catch (err) { fail(res, err); }
};

exports.encourageBuddy = async (req, res) => {
  try { send(res, await communityService.encourageBuddy(req.user, req.params.id, req.body.message)); } catch (err) { fail(res, err); }
};

exports.rooms = async (req, res) => {
  try { send(res, await communityService.listRooms()); } catch (err) { fail(res, err); }
};

exports.createRoom = async (req, res) => {
  try { send(res, await communityService.createRoom(req.user, req.body), 201); } catch (err) { fail(res, err); }
};

exports.joinRoom = async (req, res) => {
  try { send(res, await communityService.joinRoom(req.user, req.params.id)); } catch (err) { fail(res, err); }
};

exports.leaveRoom = async (req, res) => {
  try { send(res, await communityService.leaveRoom(req.user, req.params.id)); } catch (err) { fail(res, err); }
};

exports.roomMessages = async (req, res) => {
  try { send(res, await communityService.listRoomMessages(req.params.id)); } catch (err) { fail(res, err); }
};

exports.addRoomMessage = async (req, res) => {
  try { send(res, await communityService.addRoomMessage(req.user, req.params.id, req.body), 201); } catch (err) { fail(res, err); }
};

exports.leaderboard = async (req, res) => {
  try { send(res, await communityService.leaderboard(req.query)); } catch (err) { fail(res, err); }
};

exports.notifications = async (req, res) => {
  try { send(res, await communityService.notifications(req.user.id)); } catch (err) { fail(res, err); }
};

exports.readNotification = async (req, res) => {
  try { send(res, await communityService.markNotificationRead(req.user.id, req.params.id)); } catch (err) { fail(res, err); }
};

exports.moderationQueue = async (req, res) => {
  try { send(res, await communityService.moderationQueue(req.user)); } catch (err) { fail(res, err); }
};

exports.moderatePost = async (req, res) => {
  try { send(res, await communityService.moderatePost(req.user, req.params.id, req.body.action, req.body.reason)); } catch (err) { fail(res, err); }
};

exports.reviewReport = async (req, res) => {
  try { send(res, await communityService.reviewReport(req.user, req.params.id, req.body)); } catch (err) { fail(res, err); }
};

exports.communityHealth = async (req, res) => {
  try { send(res, await communityService.communityHealth()); } catch (err) { fail(res, err); }
};

exports.groupSessions = async (req, res) => {
  try { send(res, await communityService.listGroupSessions(req.query)); } catch (err) { fail(res, err); }
};

exports.createGroupSession = async (req, res) => {
  try { send(res, await communityService.createGroupSession(req.user, req.body), 201); } catch (err) { fail(res, err); }
};

exports.joinGroupSession = async (req, res) => {
  try { send(res, await communityService.joinGroupSession(req.user, req.params.id)); } catch (err) { fail(res, err); }
};

exports.leaveGroupSession = async (req, res) => {
  try { send(res, await communityService.leaveGroupSession(req.user, req.params.id)); } catch (err) { fail(res, err); }
};
