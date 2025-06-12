const express = require("express");
const { protect, adminOnly } = require("../middlewares/authMiddleware");
const { exportTaskReport, exportUsersReport } = require("../controller/reportController");

const router = express.Router();
router.get("/export/tasks",protect,adminOnly,exportTaskReport);
router.get("/export/users", protect,adminOnly,exportUsersReport);
module.exports = router;