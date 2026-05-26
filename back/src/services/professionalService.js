const User = require("../models/User");

class ProfessionalService {
  async applyToBeProfessional(userId, profileData) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    user.role = "professional";
    user.professionalProfile = {
      ...profileData,
      verified: false, // Admin must verify later
    };

    await user.save({ validateBeforeSave: false });
    return user;
  }

  async getStats(professionalId) {
    const Review = require("../models/Review");
    const reviews = await Review.find({ professional: professionalId });
    let averageRating = "0.0";
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
      averageRating = (sum / reviews.length).toFixed(1);
    }
    return { averageRating };
  }

  async getProfessionals(filters = {}) {
    const query = {
      role: "professional",
      "professionalProfile.verified": true,
    };

    // Add filters logic here (e.g. price, language)
    if (filters.language) {
      query["professionalProfile.languages"] = filters.language;
    }

    // Simplistic sorting
    let sortObj = {};
    if (filters.sort === "price_asc") {
      sortObj["professionalProfile.price_per_session"] = 1;
    }

    return await User.find(query).sort(sortObj).select("-password");
  }

  async getProfessionalById(id) {
    return await User.findOne({ _id: id, role: "professional" }).select(
      "-password",
    );
  }

  async toggleFollow(userId, professionalId) {
    const user = await User.findById(userId);
    const professional = await User.findOne({
      _id: professionalId,
      role: "professional",
    });

    if (!user || !professional) {
      throw new Error("User or Professional not found");
    }

    const isFollowing = user.following.includes(professionalId);

    if (isFollowing) {
      // Unfollow
      user.following = user.following.filter(
        (id) => id.toString() !== professionalId.toString(),
      );
      professional.followers = professional.followers.filter(
        (id) => id.toString() !== userId.toString(),
      );
    } else {
      // Follow
      user.following.push(professionalId);
      professional.followers.push(userId);
    }

    await user.save({ validateBeforeSave: false });
    await professional.save({ validateBeforeSave: false });

    return {
      isFollowing: !isFollowing,
      followersCount: professional.followers.length,
    };
  }
}

module.exports = new ProfessionalService();
