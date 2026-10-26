export const DEFAULT_LEAD_FILTER = {
    keyword: "",
    status: "",
    period: "month",
    startDate: "",
    endDate: "",
};

export const LEAD_STATUS_OPTIONS = [
    { label: "Semua Status", value: "" },
    { label: "NEW", value: "NEW" },
    { label: "CONTACTED", value: "CONTACTED" },
    { label: "REGISTERED", value: "REGISTERED" },
    { label: "REJECTED", value: "REJECTED" },
];

export const PERIOD_OPTIONS = [
    { label: "Harian", value: "daily" },
    { label: "Bulanan", value: "monthly" },
];