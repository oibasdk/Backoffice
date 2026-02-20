import UserProfile from '@/components/pages/user-profile'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/user-profile')({
  component: RouteComponent,
})

function RouteComponent() {
  return(
    <UserProfile/>
  )
}
