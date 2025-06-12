const Task=  require("../models/Task");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// @desc get all user (admin only)

//@route GET /api/users/

//@access private admin

const getUsers = async(req,res) =>{
    try {
        const users = await User.find({role:'member'}).select('-password');
        // add task counts to each users 
        const userWithTaskCounts = await Promise.all(users.map(async(user)=>{
            const pendingTasks = await Task.countDocuments({assignedTo:user._id,status:'Pending'});
            const inProgressTasks = await Task.countDocuments({assignedTo:user._id,status:"In Progress"});
            const completedTasks = await Task.countDocuments({assignedTo:user._id,status:"Completed"});
            return {
                ...user._doc,
                pendingTasks,
                inProgressTasks,
                completedTasks,
            };
        }));
        res.json(userWithTaskCounts);
    } catch (error) {
        res.status(500).json({message:"Server error",error:error.message});
    }
};
//@desc  get user by id
// @router GET /api/users/:id
// @access Private
const getUserById = async(req,res) =>{
    try {
        const user = await User.findById(req.params.id).select("-password");
            if(!user)
            {
                return res.status(404).json({message:"User Not Found"});
            };
            res.json(user)


    } catch (error) {
        res.status(500).json({message:"Server error",error:error.message});
    }
}
//@desc delete user(admin only)
//@router DELETE /api/user/:id
//@access Private
// const deleteUser = async(req,res)=>{
//     try {
        
//     } catch (error) {
//         res.status(500).json({message:"Server error",error:error.message});
//     }
// }
module.exports = {getUsers,getUserById};