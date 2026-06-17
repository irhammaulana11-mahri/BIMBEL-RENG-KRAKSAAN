import { useEffect, useState } from "react";

import { updateLead } from "../../../services/leadService";

export default function LeadDetailModal({
  open,
  onClose,
  data,
  onSuccess,
}) {
  const [loading, setLoading] =
    useState(false);

  const [status, setStatus] =
    useState("NEW");

  useEffect(() => {
    if (data) {
      setStatus(
        data.status || "NEW"
      );
    }
  }, [data]);

  if (!open || !data)
    return null;

  const handleSubmit =
    async () => {
      try {
        setLoading(true);

        await updateLead(
          data.id,
          {
            ...data,
            status,
          }
        );

        onSuccess();

        onClose();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

  return (
    <div
      className="
      fixed inset-0
      bg-black/50
      z-[9999]
      flex items-center
      justify-center
    "
    >
      <div
        className="
        bg-white
        rounded-2xl
        w-full
        max-w-2xl
        p-6
      "
      >
        <div className="flex justify-between mb-6">

          <h2 className="text-xl font-bold">
            Detail Lead
          </h2>

          <button
            onClick={onClose}
          >
            ✕
          </button>

        </div>

        <div className="space-y-4">

          <div>
            <label className="font-medium">
              Nama
            </label>

            <p>
              {
                data.full_name
              }
            </p>
          </div>

          <div>
            <label className="font-medium">
              Telepon
            </label>

            <p>
              {data.phone}
            </p>
          </div>

          <div>
            <label className="font-medium">
              Jenjang
            </label>

            <p>
              {
                data.education_level
              }
            </p>
          </div>

          <div>
            <label className="font-medium">
              Paket
            </label>

            <p>
              {data.package
                ?.package_name ||
                "-"}
            </p>
          </div>

          <div>
            <label className="font-medium">
              Catatan
            </label>

            <div
              className="
              mt-2
              p-3
              bg-slate-50
              rounded-xl
            "
            >
              {data.notes ||
                "-"}
            </div>
          </div>

          <div>

            <label>
              Status
            </label>

            <select
              value={status}
              onChange={(e) =>
                setStatus(
                  e.target.value
                )
              }
              className="
                w-full
                border
                rounded-xl
                p-3
                mt-2
              "
            >
              <option value="NEW">
                NEW
              </option>

              <option value="CONTACTED">
                CONTACTED
              </option>

              <option value="FOLLOW_UP">
                FOLLOW UP
              </option>

              <option value="REGISTERED">
                REGISTERED
              </option>

              <option value="CLOSED">
                CLOSED
              </option>

            </select>

          </div>

        </div>

        <div className="mt-6 flex justify-end gap-3">

          <button
            onClick={onClose}
            className="
              px-4 py-2
              border
              rounded-xl
            "
          >
            Tutup
          </button>

          <button
            onClick={
              handleSubmit
            }
            disabled={loading}
            className="
              px-4 py-2
              bg-blue-600
              text-white
              rounded-xl
            "
          >
            {loading
              ? "Menyimpan..."
              : "Update Status"}
          </button>

        </div>

      </div>
    </div>
  );
}