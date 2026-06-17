import api from "../api/axios";

export const login = (data) => {
  return api.post("/login", data);
};

export const profile = () => {
  return api.get("/profile", {
    headers: {
      Authorization:
        `Bearer ${localStorage.getItem("token")}`,
    },
  });
};

export const logout = () => {
  return api.post(
    "/logout",
    {},
    {
      headers: {
        Authorization:
          `Bearer ${localStorage.getItem("token")}`,
      },
    }
  );
};