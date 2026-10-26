import { format, isValid, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { DAY_MAP } from "@/components/constants/schedule.constants";

export const getDayName = (day) => {
    return DAY_MAP[Number(day)] ?? "-";
};

export const formatDate = (date) => {
    if (!date) return "";
    return format(new Date(date), "dd MMMM yyyy", { locale: id });
};

export const formatScheduleLabel = (item) => {
    // 🟢 Pastikan item.session_date ada dan tipenya benar-benar string sebelum diparse
    const isSessionDateValid = item.session_date && 
                               typeof item.session_date === "string" &&
                               item.session_date !== "1970-01-01" && 
                               item.session_date !== "-";

    if (isSessionDateValid) {
        try {
            return `${getDayName(item.day_of_week)}, ${format(
                parseISO(item.session_date), 
                "dd MMMM yyyy",
                { locale: id }
            )}`;
        } catch (e) {
            // Fallback aman jika parsing tanggal gagal
            return getDayName(item.day_of_week);
        }
    }
    
    // Jika tidak ada tanggal valid (Master Schedule), hanya tampilkan nama hari
    return getDayName(item.day_of_week);
};

export const groupBySchedule = (items) => {
    return items.reduce((acc, item) => {
        let key;
        
        const isSessionDateValid = item.session_date && 
                                   typeof item.session_date === "string" &&
                                   item.session_date !== "1970-01-01" && 
                                   item.session_date !== "-";

        if (isSessionDateValid) {
            key = item.session_date;
        } else {
            key = `day-${item.day_of_week}`;
        }

        if (!acc[key]) {
            acc[key] = [];
        }

        acc[key].push(item);
        return acc;
    }, {});
};