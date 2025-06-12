const express = require("express");

const {protect,adminOnly} = require("../middlewares/authMiddleware");
const { getDashboardData, getUserDashboardData, getTasks, GetTaskById, createTask, updateTask, deleteTask, updateTaskStatus, updateTaskCheckList } = require("../controller/taskController");

const router = express.Router();
// task manager

router.get("/dashboard-data",protect, getDashboardData);
router.get("/user-dashboard-data", protect, getUserDashboardData);
router.get("/",protect, getTasks);
router.get("/:id",protect,GetTaskById);
router.post("/",protect,adminOnly,createTask);
router.put("/:id", protect,updateTask);
router.delete("/:id",protect,deleteTask);
router.put("/:id/status",protect,updateTaskStatus);
router.put("/:id/todo",protect,updateTaskCheckList);
module.exports= router;
