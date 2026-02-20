
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/apps/tickets')({
  component: RouteComponent,
})



function RouteComponent() {
  return (
    <>
     
      <Outlet />
    </>
  );
}
