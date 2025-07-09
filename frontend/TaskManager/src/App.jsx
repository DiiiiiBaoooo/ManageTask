import React, { useContext } from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
  Navigate,
} from "react-router-dom";
import Login from './pages/Auth/Login'
import Signup from './pages/Auth/SignUp'
import DashBoard from './pages/Admin/DashBoard'
import CreateTask from './pages/Admin/CreateTask'
import ManageUsers from './pages/Admin/ManageUsers'
import ManageTasks from './pages/Admin/ManageTasks'
import UserDashBoard from './pages/User/UserDashBoard'
import MyTask from './pages/User/MyTask'
import PrivateRoute from './routes/PrivateRoute'
import ViewTaskDetails from './pages/User/ViewTaskDetails'
import UserProvider, { UserContext } from './context/userContext';
import { Toaster } from 'react-hot-toast';
function App() {
  return (
    <UserProvider>
    <div>
      <Router>
        <Routes>
          <Route path='/login' element={<Login />} />
          <Route path='/signup' element={<Signup />} />
          {/* routes for admin */}
          <Route element={<PrivateRoute allowedRoles={['admin']} />}>
            <Route path='/admin/dashboard' element={<DashBoard />} />
            <Route path='/admin/tasks' element={<ManageTasks />} />
            <Route path='/admin/create-task' element={<CreateTask />} />
            <Route path='/admin/users' element={<ManageUsers />} />
          </Route>
          {/* routes for user */}
          <Route element={<PrivateRoute allowedRoles={['user']} />}>
            <Route path='/user/dashboard' element={<UserDashBoard />} />
            <Route path='/user/tasks' element={<MyTask />} />
            <Route path='/user/task-details/:id' element={<ViewTaskDetails  />} />
          </Route>
          {/* default router */}
          <Route path='/' element={<Root />} />
        </Routes>
      </Router>
    </div>
    <Toaster 
      toastOptions={{
        className:"",
        style: {
          fontSize:"13px",
        },
        
      }}></Toaster>
    </UserProvider>
  )
}

export default App
const Root  = ()=>{
  const {user,loading} = useContext(UserContext);
  if(loading) return <Outlet />
  if(!user) {
    return <Navigate to="/login" />;

  }
  return user.role==="admin" ? <Navigate to="/admin/dashboard"/> : <Navigate to="/user/dashboard" />;
}