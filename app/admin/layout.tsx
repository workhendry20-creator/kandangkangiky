import React from 'react'
import { AdminNavbar } from '@/components/admin/AdminNavbar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col text-slate-800">
      <AdminNavbar />
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  )
}
