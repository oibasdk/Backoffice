import { createFileRoute, Outlet } from '@tanstack/react-router'
import FullLayout from '../layouts/full/FullLayout'


export const Route = createFileRoute('/_layout')({
    component: LayoutComponent,
})

function LayoutComponent() {
    return (
        <FullLayout>
            <Outlet />
        </FullLayout>
    )
}
