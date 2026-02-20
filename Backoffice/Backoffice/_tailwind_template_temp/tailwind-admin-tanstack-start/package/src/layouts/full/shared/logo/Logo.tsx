import { Link } from "@tanstack/react-router";

const Logo = () => {
  return (
    <Link to={"/"}>
      <img src={"/images/logos/logo-icon.svg"} alt="logo" />
    </Link>
  );
};

export default Logo;
