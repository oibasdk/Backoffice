
import { useContext } from "react";
import _ from "lodash";
import BlogCard from "./BlogCard";
import { BlogContext } from "../../../context/blog-context";
import BlogFeaturedCard from "./BlogFeaturedCard";

const BlogListing = () => {
  const { posts, sortBy } = useContext(BlogContext);

  // Function to filter blog posts based on sorting criteria
  const filterBlogs = (posts: any[], sortBy: string) => {
    let filteredPosts = [...posts];

    if (sortBy === "newest") {
      filteredPosts = _.orderBy(filteredPosts, ["createdAt"], ["desc"]);
    } else if (sortBy === "oldest") {
      filteredPosts = _.orderBy(filteredPosts, ["createdAt"], ["asc"]);
    } else if (sortBy === "popular") {
      filteredPosts = _.orderBy(filteredPosts, ["view"], ["desc"]);
    }

    // Filter out featured posts
    return filteredPosts.filter((post) => !post.featured);
  };

  // Function to filter featured posts
  const filterFeaturedPosts = (posts: any[]) => {
    return posts.filter((post) => post.featured);
  };

  const blogPosts = filterBlogs(posts, sortBy);
  const featuredPosts = filterFeaturedPosts(posts);

  return (
    <div className="grid grid-cols-12 gap-6">
      {featuredPosts.map((post, index) => {
        return <BlogFeaturedCard index={index} post={post} key={post.id} />;
      })}
      {blogPosts.map((post) => {
        return <BlogCard post={post} key={post.id} />;
      })}
    </div>
  );
};
export default BlogListing;
