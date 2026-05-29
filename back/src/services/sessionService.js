const SessionBooking = require("../models/SessionBooking");
const User = require("../models/User");
const meetingService = require("./meetingService");
const paymentService = require("./paymentService");
const sendEmail = require("../utils/email");

class SessionService {
  async bookSession(userId, professionalId, startTime, endTime, paymentDetails = {}) {
    const professional = await User.findById(professionalId);
    if (
      !professional ||
      professional.role !== "professional" ||
      !professional.professionalProfile.verified
    ) {
      throw new Error("Professional is not available or verified");
    }

    const price = professional.professionalProfile.price_per_session || 0;
    if (!paymentDetails.method || !paymentDetails.proofImage) {
      throw new Error("Please upload a payment transfer screenshot before booking");
    }

    const newSession = await SessionBooking.create({
      user: userId,
      professional: professionalId,
      price: price,
      start_time: startTime,
      end_time: endTime,
      payment_method: paymentDetails.method,
      payment_proof_image: paymentDetails.proofImage,
      payment_reference: paymentDetails.reference,
      status: "pending", // waits for professional to accept
    });

    return newSession;
  }

  async payForSession(sessionId, userId) {
    const session = await SessionBooking.findOne({
      _id: sessionId,
      user: userId,
      status: "accepted", // Requires it to be accepted first
    });
    if (!session)
      throw new Error("Session not found or not accepted by professional yet");

    // Simulate payment gateway interaction here...
    session.status = "paid";
    await session.save();
    return session;
  }

  async rateSession(sessionId, userId, rating, comment) {
    const Review = require("../models/Review");
    
    const session = await SessionBooking.findOne({
      _id: sessionId,
      user: userId,
      status: "completed"
    });
    
    if (!session) {
      throw new Error("Session not found or not completed yet");
    }
    
    const existingReview = await Review.findOne({ sessionBooking: sessionId });
    if (existingReview) {
      throw new Error("You have already rated this session");
    }
    
    const review = await Review.create({
      user: userId,
      professional: session.professional,
      sessionBooking: sessionId,
      rating: rating,
      comment: comment || ""
    });
    
    return review;
  }

  async acceptSession(sessionId, professionalId) {
    const session = await SessionBooking.findOne({
      _id: sessionId,
      professional: professionalId,
      status: "pending",
    })
      .populate("user", "name email")
      .populate("professional", "name");

    if (!session) throw new Error("Session not found or not in pending status");

    const meeting = await meetingService.generateMeetingLink(session);
    session.meeting_url = meeting.url;
    // session.meeting_id = meeting.meeting_id; // (if used)

    session.status = "paid";
    await session.save();

    try {
      await sendEmail({
        email: session.user.email,
        subject: "Session Request Accepted - MindSense",
        message: `Hello ${session.user.name},\n\nDr. ${session.professional.name} has reviewed your payment proof and accepted your meeting request.\nStatus: Paid\n\nPlease log in to your MindSense App and visit 'My Appointments' to join your session.\nGoogle Meet Link: ${session.meeting_url}\n\nBest regards,\nMindSense Team`,
      });
    } catch (err) {
      console.log(
        "Could not send email. Make sure SMTP credentials are set in .env",
        err.message,
      );
    }

    return session;
  }

  async rejectSession(sessionId, professionalId) {
    const session = await SessionBooking.findOne({
      _id: sessionId,
      professional: professionalId,
      status: "pending",
    });
    if (!session) throw new Error("Session not found or not in pending status");

    session.status = "rejected";
    await session.save();
    return session;
  }

  async completeSession(sessionId, professionalId) {
    const session = await SessionBooking.findOne({
      _id: sessionId,
      professional: professionalId,
      status: "paid",
    });
    if (!session) throw new Error("Session not found or not in paid status");

    session.status = "completed";
    await session.save();

    // Trigger payment transfer to wallet
    await paymentService.processPayment(session);

    return session;
  }

  async markAsSeen(sessionId, professionalId) {
    const session = await SessionBooking.findOne({
      _id: sessionId,
      professional: professionalId,
    });
    if (!session) throw new Error("Session not found");

    session.doctor_seen = true;
    await session.save();
    return session;
  }

  async deleteSession(sessionId, professionalId) {
    const session = await SessionBooking.findOne({
      _id: sessionId,
      professional: professionalId,
    });
    if (!session) throw new Error("Session not found");
    if (!session.doctor_seen && session.status !== "rejected") {
      throw new Error("Can only delete sessions that are marked as seen or rejected");
    }

    await SessionBooking.findByIdAndDelete(sessionId);
    return;
  }

  async getProfessionalSessions(professionalId) {
    return await SessionBooking.find({ professional: professionalId })
      .populate("user", "name email")
      .sort({ start_time: -1 });
  }

  async getUserSessions(userId) {
    return await SessionBooking.find({ user: userId })
      .populate("professional", "name email professionalProfile.headline")
      .sort({ start_time: -1 });
  }
}

module.exports = new SessionService();
