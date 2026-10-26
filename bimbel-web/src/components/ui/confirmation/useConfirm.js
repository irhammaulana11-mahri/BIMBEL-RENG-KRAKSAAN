import { useContext } from "react";
import { ConfirmationContext } from "./ConfirmationProvider";
import { CONFIRM_PRESETS } from "./constants";

export default function useConfirm() {
    const context = useContext(ConfirmationContext);

    if (!context) {
        throw new Error(
            "useConfirm harus digunakan di dalam ConfirmationProvider."
        );
    }

    const { confirm,loading,setLoading } = context;
    return {
        confirm,
        loading,
        setLoading,

        delete(options = {}) {
            return confirm({
                ...CONFIRM_PRESETS.DELETE,
                ...options,
            });
        },

        save(options = {}) {
            return confirm({
                ...CONFIRM_PRESETS.SAVE,
                ...options,
            });
        },

        activate(options = {}) {
            return confirm({
                ...CONFIRM_PRESETS.ACTIVATE,
                ...options,
            });
        },

        warning(options = {}) {
            return confirm({
                ...CONFIRM_PRESETS.WARNING,
                ...options,
            });
        },

        convert(options = {}) {
            return confirm({
                ...CONFIRM_PRESETS.CONVERT,
                ...options,
            });
        },

    };
}