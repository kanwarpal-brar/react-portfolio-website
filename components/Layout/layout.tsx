import Script from "next/script";
import SideBar from "../Sidebar/sidebar";
import styles from "./layout.module.scss";
import { useMediaQuery } from "@mui/material";

export default function Layout({ children }: { children: React.ReactNode }) {
  const isMobile = useMediaQuery("(orientation: portrait", { noSsr: true })
    ? true
    : false;
  return (
    <div className={styles.layout_container}>
      <Script
        async
        strategy="afterInteractive"
        src="https://www.googletagmanager.com/gtag/js?id=YOUR ID"
      ></Script>
      <Script strategy="afterInteractive" id="gtm">
        {`
           window.dataLayer = window.dataLayer || [];
           function gtag(){dataLayer.push(arguments);}
           gtag('js', new Date());
           gtag('config', 'G-6Y5ES8TQ3X',{ 'debug_mode':true });
        `}
      </Script>
      <SideBar isMobile={isMobile} />
      <main className={styles.content_container}>{children}</main>
    </div>
  );
}
