import { type AppType } from "next/app";
import { ClerkProvider } from "@clerk/nextjs";
import { api } from "~/utils/api";
import { ptBR } from "@clerk/localizations";
import Head from "next/head";
import { APP_NAME } from "~/utils/constants";
import { Toaster } from "react-hot-toast";
import "~/styles/globals.css";
import NProgress from "nprogress";
import Router, { useRouter } from "next/router";
import { useEffect } from "react";
import { I18nProvider } from "./locales";

NProgress.configure({ showSpinner: false });

Router.events.on("routeChangeStart", () => {
  NProgress.start();
});
Router.events.on("routeChangeComplete", () => NProgress.done());
Router.events.on("routeChangeError", () => NProgress.done());

const MyApp: AppType<{
  locale: any;
}> = ({ Component, pageProps }) => {
  useEffect(() => {
    localStorage.theme = "light";
  }, []);

  const router = useRouter();

  useEffect(() => {
    console.debug("Router locale", router.locale);

    // Hack to redirect to pt-BR if the user's browser is in pt-BR
    if (
      router.locale === "en" &&
      window.navigator.language === "pt-BR" &&
      !window.location.pathname.includes("/pt-BR")
    ) {
      window.location.pathname = window.location.pathname.replace(
        "/en",
        "/pt-BR",
      );
    }
  }, [router.locale]);

  return (
    <I18nProvider locale={pageProps.locale}>
      <ClerkProvider
        localization={router.locale === "pt-BR" ? ptBR : undefined}
        {...pageProps}
      >
        <Head>
          <title>{APP_NAME}</title>
          <meta name="description" content="💭" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <Toaster position="bottom-center" />

        <Component {...pageProps} />
      </ClerkProvider>
    </I18nProvider>
  );
};

export default api.withTRPC(MyApp);
