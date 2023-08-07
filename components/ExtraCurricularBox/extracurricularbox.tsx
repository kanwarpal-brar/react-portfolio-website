import styles from "./extracurricularbox.module.scss"
import Image from "next/image"

export type ExtraCurricularBoxProps = {
    name: string;
    img: string; // Expects a path to an image
    desc: string;
}

export default function ExtraCurricularBox({ name, img, desc }: ExtraCurricularBoxProps) {
  return (
    <div className={styles.box}>
        <div className={styles.text_box}>
            <h2>{name}</h2>
            <p>{desc}</p>
        </div>
        <Image className={styles.image} src={img} alt={`Icon for ${name}`} width={150} height={150}/>
    </div>
  )
}
