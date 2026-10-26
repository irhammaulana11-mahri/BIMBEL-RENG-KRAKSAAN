export const DEFAULT_TENTOR_FILTER = {
    keyword: "",
    status: "",
    specialization: "",
};

export const TENTOR_STATUS_OPTIONS = [
    { label: "Semua Status", value: "" },
    { label: "Aktif", value: "1" },
    { label: "Non-Aktif", value: "0" },
    { label: "Semua Spesialisasi", value: "" },
    { label: "Saintek (IPA/MTK/Fisika/Kimia)", value: "SAINTEK" },
    { label: "Soshum (IPS/Ekonomi/Sejarah)", value: "SOSHUM" },
    { label: "Bahasa & Literasi", value: "BAHASA" },
    { label: "Umum / Semua Jenjang", value: "UMUM" },
];

export const PERIOD_OPTIONS = [
    { label: "Harian", value: "daily" },
    { label: "Bulanan", value: "monthly" },
];