import DashboardPage from "../pages/parent/DashboardPage";
import ExamPage from "../pages/parent/ExamPage";
import FinancePage from "../pages/parent/FinancePage";
import ParentBillingPage from "../pages/parent/BillingPage";
import ParentGradesPage from "../pages/parent/GradesPage";
import ParentProfilePage from "../pages/parent/ProfilePage";
import ParentSchedulePage from "../pages/parent/SchedulePage";

export const parentRoutes = [
    {path:"dashboard",element:<DashboardPage/>},
    {path:"exam", element:<ExamPage/>},
    {path:"schedule", element:<ParentSchedulePage/>},
    {path:"finance", element:<FinancePage/>},
    {path:"billing", element:<ParentBillingPage/>},
    {path:"grades", element:<ParentGradesPage/>},
    {path:"profile", element:<ParentProfilePage/>},
];