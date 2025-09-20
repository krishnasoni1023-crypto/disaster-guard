import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { FullPageLoader } from "./components/FullPageLoader";

// Lazy load components
const Layout = React.lazy(() => import("./components/Layout"));
const Auth = React.lazy(() => import("./pages/Auth"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const CitizenApp = React.lazy(() => import("./pages/CitizenApp"));
const EmergencyEvacuation = React.lazy(() => import("./pages/EmergencyEvacuation"));
const SocialTracker = React.lazy(() => import("./pages/SocialTracker"));
const Settings = React.lazy(() => import("./pages/Settings"));
const ReportForm = React.lazy(() => import("./pages/ReportForm"));

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Suspense fallback={<FullPageLoader />}>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="citizen-app" element={<CitizenApp />} />
              <Route path="emergency" element={<EmergencyEvacuation />} />
              <Route path="social" element={<SocialTracker />} />
              <Route path="settings" element={<Settings />} />
              <Route path="report" element={<ReportForm />} />
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </Router>
  );
};

export default App;
