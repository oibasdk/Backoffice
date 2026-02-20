import Form from "@/components/utilities/form";
import BreadcrumbComp from "@/layouts/full/shared/breadcrumb/BreadcrumbComp";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/utilities/form")({
  component: RouteComponent,
});

const BCrumb = [
  {
    to: "/",
    title: "Home",
  },
  {
    title: "Form",
  },
];

function RouteComponent() {
  return (
    <>
      <BreadcrumbComp title="Form Elements" items={BCrumb} />
      <Form />
    </>
  );
}
