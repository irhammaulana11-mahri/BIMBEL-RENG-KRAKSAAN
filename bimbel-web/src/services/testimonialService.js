import api from "../api/axios";

export const getTestimonials = () => api.get("website/testimonials");
export const createTestimonial = (data) => api.post("website/testimonials", data);
export const updateTestimonial = (id, data) => api.put(`website/testimonials/${id}`, data);
export const deleteTestimonial = (id) => api.delete(`website/testimonials/${id}`);

// export const getTestimonials = async () => {const res = await api.get("/testimonials");
//     return res.data;
//   };

// export const createTestimonial =
//   async (data) => {
//     const res =
//       await api.post(
//         "/testimonials",
//         data
//       );

//     return res.data;
//   };

// export const updateTestimonial =
//   async (id, data) => {
//     const res =
//       await api.put(
//         `/testimonials/${id}`,
//         data
//       );

//     return res.data;
//   };

// export const deleteTestimonial =
//   async (id) => {
//     const res =
//       await api.delete(
//         `/testimonials/${id}`
//       );

//     return res.data;
//   };