

import BreadcrumbComp from "@/layouts/full/shared/breadcrumb/BreadcrumbComp";
import BlogListing from "src/components/apps/blog/BlogListing";
import { BlogProvider } from "@/context/blog-context/index";


const BCrumb = [
  {
    to: "/",
    title: "Home",
  },
  {
    title: "Blog app",
  },
];

const BlogPost = () => {
  return (
    <>
      <BreadcrumbComp title="Blog app" items={BCrumb} />

       <BlogProvider>
        <BlogListing />
      </BlogProvider>
    </>
  )
}

export default BlogPost
