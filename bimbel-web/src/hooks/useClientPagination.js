import { useEffect, useMemo, useState } from "react";

/**
 * Paginasi di sisi browser untuk tabel yang memuat seluruh data sekaligus.
 * Hasil `pagination` & `onPageChange` cocok langsung dengan <TablePagination>.
 */
export default function useClientPagination(rows = [], initialPerPage = 10) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(initialPerPage);
  const total = rows.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));

  // Data berubah (filter/muat ulang) -> jangan tertinggal di halaman yang sudah tidak ada
  useEffect(() => {
    if (page > lastPage) setPage(lastPage);
  }, [page, lastPage]);

  const current = Math.min(page, lastPage);
  const pageRows = useMemo(() => rows.slice((current - 1) * perPage, current * perPage), [rows, current, perPage]);

  return {
    pageRows,
    pagination: {
      page: current,
      perPage,
      lastPage,
      total,
      from: total ? (current - 1) * perPage + 1 : 0,
      to: Math.min(current * perPage, total),
    },
    onPageChange: (target, newPerPage) => {
      if (newPerPage) setPerPage(newPerPage);
      setPage(target);
    },
  };
}
