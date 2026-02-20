

const FullLogo = () => {
  return (
    <>
      {/* Dark Logo   */}
      <img
        src={"/images/logos/dark-logo.svg"}
        alt="logo"
        className="block dark:hidden rtl:scale-x-[-1]"
      />
      {/* Light Logo  */}
      <img
        src={"/images/logos/light-logo.svg"}
        alt="logo"
        className="hidden dark:block rtl:scale-x-[-1]"
      />
    </>
  );
};

export default FullLogo;
