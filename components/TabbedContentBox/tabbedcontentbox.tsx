import styles from "./tabbedcontentbox.module.scss"
import ContentBoxTab from "./ContentBoxTab/contentboxtab"
import TabButton, { TabButtonProps } from "./TabButton/tabbutton"
import { useState } from "react"

export type TabbedContentBoxProps = {
    children: React.ReactElement<typeof ContentBoxTab>[]
}

export default function TabbedContentBox({children}: TabbedContentBoxProps) {
  const [activeTab, setActiveTab] = useState(0)
  const tabButtons: React.ReactElement<typeof TabButton>[] = []
  const tabs = children.map(
    (child, i) => {
      const setActiveCallback = () => { setActiveTab(i) }
      tabButtons.push(<TabButton active={false} name={child.props.name} activateCallback={setActiveCallback} key={child.props.name}/>)
      return(child)
  })
  


  return (
    <div className={styles.tabs_container}>
      <div className={styles.tab_buttons_container}>
        {tabButtons}
      </div>
      <div className={styles.tab_content_container}>
        { tabs[activeTab] }
      </div>
      
    </div>
  )
}
