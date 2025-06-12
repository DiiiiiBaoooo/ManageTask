const express = require('express');
const { protect, adminOnly } = require('../middlewares/authMiddleware');
const { getUserById, getUsers } = require('../controller/userController');

const router = express.Router();
//user management router
 
router.get("/",protect, adminOnly,getUsers);
router.get("/:id",protect,getUserById);
// router.delete("/:id",protect,adminOnly,deleteUser);

module.exports = router;