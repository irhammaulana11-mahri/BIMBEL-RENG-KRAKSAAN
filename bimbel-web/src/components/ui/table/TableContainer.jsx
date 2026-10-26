import PropTypes from "prop-types";

import TableLoading from "./TableLoading";
import TableEmpty from "./TableEmpty";
import TablePagination from "./TablePagination";

export default function TableContainer({
    loading = false,
    data = [],
    pagination = null,
    onPageChange = () => {},
    thead,
    children,
    colSpan = 1,
    skeletonRows = 8,
    skeletonColumns = 8,
    emptyTitle = "Belum ada data",
    emptyDescription = "Data akan muncul di sini.",
    emptyIcon,
    emptyAction = null,
    label = "data",
}) {

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    {thead}
                    {loading ? (
                        <TableLoading rows={skeletonRows} columns={skeletonColumns}/>

                    ) : data.length === 0 ? (

                        <TableEmpty
                            colSpan={colSpan}
                            icon={emptyIcon}
                            title={emptyTitle}
                            description={emptyDescription}
                            action={emptyAction}
                        />

                    ) : (
                        children
                    )}
                </table>
            </div>

            {pagination && (

                <TablePagination pagination={pagination} onPageChange={onPageChange} label={label}/>

            )}

        </div>
    );
}

TableContainer.propTypes = {
    loading: PropTypes.bool,
    data: PropTypes.array,
    pagination: PropTypes.object,
    onPageChange: PropTypes.func,
    thead: PropTypes.node.isRequired,
    children: PropTypes.node.isRequired,
    colSpan: PropTypes.number,
    skeletonRows: PropTypes.number,
    skeletonColumns: PropTypes.number,
    emptyTitle: PropTypes.string,
    emptyDescription: PropTypes.string,
    emptyIcon: PropTypes.elementType,
    emptyAction: PropTypes.node,
    label: PropTypes.string,
};