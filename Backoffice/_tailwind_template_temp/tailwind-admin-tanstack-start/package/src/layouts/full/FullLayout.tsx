import { FC, ReactNode } from "react";
import Sidebar from "./vertical/sidebar/Sidebar";
import Header from "./vertical/header/Header";

const FullLayout: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <>
      <div className="flex w-full min-h-screen">
        <div className="page-wrapper flex w-full ">
          {/* Header/sidebar */}
          <div className="xl:block hidden">
            <Sidebar />
          </div>
          <div className="body-wrapper w-full bg-white dark:bg-dark">
            {/* Top Header  */}
            <Header />

            {/* Body Content  */}
            <div className={'container mx-auto px-6 py-30'}>
              <main className="grow">
                {children}
              </main>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};




export default FullLayout;


