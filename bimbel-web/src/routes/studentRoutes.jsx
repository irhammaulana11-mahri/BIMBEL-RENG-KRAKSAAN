import StudentDashboardPage from "../pages/student/StudentDashboardPage";
import StudentExamPage from "../pages/student/StudentExamPage";
import StudentExamAttemptPage from "../pages/student/StudentExamAttemptPage";
import StudentReportPage from "../pages/student/StudentReportPage";
import StudentLearningPage from "../pages/student/StudentLearningPage";
import StudentMaterialPage from "../pages/student/StudentMaterialPage";
import StudentProfilePage from "../pages/student/StudentProfilePage";

export const studentRoutes = [
    {path:"dashboard", element:<StudentDashboardPage/>},
    {path:"exams", element:<StudentExamPage/>},
    {path:"exams/:resultId", element:<StudentExamAttemptPage/>},
    {path:"reports", element:<StudentReportPage/>},
    {path:"learning", element:<StudentLearningPage/>},
    {path:"materials", element:<StudentMaterialPage/>},
    {path:"profile", element:<StudentProfilePage/>},
];
