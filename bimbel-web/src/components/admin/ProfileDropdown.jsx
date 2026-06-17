import { useEffect, useState } from "react";

export default function ProfileDropdown() {
  const [company, setCompany] = useState(null);
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

    useEffect(() => {
      loadCompany();
    }, []);
  
    const loadCompany = async () => {
      try {
        const res = await getCompanyProfile();
        setCompany(res.data.data);
      } catch (err) {
        console.error(err);
      }
    };
  

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3"
      >
        <img
          src="https://i.pravatar.cc/40"
          alt="avatar"
          className="w-10 h-10 rounded-full"
        />

        <span className="font-medium">
          {company?.n}
        </span>
      </button>

      {open && (
        <div
          className="
            absolute right-0 mt-2
            bg-white
            rounded-xl
            shadow-lg
            border
            w-56
            z-50
          "
        >
          <div className="p-4 border-b">
            <h4 className="font-semibold">
              Admin
            </h4>

            <p className="text-sm text-gray-500">
              admin@bimbel.id
            </p>
          </div>

          <button
            className="
              w-full text-left
              px-4 py-3
              hover:bg-gray-50
            "
          >
            Profile
          </button>

          <button
            className="
              w-full text-left
              px-4 py-3
              hover:bg-gray-50
            "
          >
            Pengaturan
          </button>

          <button
            onClick={handleLogout}
            className="
              w-full text-left
              px-4 py-3
              text-red-600
              hover:bg-red-50
            "
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}