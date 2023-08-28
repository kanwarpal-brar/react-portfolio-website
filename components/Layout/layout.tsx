import SideBar from "../Sidebar/sidebar";
import styles from "./layout.module.scss";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.layout_container}>
      <SideBar />
      <main className={styles.content_container}>{children}</main>
    </div>
  );
}
