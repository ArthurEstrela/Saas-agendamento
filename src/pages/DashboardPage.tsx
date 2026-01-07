import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useProfileStore } from "../store/profileStore";
import ServiceProviderDashboard from "../components/ServiceProviderDashboard";
import { DashboardSkeleton } from "../components/Common/LoadingSpinner";
import { ClientDashboard } from "../components/ClientDashboard";
import ProfessionalDashboard from "../components/Professional/ProfessionalDashboard";

const DashboardPage = () => {
  const { userProfile, isLoadingProfile, error } = useProfileStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect root "/dashboard" to the correct default sub-route (English)
  useEffect(() => {
    if (userProfile && location.pathname === "/dashboard") {
      if (userProfile.role === "client") {
        navigate("/dashboard/explore", { replace: true });
      } else if (userProfile.role === "serviceProvider") {
        navigate("/dashboard/agenda", { replace: true });
      } else if (userProfile.role === "professional") {
        navigate("/dashboard/home", { replace: true });
      }
    }
  }, [userProfile, location.pathname, navigate]);

  if (isLoadingProfile && !userProfile) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-red-50 text-red-700">
        <h2 className="text-2xl font-bold">Error Loading Profile</h2>
        <p>{error}</p>
      </div>
    );
  }

  // Render the Layout Wrapper based on User Role
  if (userProfile) {
    if (userProfile.role === "client") {
      return <ClientDashboard />;
    }
    if (userProfile.role === "serviceProvider") {
      return <ServiceProviderDashboard />;
    }
    if (userProfile.role === "professional") {
      return <ProfessionalDashboard />;
    }
    return <div>Unknown user role.</div>;
  }

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Profile not found.</h2>
      </div>
    </div>
  );
};

export default DashboardPage;