import { useState } from 'react'
import { isAdminAuthenticated } from '../utils/adminAuth'
import { AdminLogin } from '../components/Admin/AdminLogin'
import { AdminLayout } from '../components/Admin/AdminLayout'

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(isAdminAuthenticated)

  if (!authenticated) {
    return <AdminLogin onAuthenticated={() => setAuthenticated(true)} />
  }

  return <AdminLayout onLogout={() => setAuthenticated(false)} />
}
