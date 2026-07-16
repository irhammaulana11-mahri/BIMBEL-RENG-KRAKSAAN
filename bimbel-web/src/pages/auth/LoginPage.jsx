import { useState } from "react";
import { login,getDashboard, } from "../../services/authService";
import { redirectByRole } from "../../services/utils/redirectByRole";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [loading,setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await login({email,password,});
      localStorage.setItem("token",res.data.token);
      const dashboard = await getDashboard();
      redirectByRole(dashboard.data.role,navigate);
    } catch(err) {
      alert("Email / Password salah");
    } finally {
      setLoading(false);
    }
  };

  return (

    <div className="min-h-screen flex">

      {/* kiri */}
      <div className="hidden lg:flex w-1/2 bg-blue-600 text-white">
        <div className="m-auto text-center px-10">
          <h1 className="text-5xl font-bold mb-4">
            Selamat Datang Kembali
          </h1>
          <p className="text-lg">
            Silakan login untuk melanjutkan
          </p>

          <img
            src="/images/login-illustration.png"
            className="mt-10 w-96 mx-auto"
          />
        </div>
      </div>

      {/* kanan */}
      <div className="w-full lg:w-1/2 flex items-center justify-center">
        <div className="w-full max-w-md bg-white p-10 rounded-xl">
          <div className="text-center mb-8">
            <img src="/logo.png" className="h-20 mx-auto mb-4"/>
            <h2 className="text-3xl font-bold">Login</h2>
          </div>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label>Email</label>
              <input type="email" className="w-full border rounded-lg p-3 mt-1" value={email}
                onChange={(e)=>setEmail(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label>Password</label>
              <input type="password" className="w-full border rounded-lg p-3 mt-1" value={password}
                onChange={(e)=>setPassword(e.target.value)}
              />
            </div>

            <button className="w-full bg-blue-600 text-white py-3 rounded-lg" disabled={loading}>
              {loading ? "Loading..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}