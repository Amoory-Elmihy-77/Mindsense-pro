const { CommunityNotification } = require("../repositories/communityRepository");
const realtimeHub = require("../realtime/communityHub");

async function createNotification(userId, payload) {
  const notification = await CommunityNotification.create({
    user: userId,
    type: payload.type,
    title: payload.title,
    body: payload.body,
    link: payload.link,
    channels: payload.channels,
  });

  realtimeHub.publishToUser(String(userId), "notification", notification.toObject());
  return notification;
}

module.exports = {
  createNotification,
};
