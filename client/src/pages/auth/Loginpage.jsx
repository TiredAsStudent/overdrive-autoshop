import LoginForm from "../../features/auth/LoginForm";
import BannerLogo from "../../assets/Banner_Logo.png";
import Footer from "../../components/layout/Footer";

const LoginPage = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 sm:p-10 space-y-6">
        {/* Banner Logo */}
        <div className="w-full flex justify-center">
          <img
            src={BannerLogo}
            alt="Overdrive Banner"
            className="h-24 sm:h-28 w-full object-contain"
          />
        </div>

        {/* Login Form */}
        <div className="w-full">
          <LoginForm />
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default LoginPage;
