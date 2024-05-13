import styles from "./tabbutton.module.scss";
import { UseMediaQueryOptions, useMediaQuery } from "@mui/material";
export type TabButtonProps = {
  name: string;
  active: boolean;
  activateCallback: () => void;
};

export default function TabButton({
  name,
  active,
  activateCallback,
}: TabButtonProps) {
  const isMobile = useMediaQuery("(orientation: portrait") ? true : false;
  return (
    <button
      className={active ? styles.tab_button_active : styles.tab_button}
      onClick={activateCallback}
    >
      {isMobile && !active ? "A" : name}
    </button>
  );
}
