import {createBrowserRouter} from "react-router-dom";
import LoginPage from "../pages/auth/LoginPage";
import PublicLayout from "../layouts/PublicLayout";
import AdminLayout from "../layouts/AdminLayout";
import HomePage from "../pages/public/HomePage";
import DashboardPage from "../pages/admin/DashboardPage";
import CompanyProfilePage from "../pages/admin/website/CompanyProfilePage";
import BannerPage from "../pages/admin/website/BannerPage";
import PackagePage from "../pages/admin/website/PackagePage"
import ActivitiesPage from "../pages/admin/website/ActivityPage";
import ArticlePage from "../pages/admin/website/ArticlePage";
import TestimonialPage from "../pages/admin/website/TestimonialPage";
import FaqPage from "../pages/admin/website/FaqPage";
import LeadPage from "../pages/admin/website/LeadPage";
import ProtectedRoute from "../components/ProtectedRoute";
import ArticleListPage from "../pages/public/ArticleListPage";
import ArticleDetailPage from "../pages/public/ArticleDetailPage";
import ActivityListPage from "../pages/public/ActivityListPage";
import ActivityDetailPage from "../pages/public/ActivityDetailPage";
import AboutPage from "../pages/public/AboutPage";
import LeadRegisterPage from "../pages/public/LeadRegisterPage";
import ParentPage from "../pages/admin/master/ParentPage";

export const router =
  createBrowserRouter([
    {path: "/",element: <PublicLayout />,
      children: [
        {index: true,element: <HomePage />},
        {path: "articles",element: <ArticleListPage />},
        {path: "articles/:slug",element: <ArticleDetailPage />},
        {path: "activities",element: <ActivityListPage />},
        {path: "activities/:id",element: <ActivityDetailPage />},
        {path: "about",element: <AboutPage />},
        {path: "/register",element: <LeadRegisterPage />},
      ]
    },
    {path:"/login",element:<LoginPage/>},
    {path:"/admin",element:(<ProtectedRoute><AdminLayout /></ProtectedRoute>),
      children: [
          {path: "dashboard",element: <DashboardPage />},
          {path:"company-profile",element:<CompanyProfilePage/>},
          {path:"banners",element:<BannerPage/>},
          {path:"packages",element:<PackagePage/>},
          {path:"activities",element:<ActivitiesPage/>},
          {path:"articles",element:<ArticlePage/>},
          {path:"testimonials",element:<TestimonialPage/>},
          {path:"faqs",element:<FaqPage/>},
          {path:"leads",element:<LeadPage/>},
          {path:"parents",element:<ParentPage/>},
    ]},
  ]);