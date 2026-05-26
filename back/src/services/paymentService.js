const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const mongoose = require("mongoose");

class PaymentService {
  async ensureWalletExists(userId) {
    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      wallet = await Wallet.create({ user: userId });
    }
    return wallet;
  }

  async processPayment(session) {
    const session_mongoose = await mongoose.startSession();
    session_mongoose.startTransaction();
    try {
      const professionalWallet = await this.ensureWalletExists(
        session.professional,
      );

      const adminFee = session.price * 0.15; // 15% platform fee
      const professionalEarnings = session.price - adminFee;

      // Credit professional wallet
      professionalWallet.balance += professionalEarnings;
      await professionalWallet.save({ session: session_mongoose });

      // Record Transaction for Professional
      await Transaction.create(
        [
          {
            wallet: professionalWallet._id,
            sessionBooking: session._id,
            amount: professionalEarnings,
            type: "credit",
            status: "completed",
            description: "Session Earnings",
          },
        ],
        { session: session_mongoose },
      );

      // Record platform fee Transaction (can be tracked against a master platform wallet if desired)

      await session_mongoose.commitTransaction();
      session_mongoose.endSession();

      return true;
    } catch (err) {
      await session_mongoose.abortTransaction();
      session_mongoose.endSession();
      throw err;
    }
  }
}

module.exports = new PaymentService();
