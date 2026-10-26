import HomePage from "../pages/public/HomePage";
import ArticleListPage from "../pages/public/ArticleListPage";
import ArticleDetailPage from "../pages/public/ArticleDetailPage";
import ActivityListPage from "../pages/public/ActivityListPage";
import ActivityDetailPage from "../pages/public/ActivityDetailPage";
import AboutPage from "../pages/public/AboutPage";
import LeadRegisterPage from "../pages/public/LeadRegisterPage";

export const publicRoutes = [
    {index: true,element: <HomePage />,},
    {path: "articles",element: <ArticleListPage />,},
    {path: "articles/:slug",element: <ArticleDetailPage />,},
    {path: "activities",element: <ActivityListPage />,},
    {path: "activities/:id",element: <ActivityDetailPage />,},
    {path: "about",element: <AboutPage />,},
    {path: "register",element: <LeadRegisterPage />,},
];

