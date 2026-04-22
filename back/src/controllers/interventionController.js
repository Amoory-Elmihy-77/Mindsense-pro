const aiService = require("../services/aiService");

exports.getAdvice = async (req, res) => {
  try {
    const { state } = req.body;

    if (!state) {
      return res.status(400).json({ error: "state is required" });
    }

    const result = await aiService.getIntervention(state);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
