import TentorDashboard from "../pages/tentor/DashboardTentor";
import TentorSchedulePage from "../pages/tentor/TentorSchedulePage";
import TentorSessionListPage from "../pages/tentor/TentorSessionListPage";
import TentorStudentPage from "../pages/tentor/TentorStudentPage";
import TentorAttendancePage from "../pages/tentor/TentorAttendancePage";
import TentorEvaluationPage from "../pages/tentor/TentorEvaluationPage";
import TentorProfilePage from "../pages/tentor/TentorProfilePage";
import TentorSessionWorkspacePage from "../components/tentor/TentorSessionWorkspacePage";
import TentorHonorPage from "../pages/tentor/TentorHonorPage";
import TentorProgressNotePage from "../pages/tentor/TentorProgressNotePage";

export const tentorRoutes = [
    {path:"dashboard",element:<TentorDashboard/>},
    {path:"schedules", element:<TentorSchedulePage/>},
    {path: "sessions",children: [{path:":id/workspace",element: <TentorSessionWorkspacePage />}]},
    {path:"activities", element:<TentorSessionListPage/>},
    {path:"students", element:<TentorStudentPage/>},
    {path:"attendances", element:<TentorAttendancePage/>},
    {path:"evaluations", element:<TentorEvaluationPage/>},
    {path:"honor", element:<TentorHonorPage/>},
    {path:"progress", element:<TentorProgressNotePage/>},
    {path:"profile", element:<TentorProfilePage/>},
    
];