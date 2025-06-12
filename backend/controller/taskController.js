const Task = require("../models/Task");

//@desc get all task
//@route get /api/tasks
//@access Private

const getTasks = async(req,res)=>{
    try {
        const { status} = req.query;
        let filter = {};
        if(status)
        {
            filter.status= status;
        }
        let tasks;
        if(req.user.role === "admin")
        {
            tasks = await Task.find(filter).populate(
                "assignedTo",
                "name email profileImageUrl"
            );
        }
        else
        {
            tasks = await Task.find({...filter,assignedTo: req.user._id}).populate(
                "assignedTo",
                "name email profileImageUrl"
            );
        }
        // add completed todochecklitst count to each task
        tasks = await Promise.all(
            tasks.map(async(task)=>{
                const completedCount = task.todoChecklist.filter(
                    (item)=>item.completed
                ).length;
                return{...task._doc, completedTodoCount:completedCount};

            })
        );
         //status summary count   
         const allTasks = await Task.countDocuments(
            req.user.role=== "admin"?{}:{assignedTo:req.user._id}
         );

         const pendingTasks= await Task.countDocuments({
            ...filter,
            status:"Pending",
            ...(req.user.role !=="admin" && {assignedTo:req.user._id}),

         });
         const inProgressTasks = await Task.countDocuments({
            ...filter,
            status:"In Progress",
            ...(req.user.role !=="admin" && {assignedTo:req.user._id}),
         });
         const completedTasks = await Task.countDocuments({
            ...filter,
            status:"Completed",
            ...(req.user.role !=="admin" && {assignedTo:req.user._id}),
         });
         return res.json({
            tasks,
            statusSummary:{
                all: allTasks,
                pendingTasks,
                inProgressTasks,
                completedTasks
            },
         });
    } catch (error) {
        res.status(500).json({message:"Server Error",error:error.message});

    }
}
//@desc get task by id
//@route get /api/tasks/:id
//@access Private
const GetTaskById = async(req,res)=>{
    try {
        
        const task = await Task.findById(req.params.id).populate(
            "assignedTo",
            "name email profileImageUrl"
        );
        if(!task) return res.status(404).json({message:"Task not found"});
        return res.json(task);
    } catch (error) {
        res.status(500).json({message:"Server Error",error:error.message});

    }
}

//@desc create a new task admin only
//@route get /api/tasks/
//@access Private(admin)

const createTask = async(req,res)=>{
    try {
        const {
            title,
            description,
            priority,
            dueDate,
            assignedTo,
            attachments,
            todoChecklist,
        }= req.body;

        if (!Array.isArray(assignedTo)) {
            return res
            .status(400)
            .json({message:"assignedTo must be an array of user IDs"});
        } 

        const task = await Task.create({
         
                title,
                description,
                priority,
                dueDate,
                assignedTo,
                createdBy:req.user._id,
                attachments,
                todoChecklist,
        });
        res.status(201).json({message:"Task create succesfully",task});

    } catch (error) {
        res.status(500).json({message:"Server Error",error:error.message});

    }
}

//@desc update task details
//@route get /api/tasks/:id
//@access Private

const updateTask = async(req,res)=>{
    try {
        const task= await Task.findById(req.params.id);
        if(!task) return res.status(404).json({message:"Task Not Found"});
        task.title= req.body.title || task.title;
        task.description=req.body.description || task.description;
        task.priority = req.body.priority || task.priority;
        task.dueDate = req.body.dueDate || task.dueDate;
        task.todoChecklist = req.body.todoChecklist || task.todoChecklist;
        task.attachments = req.body.attachments || task.attachments;

        if(req.body.assignedTo)
        {
            if(!Array.isArray(req.body.assignedTo))
            {
                return res
                .status(400)
                .json({message:"assignedTo must be an array or usersID"});

            }
            task.assignedTo = req.body.assignedTo;
        }
        const updateTask = await task.save();
        res.json({
            message:"Task update succesfully",
            updateTask
        })
    } catch (error) {
        res.status(500).json({message:"Server Error",error:error.message});

    }
}
//@desc delete task (admin)
//@route delete /api/tasks/:id
//@access Private (admin)
const deleteTask = async(req,res) =>{
    try {
        const task = await Task.findById(req.params.id);
        if(!task) return res.status(404).json({message:"Task not found"});
        await task.deleteOne();
        res.json({message:"Task deleted successfully"});

    } catch (error) {
        res.status(500).json({message:"Server Error",error:error.message});

    }
}

//@desc update status task
//@route put /api/tasks/:id/status
//@access Private 
const updateTaskStatus = async(req,res) =>{
    try {
        const task = await Task.findById(req.params.id);
        if(!task) return res.status(404).json({message:"Task not found"});
        
        const isAssigned = Array.isArray(task.assignedTo) && task.assignedTo.some(
            (userId) => userId.toString() === req.user._id.toString()
        );
        if(!isAssigned && req.user.role !=="admin")
        {
            return res.status(403).json({message:"Not Authorized"});
        }
        task.status =req.body.status || task.status;
        if(task.status === "Completed")
        {
            task.todoChecklist.forEach((item)=>{item.completed= true});
            task.progress =100;
        }
        await task.save();
         res.json({message:"Task status updated succesfully",task});
    } catch (error) {
        res.status(500).json({message:"Server Error",error:error.message});

    }
}
//@desc update task todo
//@route put /api/tasks/:id/checklist
//@access Private 
const updateTaskCheckList = async(req,res)=>{
    try {
        const { todoChecklist} = req.body;
        const task= await Task.findById(req.params.id);
        if(!task)  return res.status(404).json({message:"Task not found"});

        const assignedTo = Array.isArray(task.assignedTo)
  ? task.assignedTo
  : task.assignedTo ? [task.assignedTo] : [];

if (
  !assignedTo.some(id => id.toString() === req.user._id.toString()) &&
  req.user.role !== "admin"
) {
  return res.status(403).json({
    message: "Not authorized"
  });
}

        task.todoChecklist = todoChecklist;

        // auto progress based on checklist completion
        const completedCount= task.todoChecklist.filter(
            (item)=>item.completed
        ).length;
        const totalItems =task.todoChecklist.length;
        task.progress= totalItems >0 ? Math.round((completedCount/totalItems)*100):0;

        //auto mark task as completed  if all item are checked
        if(task.progress===100)
        {
            task.status= "Completed";
        }
        else if(task.progress >0)
        {
            task.status= "In Progress";
        }
        else
        {
            task.status= "Pending";
        }
        await task.save();
        const updatedTask =await Task.findById(req.params.id).populate(
            "assignedTo",
            "name email profileImageUrl"
        );
        res.json({message:"Task list updated success",task:updatedTask})
    } catch (error) {
        res.status(500).json({message:"Server Error",error:error.message});

    }
}
//@desc dashboard data admin
//@route get /api/tasks/dashboard-data
//@access Private 
const getDashboardData = async(req,res)=>{
    try {
        const totalTasks = await Task.countDocuments();
        const pendingTasks= await Task.countDocuments({status:"Pending"});
        const completedTasks= await Task.countDocuments({status:"Completed"});
        const overdueTasks= await Task.countDocuments({
            status: {$ne: "Completed"},
            dueDate: {$lt: new Date()},
        });

        const taskStatuses = ["Pending","In Progress","Completed"];
        const taskDistributionRaw= await Task.aggregate([
            {
                $group:{
                    _id: "$status",
                    count: {$sum:1},
                },
            },
        ]);
        const taskDistribution = taskStatuses.reduce((acc,status)=>{
            const formattedKey = status.replace(/\s+/g,"");
            acc[formattedKey]= 
                taskDistributionRaw.find((item)=> item._id === status)?.count || 0 ;
                return acc;
        },{});
        taskDistribution["All"]= totalTasks;


        const taskPriorities = ["Low","Medium","High"];
        const taskPriorityLevelRaw = await Task.aggregate([
            {
                $group:{
                    _id: "$priority",
                    count:{$sum: 1},
                },
            },
        ]);
        const taskPriorityLevels = taskPriorities.reduce((acc,priority)=>{
            acc[priority]=
                taskPriorityLevelRaw.find((item)=>item._id === priority)?.count ||0;
                return acc;
        },{})

        //fetch to 10 tasks
        const recentTasks = await Task.find()
            .sort({createAt:-1})
            .limit(10)
            .select('title status priority dueDate createdAt');
        
        res.status(200).json({
            statistics:{
                totalTasks,
                pendingTasks,
                completedTasks,
                overdueTasks,
            },
            charts:{
                taskDistribution,
                taskPriorityLevels,
            },
            recentTasks,
        })
    } catch (error) {
        res.status(500).json({message:"Server Error",error:error.message});

    }
}

//@desc dashboard data user
//@route get /api/tasks/user-dashboard-data
//@access Private 
const getUserDashboardData = async(req,res)=>{
    try {
        const userId = req.user._id;

        const totalTasks = await Task.countDocuments({assignedTo:userId});
        const pendingTasks= await Task.countDocuments({assignedTo:userId,status:"Pending"});
        const completedTasks= await Task.countDocuments({assignedTo:userId,status:"Completed"});
        const overdueTasks= await Task.countDocuments({
            assignedTo:userId,
            status: {$ne: "Completed"},
            dueDate: {$lt: new Date()},
        });
        const taskStatuses = ["Pending","In Progress","Completed"];
        const taskDistributionRaw= await Task.aggregate([
            {
                $match:{assignedTo:userId}
            },
            {
                $group:{
                    _id: "$status",
                    count: {$sum: 1},
                },
            },
        ]);
        const taskDistribution = taskStatuses.reduce((acc,status)=>{
            const formattedKey = status.replace(/\s+/g,"");
            acc[formattedKey]= 
                taskDistributionRaw.find((item)=> item._id === status)?.count || 0 ;
                return acc;
        },{});
        taskDistribution["All"]= totalTasks;


        const taskPriorities = ["Low","Medium","High"];
        const taskPriorityLevelRaw = await Task.aggregate([
            {
                $match:{assignedTo:userId}
            },
            {
                $group:{
                    _id: "$priority",
                    count:{$sum: 1},
                },
            },
        ]);
        const taskPriorityLevels = taskPriorities.reduce((acc,priority)=>{
            acc[priority]=
                taskPriorityLevelRaw.find((item)=>item._id === priority)?.count ||0;
                return acc;
        },{})

        //fetch to 10 tasks
        const recentTasks = await Task.find({assignedTo:userId})
            .sort({createAt:-1})
            .limit(10)
            .select('title status priority dueDate CreateAt');
        
        res.status(200).json({
            statistics:{
                totalTasks,
                pendingTasks,
                completedTasks,
                overdueTasks,
            },
            charts:{
                taskDistribution,
                taskPriorityLevels,
            },
            recentTasks,
        })
    } catch (error) {
        res.status(500).json({message:"Server Error",error:error.message});

    }
}
module.exports = {
    getTasks,
    GetTaskById,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    updateTaskCheckList,
    getDashboardData,
    getUserDashboardData,
};