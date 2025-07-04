import { 
  registerUser, 
  loginUser, 
  logoutUser, 
  refreshAccessToken,
  updatePassword,
  updateAvatar,
  updateFullname,
 } from "../controllers/user.controller.js";
import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = new Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1
    },
    {
      name: "coverImage",
      maxCount: 1
    }
  ]),  
  registerUser,
)

router.route("/login").post(upload.none(), loginUser)

// secured routes 
// - a valid access token is required
router.route("/logout").post(upload.none(), verifyToken, logoutUser)
// - a valid refresh token is required
router.route("/refresh-token").post(refreshAccessToken)
// - a valid user is needed
router.route("/change-password").patch(upload.none(), verifyToken, updatePassword)
// - a valid user is needed
router.route("/change-avatar").patch(upload.single("avatar"), verifyToken, updateAvatar)
// - a valid user is needed
router.route("/change-details").patch(verifyToken, updateFullname)

export default router;