const professionalService = require("../services/professionalService");

exports.apply = async (req, res) => {
  try {
    const user = await professionalService.applyToBeProfessional(
      req.user.id,
      req.body,
    );
    res.status(200).json({ status: "success", data: { user } });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

exports.getMyStats = async (req, res) => {
  try {
    const stats = await professionalService.getStats(req.user.id);
    res.status(200).json({ status: "success", data: stats });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

exports.getAllProfessionals = async (req, res) => {
  try {
    const professionals = await professionalService.getProfessionals(req.query);
    res.status(200).json({ status: "success", data: { professionals } });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

exports.getProfessional = async (req, res) => {
  try {
    const professional = await professionalService.getProfessionalById(
      req.params.id,
    );
    if (!professional) {
      return res
        .status(404)
        .json({ status: "fail", message: "Professional not found" });
    }
    res.status(200).json({ status: "success", data: { professional } });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

exports.follow = async (req, res) => {
  try {
    const result = await professionalService.toggleFollow(
      req.user.id,
      req.params.id,
    );
    res.status(200).json({ status: "success", data: result });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};
