import DashboardPage from "../pages/admin/DashboardPage";
import CompanyProfilePage from "../pages/admin/website/CompanyProfilePage";
import BannerPage from "../pages/admin/website/BannerPage";
import PackagePage from "../pages/admin/website/PackagePage";
import ActivitiesPage from "../pages/admin/website/ActivityPage";
import ArticlePage from "../pages/admin/website/ArticlePage";
import TestimonialPage from "../pages/admin/website/TestimonialPage";
import FaqPage from "../pages/admin/website/FaqPage";
import LeadPage from "../pages/admin/website/LeadPage";

import ParentPage from "../pages/admin/master/ParentPage";
import StudentPage from "../pages/admin/master/StundentPage";
import StudentCreatePage from "../pages/admin/master/StudentCreatePage";
import TentorPage from "../pages/admin/master/TentorPage";
import TentorCreatePage from "../pages/admin/master/TentorCreatePage";
import SubjectPage from "../pages/admin/master/SubjectPage";
import EducationLevelPage from "../pages/admin/master/EducationLevelPage";

import LocationPage from "../pages/admin/academic/LocationPage";
import ClassPage from "../pages/admin/academic/ClassPage";
import ClassCreatePage from "../pages/admin/academic/ClassCreatePage";
import SchedulePage from "../pages/admin/academic/SchedulePage";
import AttendancePage from "../pages/admin/academic/AttendancePage";
import ExamPage from "../pages/admin/academic/ExamPage";
import ProgressReportPage from "../pages/admin/academic/ProgressReportPage";
import RescheduleRequestPage from "../pages/admin/academic/RescheduleRequestPage";
import LocationRequestPage from "../pages/admin/academic/LocationRequestPage";
import StudentRegistrationPage from "../pages/admin/academic/StudentRegistrationPage";
import UserPage from "../pages/admin/settings/UserPage";
import BackupPage from "../pages/admin/settings/BackupPage";
import LearningMaterialPage from "../pages/admin/academic/LearningMaterialPage";

import FinancePage from "../pages/admin/finance/FinancePage";
import OperationalExpensePage from "../pages/admin/finance/OperationalExpensePage";

export const adminRoutes = [
    {path: "dashboard",element: <DashboardPage />,},
    {path: "company-profile",element: <CompanyProfilePage />,},
    {path: "banners",element: <BannerPage />,},
    {path:"packages",element:<PackagePage/>},
    {path:"activities",element:<ActivitiesPage/>},
    {path:"articles",element:<ArticlePage/>},
    {path:"testimonials",element:<TestimonialPage/>},
    {path:"faqs",element:<FaqPage/>},
    {path:"leads",element:<LeadPage/>},
    {path:"parents",element:<ParentPage/>},
    {path:"students",element:<StudentPage/>},
    {path:"tentors",element:<TentorPage/>},
    {path:"subjects",element:<SubjectPage/>},
    {path:"education-levels",element:<EducationLevelPage/>},
    {path:"locations", element:<LocationPage/>},
    {path:"classes", element:<ClassPage/>},
    {path:"schedules", element:<SchedulePage/>},
    {path:"attandances", element:<AttendancePage/>},
    {path:"exam", element:<ExamPage/>},
    {path:"finance", element:<FinancePage/>},
    {path:"rapor", element:<ProgressReportPage/>},
    {path:"reschedule-requests", element:<RescheduleRequestPage/>},
    {path:"location-requests", element:<LocationRequestPage/>},
    {path:"enrollments", element:<StudentRegistrationPage/>},
    {path:"users", element:<UserPage/>},
    {path:"backups", element:<BackupPage/>},
    {path:"modul", element:<LearningMaterialPage/>},
    {path:"cashflow", element:<OperationalExpensePage/>},
    {path: "students",children: [{path: "new",element: <StudentCreatePage />}]},
    {path: "tentors",children: [{path: "new",element: <TentorCreatePage />}]},
    {path: "classes",children: [{path: "new",element: <ClassCreatePage />}]},
];