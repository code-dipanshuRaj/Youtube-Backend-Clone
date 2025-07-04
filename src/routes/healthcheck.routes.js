import { healthcheck } from "../controllers/healthcheck.controller.js";
import { Router } from "express";
// essential for segregation purpose only

const router = new Router();

router.route("/").get(healthcheck);
router.route("/test").get(healthcheck);

export default router;
