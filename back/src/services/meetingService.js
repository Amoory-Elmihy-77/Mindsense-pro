const { v4: uuidv4 } = require("uuid");

class MeetingService {
  async generateMeetingLink(sessionDetails) {
    // Abstracting meeting logic. In reality, this communicates with Google Calendar API or Zoom/Twilio.
    // For now, generating a mock unique link.
    // Google Meet requires a format like 3letters-4letters-3letters (e.g. abc-defg-hij)

    const randomChars = (length) => {
      let result = "";
      const characters = "abcdefghijklmnopqrstuvwxyz";
      for (let i = 0; i < length; i++) {
        result += characters.charAt(
          Math.floor(Math.random() * characters.length),
        );
      }
      return result;
    };

    const meetingId = `${randomChars(3)}-${randomChars(4)}-${randomChars(3)}`;
    // Google Meet requires a real OAuth2 Calendar API integration to provision actual rooms.
    // Instead, using Jitsi Meet for instant, fully-functional video conferencing during development.
    const mockUrl = `https://meet.jit.si/MindSense-${meetingId}`;

    return {
      meeting_id: meetingId,
      url: mockUrl,
    };
  }
}

module.exports = new MeetingService();
