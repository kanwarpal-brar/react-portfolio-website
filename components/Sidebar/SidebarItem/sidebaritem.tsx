import styles from "./sidebaritem.module.scss";
import Link from "next/link";
import { IconType } from "react-icons";

export type SideBarIconProps = {
  name: string;
  icon: IconType;
  redirectUrl: string;
  active?: boolean;
  newTab?: boolean;
  clickCallback?: () => void;
};

export default function SideBarIcon({
  name,
  icon,
  redirectUrl,
  active,
  newTab,
  clickCallback,
}: SideBarIconProps) {
  const Icon = icon;
  return (
    <Link
      href={redirectUrl}
      className={active ? styles.sidebar_item_active : styles.sidebar_item}
      target={newTab ? "_blank" : undefined}
      onClick={clickCallback}
    >
      <Icon className={styles.sidebar_item_icon} />
      <span className={styles.sidebar_item_text}>{name}</span>
    </Link>
  );
}
