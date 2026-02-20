import { createFileRoute } from "@tanstack/react-router";
import TableComp from 'src/components/utilities/table';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import StripedRowTable from 'src/components/utilities/table/StripedRowTable';
import HoverTable from 'src/components/utilities/table/HoverTable';
import CheckboxTable from 'src/components/utilities/table/CheckboxTable';
import { DataTable } from 'src/components/utilities/table/DataTable';
import { EmployeesData } from 'src/components/utilities/table/data';

export const Route = createFileRoute("/_layout/utilities/table")({
    component: TablePage,
});
function TablePage() {
    const BCrumb = [
        {
            to: '/',
            title: 'Home',
        },
        {
            title: 'Table',
        },
    ];
    return (
        <>
            <BreadcrumbComp title="Table" items={BCrumb} />
            <div className="flex flex-col gap-6 p-4">
                <DataTable data={EmployeesData} />
                <TableComp />
                <StripedRowTable />
                <HoverTable />
                <CheckboxTable />
            </div>
        </>
    );
}