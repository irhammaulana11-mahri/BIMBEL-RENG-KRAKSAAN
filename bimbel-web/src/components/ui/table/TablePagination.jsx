import PropTypes from "prop-types";
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from "lucide-react";

// Pilihan jumlah baris per halaman; onPageChange(page, perPage) dipanggil dengan halaman 1 saat jumlah diganti
export const PER_PAGE_OPTIONS = [10, 25, 50, 100];

export default function TablePagination({
    pagination,
    onPageChange,
    label = "data",
    perPageOptions = PER_PAGE_OPTIONS,
}) {
    if (!pagination || pagination.total === 0) return null;

    const {
        page,
        lastPage,
        from,
        to,
        total,
    } = pagination;

    const changePage = (target) => {
        if (
            target < 1 ||
            target > lastPage ||
            target === page
        ) {
            return;
        }

        onPageChange(target);
    };

    const pages = [];

    if (lastPage <= 7) {
        for (let i = 1; i <= lastPage; i++) {
            pages.push(i);
        }
    } else {

        pages.push(1);

        if (page > 4) pages.push("...");

        const start = Math.max(2, page - 1);
        const end = Math.min(lastPage - 1, page + 1);

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        if (page < lastPage - 3) pages.push("...");

        pages.push(lastPage);

    }

    return (
        <div className="flex flex-col gap-4 border-t border-gray-200 bg-white px-6 py-4 md:flex-row md:items-center md:justify-between">

            <div className="flex flex-wrap items-center gap-3">
            {pagination.perPage && (
                <label className="flex items-center gap-2 text-sm text-gray-600">
                    Tampilkan
                    <select
                        value={pagination.perPage}
                        onChange={(e) => onPageChange(1, Number(e.target.value))}
                        className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm font-semibold text-gray-700"
                    >
                        {[...new Set([...perPageOptions, pagination.perPage])].sort((x, y) => x - y).map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                    baris
                </label>
            )}
            <p className="text-sm text-gray-600">
                Menampilkan{" "}
                <strong>{from}</strong>
                {" - "}
                <strong>{to}</strong>
                {" dari "}
                <strong>{total}</strong>
                {" "}
                {label}
            </p>
            </div>

            <div className="flex items-center gap-1">

                <button
                    onClick={() => changePage(1)}
                    disabled={page === 1}
                    className="rounded-lg border p-2 hover:bg-gray-50 disabled:opacity-40"
                >
                    <ChevronsLeft size={18} />
                </button>

                <button
                    onClick={() => changePage(page - 1)}
                    disabled={page === 1}
                    className="rounded-lg border p-2 hover:bg-gray-50 disabled:opacity-40"
                >
                    <ChevronLeft size={18} />
                </button>

                {pages.map((item, index) =>
                    item === "..." ? (
                        <span
                            key={index}
                            className="px-2 text-gray-400"
                        >
                            ...
                        </span>
                    ) : (
                        <button
                            key={item}
                            onClick={() => changePage(item)}
                            className={`h-10 min-w-[40px] rounded-lg text-sm font-semibold transition ${
                                page === item
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "border bg-white hover:bg-gray-50"
                            }`}
                        >
                            {item}
                        </button>
                    )
                )}

                <button
                    onClick={() => changePage(page + 1)}
                    disabled={page === lastPage}
                    className="rounded-lg border p-2 hover:bg-gray-50 disabled:opacity-40"
                >
                    <ChevronRight size={18} />
                </button>

                <button
                    onClick={() => changePage(lastPage)}
                    disabled={page === lastPage}
                    className="rounded-lg border p-2 hover:bg-gray-50 disabled:opacity-40"
                >
                    <ChevronsRight size={18} />
                </button>

            </div>
        </div>
    );
}

TablePagination.propTypes = {
    pagination: PropTypes.shape({
        page: PropTypes.number.isRequired,
        perPage: PropTypes.number,
        from: PropTypes.number,
        to: PropTypes.number,
        total: PropTypes.number,
        lastPage: PropTypes.number,
    }).isRequired,
    onPageChange: PropTypes.func.isRequired,
    label: PropTypes.string,
};