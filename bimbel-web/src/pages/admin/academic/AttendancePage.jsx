import React, { useState } from "react";
import StudentAttendanceTab from "../../../components/admin/academic/attendance/StudentAttendanceTab";
import TentorAttendanceTab from "../../../components/admin/academic/attendance/TentorAttendanceTab";

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState("siswa");

  return (
    <div className="bg-white p-6 rounded-xl shadow min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-gray-950 tracking-tight">Attendance Management</h1>
        <p className="text-sm text-gray-500 mt-1">Monitor kehadiran siswa & tentor berdasarkan sesi KBM aktual.</p>
      </div>

      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("siswa")}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === "siswa" ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Absensi Siswa
        </button>
        <button
          onClick={() => setActiveTab("tentor")}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === "tentor" ? "border-amber-600 text-amber-700" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Absensi Tentor
        </button>
      </div>

      {activeTab === "siswa" ? <StudentAttendanceTab /> : <TentorAttendanceTab />}
    </div>
  );
}