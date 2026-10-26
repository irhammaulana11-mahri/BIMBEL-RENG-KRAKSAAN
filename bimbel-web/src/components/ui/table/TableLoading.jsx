import PropTypes from "prop-types";

export default function TableLoading({
    colSpan,
    message = "Memuat data, mohon ditunggu beberapa saat...",
}) {
    return (
        <tbody>
            <tr>
                <td
                    colSpan={colSpan}
                    className="py-12 text-center text-gray-500"
                >
                    <div className="flex items-center justify-center gap-3">

                        <div className="h-5 w-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />

                        <span className="text-sm font-medium">
                            {message}
                        </span>

                    </div>
                </td>
            </tr>
        </tbody>
    );
}

TableLoading.propTypes = {
    colSpan: PropTypes.number.isRequired,
    message: PropTypes.string,
};