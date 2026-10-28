export { NewSheepForm as AddSheepForm } from '@/components/admin/NewSheepForm'
export { NewSheepForm } from '@/components/admin/NewSheepForm'
export default function AddSheepFormWrapper(props: React.ComponentProps<typeof import('@/components/admin/NewSheepForm').NewSheepForm>) {
  const { NewSheepForm: Component } = require('@/components/admin/NewSheepForm')
  return <Component {...props} />
}
