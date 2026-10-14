import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/auth'

export default async function LoginPage() {
  const session = await getAdminSession()
  if (session) {
    redirect('/admin/dashboard')
  } else {
    redirect('/admin/login')
  }
}
