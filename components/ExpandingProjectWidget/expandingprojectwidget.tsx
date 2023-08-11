import { Modal } from "@mui/material";
import styles from "./expandingprojectwidget.module.scss"
import Image from "next/image"
import { useState } from "react";

export type ExpandingProjectWidgetProps = {
    title: string;
    img: string;
    desc: string;
    link: string;
    style?: {[key: string]: string};
    imgSize?: {height: string, width: string};
    tags?: string[]
}

export default function ExpandingProjectWidget({ title, img, desc, link, style, imgSize, tags }: ExpandingProjectWidgetProps) {
	const [open, setOpen] = useState(false)
  let debounce = false

  function handleOpenByContainer() {
    if (!debounce) {
      setOpen(true)
    }
  }

	function handleOpen() {
		setOpen(true)
	}

	function handleClose() {
		debounce = true
		setOpen(false)
    setTimeout(() => {debounce = false}, 50)
	}

  return (
    <div className={styles.container} onClick={handleOpenByContainer} style={style}>
        <h3>{title}</h3>
        <div className={styles.img_box}>
          <Image src={img} alt={`Image for ${title} project`} fill={true}/>
        </div>
        <Modal open={open} onClose={handleClose} className={styles.modal}>
            <div className={styles.modal_content}>
              <h3 style={{color: "white"}}>{title}</h3>
              <button onClick={handleClose}>close</button>
            </div>
        </Modal>
    </div>
  )
}
