import { Modal } from "@mui/material";
import styles from "./expandingprojectwidget.module.scss"
import Image from "next/image"
import { useState } from "react";

export type ExpandingProjectWidgetProps = {
    title: string;
    img: string;
    desc: string;
    link: string;
}

export default function ExpandingProjectWidget({ title, img, desc, link }: ExpandingProjectWidgetProps) {
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
    <div className={styles.container} onClick={handleOpenByContainer}>
        <h3>{title}</h3>
        <Image src={img} alt={`Image for ${title} project`} height={75} width={85}/>
        <button onClick={handleOpen}>Open Modal</button>
        <Modal open={open} onClose={handleClose} className={styles.modal}>
            <div className={styles.modal_content}>
              <h3 style={{color: "white"}}>{title}</h3>
              <button onClick={handleClose}>close</button>
            </div>
        </Modal>
    </div>
  )
}
