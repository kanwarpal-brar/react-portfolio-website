import { Modal } from "@mui/material";
import styles from "./expandingprojectwidget.module.scss"
import Image from "next/image"
import { useState } from "react";
import projectConfig from "../../public/targetProjects.json";
import ReactMarkdown from 'react-markdown'
import remarkGfm from "remark-gfm";
import Link from "next/link";

export type ExpandingProjectWidgetProps = {
    title: string;
    desc: string;
    link: string;
    style?: {[key: string]: string};
    tags?: string[]
    useModal?: boolean;
}

export default function ExpandingProjectWidget({ title, desc, link, style, tags, useModal }: ExpandingProjectWidgetProps) {
	const [open, setOpen] = useState(false)
  let debounce = false
  const displayTags = tags ? tags : []
  const [modelDesc, setModelDesc] = useState("")
  const imgUrl = `${projectConfig.repoImageUrl}/${title.toLowerCase()}.png`
  const expanding = useModal ? useModal : false

  function extractDesc(rawText: string): string {
    const results = rawText.match(/<!--start-->(.*?)<!--end-->/s)
    return results ? results[0] : ""
  }

  async function fetchReadme() {
    const url = projectConfig.fileUrl + `${title}/main/README.md`
    setModelDesc(extractDesc(await (await fetch(url)).text()))
  }

  async function handleOpenByContainer() {
    if (!debounce) {
      setOpen(true)
      await fetchReadme()
    }
  }

	function handleClose() {
		debounce = true
		setOpen(false)
    setTimeout(() => {debounce = false}, 50)
	}

  function body() {
    return (
      <div className={styles.container} onClick={expanding ? handleOpenByContainer : undefined}>
          <h3>{title}</h3>
          <div className={styles.desc_box}>
            <p>{desc}</p>
          </div>
          <div className={styles.tag_block}>
              {displayTags.map((tag, i) => {
                return <div key={i} className={styles.tag}>{tag}</div>
              })}
            </div>
  
          <Modal open={open} onClose={handleClose} className={styles.modal}>
            <div className={styles.modal_container}>
              <div className={styles.modal_content}>
                <div className={styles.markdown_box}>
                  <div className={styles.img_box}>
                    <Image src={modelDesc ? imgUrl : "/SMPTE_Color_Bars.svg"} alt={`Image for ${title} project`} width={250} height={250}/>
                  </div>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {modelDesc ? modelDesc : `# ${title}\n${desc}`}
                  </ReactMarkdown>
                </div>
              </div>
              <div className={styles.button_box}>
                <button onClick={handleClose}>Close</button>
                <Link href={link} target="_blank"><button>Github</button></Link>
              </div>
            </div>
          </Modal>
      </div>
    )
  }

  return (expanding ? body() : <Link href={link} target="_blank">{ body() }</Link>)
}
