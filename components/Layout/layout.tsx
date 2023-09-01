import SideBar from "../Sidebar/sidebar";
import styles from "./layout.module.scss";
import { useMediaQuery } from "@mui/material";

export default function Layout({ children }: { children: React.ReactNode }) {
  const isMobile = useMediaQuery("(orientation: portrait", {noSsr: true}) ? true : false
  return (
    <div className={styles.layout_container}>
      <SideBar isMobile={isMobile}/>
      <main className={styles.content_container}>{children}</main>
    </div>
  );
}
