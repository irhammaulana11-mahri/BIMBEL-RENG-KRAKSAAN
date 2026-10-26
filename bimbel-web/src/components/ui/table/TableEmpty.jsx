import PropTypes from "prop-types";
import { Inbox } from "lucide-react";

export default function TableEmpty({
    colSpan,
    icon: Icon = Inbox,
    title = "Belum ada data",
    description = "Data akan ditampilkan di sini.",
    action = null,
}) {
    return (
        <tbody>
            <tr>
                <td
                    colSpan={colSpan}
                    className="px-6 py-16"
                >
                    <div className="flex flex-col items-center justify-center">

                        <div className="rounded-full bg-gray-100 p-4">
                            <Icon
                                size={34}
                                className="text-gray-400"
                            />
                        </div>

                        <h3 className="mt-4 text-lg font-semibold text-gray-700">
                            {title}
                        </h3>

                        <p className="mt-2 max-w-md text-center text-sm text-gray-500">
                            {description}
                        </p>

                        {action && (
                            <div className="mt-6">
                                {action}
                            </div>
                        )}

                    </div>
                </td>
            </tr>
        </tbody>
    );
}

TableEmpty.propTypes = {
    colSpan: PropTypes.number.isRequired,
    icon: PropTypes.elementType,
    title: PropTypes.string,
    description: PropTypes.string,
    action: PropTypes.node,
};