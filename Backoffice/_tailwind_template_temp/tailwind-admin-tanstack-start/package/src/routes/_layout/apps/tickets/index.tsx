import TicketsApp from '@/components/apps/tickets';
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/apps/tickets/')({
  component: TicketsApp,
})
