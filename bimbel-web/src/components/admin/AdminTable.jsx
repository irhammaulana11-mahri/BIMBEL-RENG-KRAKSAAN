export default function AdminTable({columns,data,onEdit,onDelete}) {
  return (
    <div className="bg-white rounded-xl shadow">

      <table className="w-full">

        <thead>

          <tr className="border-b">

            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left p-4"
              >
                {col.label}
              </th>
            ))}

            <th className="p-4">
              Aksi
            </th>

          </tr>

        </thead>

        <tbody>

          {data.map((row) => (

            <tr
              key={row.id}
              className="border-b"
            >

              {columns.map((col) => (
                <td
                  key={col.key}
                  className="p-4"
                >
                  {row[col.key]}
                </td>
              ))}

              <td className="p-4">

                <button
                  onClick={() => onEdit(row)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded mr-2"
                >
                  Edit
                </button>

                <button
                  onClick={() => onDelete(row.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded"
                >
                  Hapus
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}