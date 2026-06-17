import api from "../api/axios";

export const uploadImage = async(file)=> {
 const formData = new FormData();
 formData.append("file",file);
 const res = await api.post("/uploads/image",formData,{
     headers:{
      "Content-Type":"multipart/form-data"
     }
   }
 );

 return res.data.data.url;
};