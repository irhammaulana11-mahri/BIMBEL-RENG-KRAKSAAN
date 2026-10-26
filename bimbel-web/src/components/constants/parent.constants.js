export const DEFAULT_LEAD_FILTER = {
    keyword: "",
    status: "",
    children: "",
};

export const LEAD_STATUS_OPTIONS = [
    { label: "Semua Status", value: "" },
    { label: "Aktif", value: "1" },
    { label: "Non-Aktif", value: "0" },
    { label: "Semua Status Anak", value: "" },
    { label: "Sudah Plot Anak", value: "yes" },
    { label: "Belum Plot Anak", value: "no" },
];

export const PERIOD_OPTIONS = [
    { label: "Harian", value: "daily" },
    { label: "Bulanan", value: "monthly" },
];