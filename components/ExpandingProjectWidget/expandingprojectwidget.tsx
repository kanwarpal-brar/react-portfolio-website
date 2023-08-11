import styles from "./expandingprojectwidget.module.scss"
import Image from "next/image"

export type ExpandingProjectWidgetProps = {
    title: string;
    img: string;
    desc: string;
    link: string;
}

export default function ExpandingProjectWidget({ title, img, desc, link }: ExpandingProjectWidgetProps) {
  return (
    <div className={styles.container}>
        <h2>{title}</h2>
        <Image src={img} alt={`Image for ${title} project`}/>
    </div>
  )
}
