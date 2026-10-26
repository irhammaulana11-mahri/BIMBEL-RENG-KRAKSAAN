import { useEffect, useState } from "react";
import { Save, RotateCcw, } from "lucide-react";

const DEFAULT_VALUES = {
    full_name: "",
    gender: "",
    birth_date: "",
    education_level: "",
    school_name: "",
    grade: "",
    address: "",
};

export default function StudentForm({initialValues = DEFAULT_VALUES,loading = false,onSubmit,}) {
    const [form, setForm] = useState(DEFAULT_VALUES);
    useEffect(() => {
        setForm({
            ...DEFAULT_VALUES,
            ...initialValues,
        });

    }, [initialValues]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));

    };

    const handleReset = () => {setForm(DEFAULT_VALUES);};
    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit?.(form);
    };

    return (

        <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-gray-200 bg-white shadow-sm"
        >

            {/* Header */}
            <div className="border-b px-6 py-5">
                <h2 className="text-lg font-semibold">Biodata Murid</h2>
                <p className="text-sm text-gray-500 mt-1">Lengkapi informasi murid yang akan didaftarkan.</p>
            </div>

            {/* Body */}

            <div className="p-6 space-y-6">

                {/* Nama */}
                <div>
                    <label className="block mb-2 text-sm font-medium">Nama Lengkap</label>
                    <input type="text" name="full_name" value={form.full_name} onChange={handleChange}
                        className="w-full rounded-lg border px-3 py-2" placeholder="Nama lengkap murid"
                        required
                    />
                </div>

                {/* Gender + Birth */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="block mb-2 text-sm font-medium">Jenis Kelamin</label>
                        <select name="gender" value={form.gender} onChange={handleChange}
                            className="w-full rounded-lg border px-3 py-2"
                        >
                            <option value="">Pilih</option>
                            <option value="L">Laki-laki</option>
                            <option value="P">Perempuan</option>
                        </select>
                    </div>

                    <div>
                        <label className="block mb-2 text-sm font-medium">Tanggal Lahir</label>
                        <input type="date" name="birth_date" value={form.birth_date} onChange={handleChange}
                            className="w-full rounded-lg border px-3 py-2"
                        />

                    </div>
                </div>

                {/* Jenjang */}
                <div>
                    <label className="block mb-2 text-sm font-medium">Jenjang Pendidikan</label>
                    <select name="education_level" value={form.education_level} onChange={handleChange}
                        className="w-full rounded-lg border px-3 py-2"
                    >
                        <option value="">Pilih Jenjang</option>
                        <option value="TK">TK</option>
                        <option value="SD">SD</option>
                        <option value="SMP">SMP</option>
                        <option value="SMA">SMA</option>
                        <option value="SMK">SMK</option>
                        <option value="Mahasiswa">Mahasiswa</option>
                    </select>
                </div>

                {/* Sekolah */}
                <div>
                    <label className="block mb-2 text-sm font-medium">Nama Sekolah</label>
                    <input type="text" name="school_name" value={form.school_name} onChange={handleChange}
                        className="w-full rounded-lg border px-3 py-2" placeholder="Nama Sekolah"
                    />

                </div>

                {/* Kelas */}
                <div>
                    <label className="block mb-2 text-sm font-medium">Kelas</label>
                    <input type="text" name="grade" value={form.grade} onChange={handleChange}
                        className="w-full rounded-lg border px-3 py-2" placeholder="Contoh: 5A"
                    />
                </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t px-6 py-4">
                <button type="button" onClick={handleReset}
                    className="inline-flex items-center gap-2 rounded-lg border px-4 py-2"
                >
                    <RotateCcw size={18} />Reset</button>
                <button type="submit" disabled={loading}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                    <Save size={18} />
                    {loading
                        ? "Menyimpan..."
                        : "Simpan Murid"}

                </button>
            </div>
        </form>
    );
}