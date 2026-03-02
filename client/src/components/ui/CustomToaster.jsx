import { Toaster } from "react-hot-toast";

const CustomToaster = () => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "#27272a",
          color: "#fff",
          fontWeight: "bold",
        },
        success: {
          iconTheme: {
            primary: "#facc15",
            secondary: "#27272a",
          },
        },
        error: {
          style: {
            background: "#fef2f2",
            color: "#b91c1c",
          },
          iconTheme: {
            primary: "#dc2626",
            secondary: "#fef2f2",
          },
        },
      }}
    />
  );
};

export default CustomToaster;
