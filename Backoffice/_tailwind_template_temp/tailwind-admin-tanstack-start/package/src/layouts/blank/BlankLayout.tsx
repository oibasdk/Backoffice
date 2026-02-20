import { Outlet } from "@tanstack/react-router";
import ScrollToTop from "src/components/shared/ScrollToTop";

const BlankLayout = () => (
  <>
    <ScrollToTop>
      <Outlet />
    </ScrollToTop>
  </>
);

export default BlankLayout;
