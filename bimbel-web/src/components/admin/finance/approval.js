// Aturan bantu persetujuan keuangan (D-11); server tetap memvalidasi.

export const MIN_APPROVAL_NOTE = 10;

/**
 * Siap dikirim? Mode operator tunggal: password wajib; bila akun ini juga mengerjakan tahap sebelumnya
 * (isSelf), alasan minimal 10 karakter. Mode terpisah: akun yang sama tidak boleh melanjutkan.
 */
export const approvalReady = ({ mode, isSelf, password, note }) =>
  mode === "separated" ? !isSelf : Boolean(password) && (!isSelf || note.trim().length >= MIN_APPROVAL_NOTE);
