import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import { getCoursesAnalytics, getOrdersAnalytics, getUsersAnalytics } from "../controllers/analtics.controller";

const analyticsRouter = express.Router();

analyticsRouter.get("/get-users-analytics",isAuthenticated, authorizeRoles("admin"), getUsersAnalytics)
analyticsRouter.get("/get-courses-analytics",isAuthenticated, authorizeRoles("admin"), getCoursesAnalytics)
analyticsRouter.get("/get-orders-analytics",isAuthenticated, authorizeRoles("admin"), getOrdersAnalytics)

export default analyticsRouter;