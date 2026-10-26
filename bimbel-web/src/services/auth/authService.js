import api from "../../api/axios";

export const login = (data) => {return api.post("/login",data);};
export const logout = () => {return api.post("/logout");};
export const profile = () => {return api.get("/profile");};