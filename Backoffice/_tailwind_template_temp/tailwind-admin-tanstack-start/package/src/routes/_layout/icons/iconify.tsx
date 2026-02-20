import IconifyIcon from 'src/components/icons/IconifyIcon';
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/icons/iconify')({
  component: RouteComponent,
})



function RouteComponent() {
  return (
    <IconifyIcon/>
  )
}
