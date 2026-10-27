import api from "@/api/axios";

/*
 * Konten landing page (tanpa login). Backend hanya mengirim konten aktif/terbit
 * kepada pengunjung; kelola konten ada di services/admin/website.
 */

export const getCompanyProfile = () => api.get("/website/company-profiles");
export const getBanners = () => api.get("/website/banners");
export const getPackages = () => api.get("/website/packages");
export const getTestimonials = () => api.get("/website/testimonials");
export const getFaqs = () => api.get("/website/faqs");

export const getActivities = () => api.get("/website/activities");
export const getActivityById = (id) => api.get(`/website/activities/${id}`);

export const getArticles = () => api.get("/website/articles");
export const getArticleBySlug = (slug) => api.get(`/website/articles/slug/${slug}`);
