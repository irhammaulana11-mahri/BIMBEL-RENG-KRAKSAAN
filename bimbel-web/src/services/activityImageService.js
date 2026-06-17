import api from "../api";

export const getActivityImages = (activityId) =>api.get(`/activities/${activityId}/images`);

export const uploadActivityImage = (activityId,image_url) =>api.post(`/activities/${activityId}/images`,{ image_url });

export const deleteActivityImage = (id) =>api.delete(`/activity-images/${id}`);