const Task= require("../models/Task");
const User = require("../models/User");
const excelJS = require("exceljs");
//@desc export all task as exel file 
//Route GET /api/reports/tasks
//@access private admin

const exportTaskReport = async(req,res)=>{
    try {
        const tasks  = await Task.find().populate("assignedTo","name email");

        const workbook = new excelJS.Workbook();
        const worksheet= workbook.addWorksheet("Task Report");

        worksheet.columns=[
            {header: "Task ID", key:"_id",width:25},
            {header: "Title", key:"title",width:30},
            {header: "Description", key:"description",width:50},
            {header: "Priority", key:"priority",width:15},
            {header: "Status", key:"status",width:25},
            {header: "Due Date", key:"dueDate",width:25},
            {header: "Assigned To", key:"assignedTo",width:30},

        ];
        tasks.forEach((task)=>{
            const assignedTo = task.assignedTo
                .map((user)=>`${user.name} (${user.email})`)
                .join(", ");
            worksheet.addRow({
                _id:task._id,
                title:task.title,
                description:task.description,
                priority:task.priority,
                status:task.status,
                dueDate:task.dueDate.toISOString().split("T")[0],
                assignedTo:assignedTo || "Unassigned",
            });
        });
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            'attachment;filename="task_report.xlsx"'
        );
        return workbook.xlsx.write(res).then(()=>{
            res.end();
        });
    } catch (error) {
        res
        .status(500)
        .json({
            message:"Error Exporting tasks",error:error.message
        })
    }
}

const exportUsersReport = async(req,res)=>{
    try {
        const users = await  User.find().select("name email  _id").lean();
        const userTasks = await Task.find().populate(
            "assignedTo",
            "name email _id"

        );
        const userTaskMap = {};
        users.forEach((user)=>{
            userTaskMap[user._id]= {
                name:user.name,
                email:user.email,
                taskCount:0,
                pendingTasks:0,
                inProgressTasks:0,
                completedTasks:0,
            };
        });
        userTasks.forEach((task)=>{
            if(task.assignedTo){
                task.assignedTo.forEach((assignedUser)=>{
                    if(userTaskMap[assignedUser._id]){
                        userTaskMap[assignedUser._id].taskCount +=1;
                        if(task.status==="Pending")
                        {
                            userTaskMap[assignedUser._id].pendingTasks+=1;
                        }
                        else if( task.status==="In Progress")
                        { 
                            userTaskMap[assignedUser._id].inProgressTasks+=1;
                        }
                        else
                        {
                            userTaskMap[assignedUser._id].completedTasks+=1;
                        }
                    }
                });
            }
        });

        const workbook = new excelJS.Workbook();
        const worksheet = workbook.addWorksheet("User Task Report");
        worksheet.columns =[
            { header:"User Name",key :"name",with:30},
            { header:"Email",key :"email",with:40},
            { header:"Total Assigned Tasks",key :"taskCount",with:25},
            { header:"Pending Tasks",key :"pendingTasks",with:25},
            { header:"In progress Tasks",key :"inProgressTasks",with:25},
            { header:"Completed Tasks",key :"completedTasks",with:25},
        ];
        Object.values(userTaskMap).forEach((user)=>{
            worksheet.addRow(user);
        });
        
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            'attachment;filename="user_report.xlsx"'
        );
        return workbook.xlsx.write(res).then(()=>{
            res.end();
        });

    } catch (error) {
        res
        .status(500)
        .json({
            message:"Error Exporting tasks",error:error.message
        })
    }
}

module.exports = {exportTaskReport,exportUsersReport}