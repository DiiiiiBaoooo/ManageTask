import React, { useEffect, useState } from 'react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import { PRIORITY_DATA } from '../../utils/data'
import axiosInstance from '../../utils/axiosInstance'
import toast from "react-hot-toast"
import { useLocation,useNavigate  } from 'react-router-dom'
import momemt from "moment"
import { LuTrash } from 'react-icons/lu'
import SelectDropdown from '../../components/Inputs/SelectDropdown'
import SelectUsers from '../../components/Inputs/SelectUsers'
import TodoListInput from '../../components/Inputs/TodoListInput'
import AddAttachmentsInput from '../../components/Inputs/AddAttachmentsInput'
import { API_PATHS } from '../../utils/apiPaths'
import Modal from '../../components/Modal'
import DeleteAlert from '../../components/DeleteAlert'
import socket from "../../utils/socket";

const CreateTask = () => {
    const location = useLocation();
    const {taskId} = location.state || {};
    const navigate = useNavigate();
    
    const [taskData,setTaskData] = useState({
        title:"",
        description:"",
        priority:"Low",
        dueDate:"",
        assignedTo:[],
        todoChecklist:[],
        attachments:[],
    });
    const [currentTask,setCurrentTask]= useState(null);
    
    const [error,setError] = useState("");
    const [loading,setLoading] = useState(false);
    const [openDeleteAlert,setOpenDeleteAlert] = useState(false);

    const handleValueChange = (key,value) =>{
        setTaskData((prevData)=>({...prevData, [key]: value }));
    };
    const clearData = () => {
        setTaskData({
            title:"",
            description:"",
            priority:"Low",
            dueDate:"",
            assignedTo:[],
            todoChecklist:[],
            attachments:[],
        })
    }

    //create task
    const  createTask = async () =>{
        setLoading(true);
        try {
            const todolist = taskData.todoChecklist?.map((item)=>({
                text:item,
                completed:false, 
            }));
            const response = await axiosInstance.post(API_PATHS.TASKS.CREATE_TASK,{
                ...taskData,
                dueDate: new Date(taskData.dueDate).toISOString(),
                todoChecklist:todolist,
            });
            socket.emit("task-updated"); // hoặc trong updateTask

            toast.success("task create success fully ");
            clearData();
        } catch (error) {
            console.error("Error create task: ",error);
            setLoading(false);
        }
        finally{
            setLoading(false)
        }
    };

    //update task
    const updateTask = async () => {
        setLoading(true);

        try {
            const todoList = taskData.todoChecklist?.map((item)=>{
                const prevTodoChecklist = currentTask?.todoChecklist || [];
                const matchedTask =prevTodoChecklist.find((task)=> task.text == item);
                return {
                    text:item,
                    completed:matchedTask ? matchedTask.completed : false,
                }
            });

            const response = await axiosInstance.put(API_PATHS.TASKS.UPDATE_TASK(taskId),{
                ...taskData,
                dueDate: new Date(taskData.dueDate).toISOString(),
                todoChecklist:todoList,

            });
            toast.success("Task Update successfully");
        } catch (error) {
                console.error("Error on update ",error);
                setLoading(false);
        }
        finally{
            setLoading(false);
        }
    };

    const handleSubmit = async() =>{
        setError(null);
        //valid
        if(!taskData.title.trim())
        {
            setError("Title is require");
            return;
        }
        if(!taskData.description.trim())
        {
            setError("Description is require");
            return;
        }
        if(!taskData.dueDate)
            {
                setError("Due Date is require");
                return;
            }
        if(taskData.assignedTo?.length === 0)
        {
            setError("chua co nguoi");
            return;
        }
        if(taskData.todoChecklist?.length === 0)
        {
            setError("phai co it nhat 1 task");
            return;
        }

        if(taskId)
        {
            updateTask();
            return;
        }
        createTask();
    }

    //get task by id
    const getTaskDetailsById = async () => {
        try {
            const response = await axiosInstance.get(API_PATHS.TASKS.GET_TASK_BY_ID(taskId));

            if(response.data)
            {
                const taskInfo = response.data;
                setCurrentTask(taskId);
                setTaskData((prevStave)=>({
                    title:taskInfo.title,
                    description : taskInfo.description,
                    priority : taskInfo.priority,
                    dueDate : taskInfo.dueDate
                        ? momemt(taskInfo.dueDate).format("YYYY-MM-DD")
                        : null,
                        assignedTo:taskInfo?.assignedTo?.map((item)=> item?._id) || [],
                    todoChecklist:taskInfo?.todoChecklist?.map((item)=>item?.text) ||[],
                    attachments:taskInfo?.attachments || [],
                }));
            }
        } catch (error) {
            console.error("Error Fetching User DAta")
        }
    };

    const deleteTask = async () => {
        try {
            await axiosInstance.delete(API_PATHS.TASKS.DELETE_TASK(taskId));
            setOpenDeleteAlert(false);

            toast.success("Expense details delete success ");
            navigate('/admin/tasks');
        } catch (error) {
            console.error("Error Delete ",error.response?.data?.message || error.message);
            
        }
    };

    useEffect(() => {
      if(taskId){
        getTaskDetailsById(taskId)
      }
    
      return () => {
        
      }
    }, [taskId])
    
    return (
        <DashboardLayout activeMenu="Create Tasks">
            <div className='mt-5'>
                <div className='grid grid-col-1 md:grid-cols-4 mt-4'>
                    <div className='form-card col-span-3'>
                        <div className='flex items-center justify-between '>
                            <h2 className='text-xl md:text-xl font-medium'>{taskId? "Update Task" : "Create Task"} </h2>
                            {taskId && (
                                <button 
                                    className='flex items-center gap-1.5 text-[13px] font-medium text-rose-500 bg-rose-50 rounded px-2 py-1 border border-rose-100 hover:border-rose-300 cursor-pointer'
                                    onClick={()=> setOpenDeleteAlert(true)}
                                    >
                                        <LuTrash className='text-base' /> Delete

                                    </button>
                            )}
                        </div>

                        <div className='mt-4'>
                                <label className='text-xs font-medium text-salte-600'>
                                    Task Title
                                </label>
                                <input
                                placeholder='Create App UI'
                                className='form-input'
                                value={taskData.title}
                                onChange={({target}) =>{
                                    handleValueChange("title",target.value)
                                }}
                                />

                        </div>

                        <div className='mt-3'>
                            <label className='text-xs font-medium text-salte-600'>
                                Description
                            </label>
                                <textarea
                                    placeholder='Describe task'
                                    className='form-input'
                                    rows={4}
                                    value={taskData.description}
                                    onChange={({target})=>
                                        handleValueChange("description",target.value)
                                    }
                                />
                        </div>

                        <div className='grid grid-cols-12 gap-4 mt-2'>
                            <div className='col-span-6 md:col-span-4'>
                                    <label className='text-xs font-medium text-salte-600 mb-4'>
                                            Priority

                                    </label>
                                    <SelectDropdown
                                        options={PRIORITY_DATA}
                                        value={taskData.priority}
                                        onChange={(value) =>handleValueChange("priority",value)}
                                        placeholder="Select Priority"
                                        className="" 
                                        />

                                   
                            </div>   
                            <div className='col-span-6 md:col-span-4'>
                                <label className='text-xs font-medium text-slate-600 mb-4'> 
                                    Due Date
                                </label>
                                <input 
                                    placeholder='Create App UI'
                                    className='form-input'
                                    value={taskData.dueDate}
                                    onChange={({target})=>
                                        handleValueChange("dueDate",target.value)
                                    }
                                    type="date"
                                    />

                            </div>  
                            <div className='col-span-12 md:col-span-3'>
                                    <label className='text-xs font-medium text-slate-600'>
                                        Assign To
                                    </label>

                                    <SelectUsers  
                                        selectedUsers= {taskData.assignedTo}
                                        setSelectedUsers= {(value)=>{
                                            handleValueChange("assignedTo",value);
                                        }}
                                        />
                            </div>       
                        </div>
                        <div className='mt-3'>
                            <label className='text-xs font-medium text-slate-600 '>
                                TODO CheckList
                            </label>
                            <TodoListInput 
                                todoList={taskData?.todoChecklist}
                                setTodoList={(value)=>
                                    handleValueChange("todoChecklist",value)
                                }
                                ></TodoListInput>
                        </div>
                        <div className='mt-3'>
            <label className='text-xs font-medium text-slate-600'> 
                    Add Attachment
            </label>
            <AddAttachmentsInput 
                 attachments={taskData?.attachments}
                 setAttachments={(value)=> 
                        handleValueChange("attachments",value)
                 }
                 />
        </div>
        {error&&(
            <p className='text-xs font-medium text-red-500 mt-5'>
                    {error}
            </p>
        )}
        <div className='flex justify-end mt-7'>
                <button
                    className='add-btn'
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {taskId ?"UPDATE TASK" : "CREATE TASK"}
                </button>
        </div>
                    </div>

                </div>

            </div>
            <Modal 
            isOpen={openDeleteAlert}
            onClose={()=>setOpenDeleteAlert(false)}
            title="Delete Task"
            >
                <DeleteAlert 
                content="Are you sure to delete task"
                onDelete={()=>deleteTask()}
                />


            </Modal>
        </DashboardLayout>
            )
}
export default CreateTask