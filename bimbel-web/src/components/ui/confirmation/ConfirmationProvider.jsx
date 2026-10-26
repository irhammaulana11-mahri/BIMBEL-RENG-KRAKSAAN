import {
    createContext,
    useCallback,
    useMemo,
    useRef,
    useState,
} from "react";

import ConfirmationModal from "./ConfirmationModal";

export const ConfirmationContext =
    createContext(null);

export default function ConfirmationProvider({
    children,
}) {

    const resolver = useRef(null);

    const [options, setOptions] =
        useState(null);

    const [loading, setLoading] =
        useState(false);

    const confirm = useCallback((config = {}) => {

        return new Promise((resolve) => {

            resolver.current = resolve;

            setOptions({

                title:
                    config.title ??
                    "Konfirmasi",

                message:
                    config.message ??
                    "Apakah Anda yakin?",

                variant:
                    config.variant ??
                    "primary",

                confirmText:
                    config.confirmText ??
                    "Ya",

                cancelText:
                    config.cancelText ??
                    "Batal",

            });

        });

    }, []);

    const reset = () => {

        resolver.current = null;

        setLoading(false);

        setOptions(null);

    };

    const handleClose = () => {

        resolver.current?.(false);

        reset();

    };

    const handleConfirm = () => {

        resolver.current?.(true);

        reset();

    };

    const value = useMemo(() => ({

        confirm,

        loading,

        setLoading,

    }), [confirm, loading]);

    return (

        <ConfirmationContext.Provider
            value={value}
        >

            {children}

            <ConfirmationModal

                open={!!options}

                loading={loading}

                title={options?.title}

                message={options?.message}

                variant={options?.variant}

                confirmText={
                    options?.confirmText
                }

                cancelText={
                    options?.cancelText
                }

                onClose={handleClose}

                onConfirm={handleConfirm}

            />

        </ConfirmationContext.Provider>

    );

}