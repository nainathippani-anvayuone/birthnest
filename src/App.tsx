import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { RoleGate } from '@/components/layout/RoleGate';

import { LandingPage } from '@/pages/public/LandingPage';
import { LoginPage } from '@/pages/public/LoginPage';
import { NotFoundPage } from '@/pages/public/NotFoundPage';

import { DashboardHome } from '@/pages/dashboard/DashboardHome';
import { PatientsPage } from '@/pages/dashboard/shared/PatientsPage';
import { AppointmentsPage } from '@/pages/dashboard/shared/AppointmentsPage';
import { SchedulesPage } from '@/pages/dashboard/doctor/SchedulesPage';
import { ConsultationsPage } from '@/pages/dashboard/shared/ConsultationsPage';
import { PrescriptionsPage } from '@/pages/dashboard/shared/PrescriptionsPage';
import { LabPage } from '@/pages/dashboard/shared/LabPage';
import { BillingPage } from '@/pages/dashboard/shared/BillingPage';
import { PharmacyPage } from '@/pages/dashboard/admin/PharmacyPage';
import { ServicesPage } from '@/pages/dashboard/admin/ServicesPage';
import { UsersPage } from '@/pages/dashboard/admin/UsersPage';
import { AnalyticsPage } from '@/pages/dashboard/admin/AnalyticsPage';
import { NotificationsPage } from '@/pages/dashboard/shared/NotificationsPage';
import { ProfilePage } from '@/pages/dashboard/shared/ProfilePage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardHome />} />
            <Route
              path="patients"
              element={
                <RoleGate roles={['admin', 'doctor', 'receptionist', 'lab_staff']}>
                  <PatientsPage />
                </RoleGate>
              }
            />
            <Route
              path="appointments"
              element={
                <RoleGate roles={['admin', 'doctor', 'receptionist']}>
                  <AppointmentsPage />
                </RoleGate>
              }
            />
            <Route
              path="schedules"
              element={
                <RoleGate roles={['admin', 'doctor']}>
                  <SchedulesPage />
                </RoleGate>
              }
            />
            <Route
              path="consultations"
              element={
                <RoleGate roles={['admin', 'doctor']}>
                  <ConsultationsPage />
                </RoleGate>
              }
            />
            <Route
              path="prescriptions"
              element={
                <RoleGate roles={['admin', 'doctor']}>
                  <PrescriptionsPage />
                </RoleGate>
              }
            />
            <Route
              path="lab"
              element={
                <RoleGate roles={['admin', 'doctor', 'lab_staff', 'receptionist']}>
                  <LabPage />
                </RoleGate>
              }
            />
            <Route
              path="billing"
              element={
                <RoleGate roles={['admin', 'receptionist']}>
                  <BillingPage />
                </RoleGate>
              }
            />
            <Route
              path="pharmacy"
              element={
                <RoleGate roles={['admin', 'receptionist']}>
                  <PharmacyPage />
                </RoleGate>
              }
            />
            <Route
              path="services"
              element={
                <RoleGate roles={['admin']}>
                  <ServicesPage />
                </RoleGate>
              }
            />
            <Route
              path="users"
              element={
                <RoleGate roles={['admin']}>
                  <UsersPage />
                </RoleGate>
              }
            />
            <Route
              path="analytics"
              element={
                <RoleGate roles={['admin']}>
                  <AnalyticsPage />
                </RoleGate>
              }
            />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
