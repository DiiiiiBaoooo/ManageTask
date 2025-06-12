import React, { use, useContext, useState } from 'react'
import { validateEmail } from '../../utils/helper';
import ProfilePhotoSelector from '../../components/Inputs/ProfilePhotoSelector';
import AuthLayout from '../../components/layouts/AuthLayout';
import Input from '../../components/Inputs/Input';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { UserContext } from '../../context/userContext';
import uploadImage from '../../utils/uploadImage';
const Signup = () => {
    const [profilePic,setProfilePic] = useState(null);
    const [fullName,setFullName] = useState("");
    const [email,setEmail] = useState("");
    const [password,setPassword]= useState("");
    const [adminInviteToken,setAdminInviteToken]=useState("");
    const [error,setError]=useState(null);
    const {updateUser} = useContext(UserContext);
    const navigate = useNavigate();
    const handleSignUp  = async(e)=>{
        e.preventDefault();

        let profileImageUrl= '';

       if(!fullName)
       {
           setError("Please Enter Full Name!");
           return;
       }
       if(!validateEmail(email))
        {
            setError("Please Enter a valid email  address ");
            return;
        }
        
       
       if(!password){
           setError("Please Enter Password ");
           return;
       }
       setError("");
       //signup api call
       try {
        //upload image url
        if(profilePic)
        {
            const imgUploadRes = await uploadImage(profilePic);
            profileImageUrl= imgUploadRes.imageUrl || "";

        }
        const respone = await axiosInstance.post(API_PATHS.AUTH.REGISTER,{
            name:fullName,
            email,
            password,
            profileImageUrl,
            adminInviteToken
        });

        const {token , role } = respone.data;
        if(token)
        {
            localStorage.setItem("token",token);
            updateUser(respone.data);

            if(role==="admin")
            {
                navigate("/admin/dashboard");
            }
            else
            {
                navigate("/user/dashboard");
            }
        }
    } catch (error) {
        if(error.response && error.response.data.message){
            setError(error.response.data.message);
        }
        else
        {
            setError("Something wrong ");
        }
    }
   }
    return (
        
        <AuthLayout>
            <div className='lg:w-[100%] h-auto md:h-full mt-10 md:mt-0 flex flex-col justify-center '>
                <h3 className='text-xs font-semibold text-black'> Create An Account</h3>
                <p className='text-xs text-slate-700 mt-[5px] mb-6 '> Join us today by entering your details below.</p>   

                <form onSubmit={handleSignUp}>
                    <ProfilePhotoSelector image={profilePic} setImage={setProfilePic} />
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <Input
                            value={fullName}
                            onChange={({target })=>setFullName(target.value)}
                            label="Full Name"
                            placeholder="Enter Full Name"
                            type="text"
                            
                            />
                             <Input 
                value={email}
                onChange={({target})=>setEmail(target.value)}
                label="Email"
                placeholder="Nhap Email" 
                type="text" />
                 <Input 
                value={password}
                onChange={({target})=>setPassword(target.value)}
                label="password"
                placeholder="Nhap pass" 
                type="password" />
                    <Input 
                value={adminInviteToken}
                onChange={({target})=>setAdminInviteToken(target.value)}
                label="Admin Invite Token "
                placeholder="Nhap ma moi cua admin" 
                type="text" />
                 </div>   
                 {error && <p className='text-red-500 text-xs pb-2.5'>{error}</p>}
                <button type="submit" className='btn-primary'>Sign Up</button>
                <p className='text-[13px] text-slate-800 mt-3'>
                  already  a Account? {" "}
                    <Link className='font-medium text-primary underline' to="/login">log in</Link>
                </p>
                    
                    
                    
                </form> 
            </div>

        </AuthLayout>

            )
}
export default Signup