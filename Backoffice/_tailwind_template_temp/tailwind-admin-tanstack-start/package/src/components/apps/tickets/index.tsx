import CardBox from "src/components/shared/CardBox";
import TicketFilter from "src/components/apps/tickets/TicketFilter";
import TicketListing from "src/components/apps/tickets/TicketListing";
import { TicketProvider } from '@/context/ticket-context/index';
import BreadcrumbComp from "@/layouts/full/shared/breadcrumb/BreadcrumbComp";
const BCrumb = [
  {
    to: "/",
    title: "Home",
  },
  {
    title: "Tickets",
  },
];

const TicketsApp = () => {
  return (
    <>
      <TicketProvider>
         <BreadcrumbComp title="Tickets App" items={BCrumb} />
        <CardBox>
          <TicketFilter />
          <TicketListing />
        </CardBox>
      </TicketProvider>
    </>
  );
};

export default TicketsApp;
