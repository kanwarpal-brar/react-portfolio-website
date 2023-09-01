import styles from "./sidebaritem.module.scss";
import Link from "next/link";
import { Chivo_Mono } from "next/font/google";

const chivoMono = Chivo_Mono({ subsets: ["latin"] });

export type SideBarIconProps = {
  name: string;
  icon: any;
  redirectUrl: string;
  active?: boolean;
  newTab?: boolean;
  noName?: boolean;
};

export default function SideBarIcon({
  name,
  icon,
  redirectUrl,
  active,
  newTab,
  noName,
}: SideBarIconProps) {
  const Icon = icon;
  return (
    <Link
      href={redirectUrl}
      className={active ? styles.sidebar_item_active : styles.sidebar_item}
      target={newTab ? "_blank" : undefined}
    >
      <Icon className={styles.sidebar_item_icon} />
      { noName ? undefined : <span className={`${styles.sidebar_item_text} ${chivoMono.className}`}>{name}</span>}
    </Link>
  );
}
