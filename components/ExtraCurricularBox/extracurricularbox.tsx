import styles from "./extracurricularbox.module.scss";
import Imgix from "react-imgix";
import projectConfig from "../../public/targetProjects.json";
import { useState, useEffect } from "react";

export type ExtraCurricularBoxProps = {
    name: string;
    img: string; // Expects an image name
    desc: string | string[];
}

export default function ExtraCurricularBox({ name, img, desc }: ExtraCurricularBoxProps) {
  const [ImgComp, setImgComp] = useState<React.ReactElement>()

  useEffect(() => {
    setImgComp(<Imgix
      className={styles.image} src={`${projectConfig.repoImageUrl}/logos/${img}`}
      sizes="calc(25%)"
      htmlAttributes={{ // These are ignored by Imgix but passed through to the <img> element
        width: 200,
        height: 200,
      }}
    />)
  }, [img])


  return (
    <div className={styles.box}>
        <div className={styles.text_box}>
            <h2>{name}</h2>
            { Array.isArray(desc) ? desc.map((para, i) => {
              return <p key={i}>{para}</p>
            })
            : <p>{desc}</p> }
        </div>
        {ImgComp}
    </div>
  )
}
