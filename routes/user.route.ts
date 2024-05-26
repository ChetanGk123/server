import express from "express";
import {
  activateUserAccount,
  loginUser,
  logoutUser,
  updateAccessToken,
  registrationUser,
  getUserInfo,
  socialAuth,
  updateUserInfo,
  updateUserPassword,
  updateUserProfilePic,
  getAllUsers,
  updateUserRole,
  deleteUser,
} from "../controllers/user.controller";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
const userRouter = express.Router();

userRouter.post("/registration", registrationUser);
userRouter.post("/activate-user", activateUserAccount);
userRouter.post("/login", loginUser);
userRouter.get("/logout", isAuthenticated, logoutUser);
userRouter.get("/me", isAuthenticated, getUserInfo);
userRouter.get("/refresh-token", updateAccessToken);
userRouter.get("/getUserInfo", isAuthenticated, getUserInfo);
userRouter.post("/social-auth", socialAuth);
userRouter.put("/update-user-info", isAuthenticated, updateUserInfo);
userRouter.put("/update-password", isAuthenticated, updateUserPassword);
userRouter.put("/update-profile-pic", isAuthenticated, updateUserProfilePic);
userRouter.get("/get-users", isAuthenticated, authorizeRoles("admin"), getAllUsers);
userRouter.delete("/delete-user/:id", isAuthenticated, authorizeRoles("admin"), deleteUser);
userRouter.put("/update-user", isAuthenticated, authorizeRoles("admin"), updateUserRole);
export default userRouter;
