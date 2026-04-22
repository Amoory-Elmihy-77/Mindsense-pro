const crypto = require("crypto");
const User = require("../../models/User");
const sendEmail = require("../../utils/email");

// Add Trusted Contact
exports.addTrustedContact = async (req, res) => {
  try {
    const { contactName, contactEmail, relationship } = req.body;

    const user = await User.findById(req.user.id);

    const approvalToken = crypto.randomBytes(32).toString("hex");

    user.trustedContact = {
      name: contactName,
      email: contactEmail,
      relationship: relationship,
      status: "pending",
      confirmationToken: approvalToken,
    };
    await user.save({ validateBeforeSave: false });

    // Approval Link
    const baseUrl =
      process.env.APP_BASE_URL || `${req.protocol}://${req.get("host")}`;
    const approvalLink = `${baseUrl}/api/v1/users/approve-contact/${approvalToken}`;

    const message = `
        Hello ${contactName},

        ${user.name} has added you as a trusted contact in the MindSense AI app.

        Your role is to receive notifications to check on them during times of high stress.

        If you agree, please click the following link:

        ${approvalLink}
        `;

    await sendEmail({
      email: contactEmail,
      subject: "An invitation to be a trustworthy person - MindSense AI",
      message,
    });

    res.status(200).json({
      status: "success",
      message: "An invitation was successfully sent to the trusted person.",
    });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

// Accept Trusted Contact
exports.acceptTrustedContact = async (req, res) => {
  try {
    const token = req.params.token;

    const user = await User.findOne({
      "trustedContact.confirmationToken": token,
    });

    if (!user) {
      return res.status(400).send(`
                <div style="text-align: center; padding: 50px; font-family: Arial;">
                    <h1 style="color: red;">Sorry! The link is invalid or expired.</h1>
                </div>
            `);
    }

    user.trustedContact.status = "accepted";
    user.trustedContact.confirmationToken = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).send(`
            <div style="text-align: center; padding: 50px; font-family: Arial;">
               <h1 style="color: green;">Invitation accepted successfully! ✅</h1>
                <p>Thank you, you are now a "trusted contact" for user ${user.name}.</p>
                <p>You will receive notifications if they detect high levels of stress.</p>
            </div>
        `);
  } catch (err) {
    res.status(500).send("Server error");
  }
};
