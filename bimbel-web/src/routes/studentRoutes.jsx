import StudentDashboardPage from "../pages/student/StudentDashboardPage";
import StudentExamPage from "../pages/student/StudentExamPage";
import StudentExamAttemptPage from "../pages/student/StudentExamAttemptPage";
import StudentReportPage from "../pages/student/StudentReportPage";

export const studentRoutes = [
    {path:"dashboard", element:<StudentDashboardPage/>},
    {path:"exams", element:<StudentExamPage/>},
    {path:"exams/:resultId", element:<StudentExamAttemptPage/>},
    {path:"reports", element:<StudentReportPage/>},
];
