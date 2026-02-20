import BlogDetailData from '@/components/apps/blog/detail';
import { BlogProvider } from '@/context/blog-context';
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/apps/blog/detail/$postid')({
  component: RouteComponent,
})



function RouteComponent() {
  return (
    <>
    <BlogProvider>
        <BlogDetailData />
        </BlogProvider>
    </>
  )
}
