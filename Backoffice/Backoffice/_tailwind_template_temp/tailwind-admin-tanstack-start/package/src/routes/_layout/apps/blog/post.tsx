import BlogPost from '@/components/apps/blog/BlogPost';
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/apps/blog/post')({
  component: RouteComponent,
})




function RouteComponent() {
 return (
    <>
      
      <BlogPost />
    </>
  );
}
