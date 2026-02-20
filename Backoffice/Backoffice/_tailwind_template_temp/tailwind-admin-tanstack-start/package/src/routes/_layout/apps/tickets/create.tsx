import CreateTicketForm from '@/components/apps/tickets/CreateTicketForm';

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/apps/tickets/create')({
  component: RouteComponent,
})



function RouteComponent() {
  return (
    <>


      <CreateTicketForm />

    </>
  );
}
