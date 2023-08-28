import styles from "./tabbedcontentbox.module.scss";
import ContentBoxTab from "./ContentBoxTab/contentboxtab";
import TabButton, { TabButtonProps } from "./TabButton/tabbutton";
import { useState } from "react";

export type TabbedContentBoxProps = {
  children: React.ReactElement<typeof ContentBoxTab>[];
  title?: string;
};

export default function TabbedContentBox({
  children,
  title,
}: TabbedContentBoxProps) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className={styles.tabs_container}>
      {title ? (
        <h2>
          <u>{title}</u>
        </h2>
      ) : null}
      <div className={styles.tab_buttons_container}>
        {children.map((child, i) => {
          return (
            <TabButton
              active={i == activeTab}
              key={i}
              name={child.props.name}
              activateCallback={() => setActiveTab(i)}
            />
          );
        })}
      </div>
      <div className={styles.tab_content_container}>{children[activeTab]}</div>
    </div>
  );
}
