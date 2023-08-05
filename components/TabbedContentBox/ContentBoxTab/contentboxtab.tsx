import styles from "./contentboxtab.module.scss"

export type ContentBoxTabProps = {
    name: string
    children: React.ReactNode
}

export default function ContentBoxTab({ children }: ContentBoxTabProps) {
  return (
    <div className={styles.content_box_tab}>{children}</div>
  )
}
