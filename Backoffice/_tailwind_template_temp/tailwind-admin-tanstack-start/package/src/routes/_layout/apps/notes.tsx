import NotesApp from '@/components/apps/notes';

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/apps/notes')({
  component: RouteComponent,
})




function RouteComponent() {
   return (
    <>

     
      <NotesApp />
    </>
  );
}
