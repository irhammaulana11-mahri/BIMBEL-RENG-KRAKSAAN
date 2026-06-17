import api from "../api/axios";

export const getActivities = () => api.get("/website/activities");
export const getArticles = () => api.get("/website/articles");
export const getBanners = () => {return api.get("/website/banners");};
export const getCompanyProfile = async () => {
  const response = await api.get(
    "/website/company-profiles"
  );

  return response.data.data[0];
};

export const getFaqs = () => api.get("/website/faqs");

export const getPackages = () => {return api.get("/website/packages");};
export const getTestimonials = () => api.get("/website/testimonials");