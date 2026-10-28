export { ProgressForm as LogProgressForm } from '@/components/admin/ProgressForm'
export { ProgressForm } from '@/components/admin/ProgressForm'
export default function LogProgressFormWrapper(props: React.ComponentProps<typeof import('@/components/admin/ProgressForm').ProgressForm>) {
  const { ProgressForm: Component } = require('@/components/admin/ProgressForm')
  return <Component {...props} />
}
