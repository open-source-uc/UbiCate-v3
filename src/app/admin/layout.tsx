'use client'

import { ReactNode, Suspense } from 'react'
import '../components/ui/css/admin.css'
import Footer from '../components/layout/Footer'
import AdminSidebarDesktop from '../components/ui/admin/AdminSidebarDesktop'
import { AuthProvider } from './auth-provider'
import { UserProvider } from "@/app/components/context/userContext";
import Header from '../components/layout/Header'


export const dynamic = 'force-dynamic'

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  actionButton?: ReactNode;
}

export default function AdminLayout({ children, title, actionButton }: AdminLayoutProps) {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 flex items-center justify-center">
          <div className="border border-black p-6 rounded-md bg-white shadow">
            Cargando…
          </div>
        </div>
      }
    >
      <AuthProvider>
        <UserProvider>
          <div className="view-container">
            <Header isAdmin={true} />
            <div className="main-area">
              <AdminSidebarDesktop />
              <main className="map-area" style={{ overflowY: "auto" }}>
                {title && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h1 style={{ fontSize: "2rem", color: "#0176DE", margin: 0 }}>{title}</h1>
                    {actionButton}
                  </div>
                )}
                {children}
              </main>
            </div>
          </div>
          <Footer />
        </UserProvider>
      </AuthProvider>
    </Suspense>
  );
}
