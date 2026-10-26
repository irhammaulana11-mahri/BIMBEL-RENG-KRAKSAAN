import {createBrowserRouter} from "react-router-dom";
import LoginPage from "../pages/auth/LoginPage";
import { publicRoutes } from "./publicRoutes";
import { adminRoutes } from "./adminRoutes";
import { parentRoutes } from "./parentRoutes";
import { tentorRoutes } from "./tentorRoutes";
import { studentRoutes } from "./studentRoutes";
import ProtectedRoute from "./ProtectedRoute";
import PublicLayout from "../layouts/PublicLayout";
import AdminLayout from "../layouts/AdminLayout";
import ParentLayout from "../layouts/ParentsLayout";
import TentorLayout from "../layouts/TentorsLayout";
import StudentLayout from "../layouts/StudentsLayout";
import DocumentPreviewPage from "../components/ui/SecureDocumentViewer";


export const router = createBrowserRouter([
    {path: "/",element: <PublicLayout />,children: publicRoutes,},
    {path: "/login",element: <LoginPage />,},
    {path: "/admin",element: 
        (<ProtectedRoute 
            allowedRoles={["admin","super_admin",]}>
            <AdminLayout />
        </ProtectedRoute>),
        children: adminRoutes,
    },
    {path: "/parent",element: 
        (<ProtectedRoute 
            allowedRoles={["orang_tua",]}>
            <ParentLayout />
        </ProtectedRoute>),
        children: parentRoutes,
    },
    {path: "/tentor",element: 
        (<ProtectedRoute 
            allowedRoles={["tentor",]}>
            <TentorLayout />
        </ProtectedRoute>),
        children: tentorRoutes,
    },
    {path: "/student",element: 
        (<ProtectedRoute 
            allowedRoles={["siswa",]}>
            <StudentLayout />
        </ProtectedRoute>),
        children: studentRoutes,
    },
    { path: "/preview/document", element: <DocumentPreviewPage /> },


]);

