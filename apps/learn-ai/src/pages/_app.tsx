import { type AppType } from "next/app";
import { ClerkProvider } from "@clerk/nextjs";
import { api } from "~/utils/api";
import Head from "next/head";
import { APP_NAME } from "~/utils/constants";
import { Toaster } from "react-hot-toast";
import "~/styles/globals.css";
import NProgress from "nprogress";
import Router from "next/router";
import { useEffect } from "react";

NProgress.configure({ showSpinner: false });

Router.events.on("routeChangeStart", () => {
  NProgress.start();
});
Router.events.on("routeChangeComplete", () => NProgress.done());
Router.events.on("routeChangeError", () => NProgress.done());

const MyApp: AppType = ({ Component, pageProps }) => {
  useEffect(() => {
    localStorage.theme = "light";
  }, []);

  return (
    <ClerkProvider {...pageProps}>
      <Head>
        <title>{APP_NAME}</title>
        <meta name="description" content="💭" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Toaster position="bottom-center" />

      <Component {...pageProps} />
    </ClerkProvider>
  );
};

export default api.withTRPC(MyApp);
