import { useEffect, useState } from "react";

export type ScrambledTextIntroProps = {
    data: string;
    delayms: number;
}

const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export default function ScrambledTextIntro({ data, delayms }: ScrambledTextIntroProps) {
  const [text, setText] = useState(data);
  
  

  useEffect(() => {

    function generateText(offset: number) {
      let text = data.substring(0, offset)
      for (let i = offset; i < data.length; ++i) {
        text += characters[Math.floor(Math.random() * (characters.length - 1))]
      }
      setText(text)
    }
    
    let offset = 0

    const interval = setInterval(() => {
      setTimeout(() => {offset++}, 2*delayms)
      generateText(offset)
    }, delayms)

  }, [data, delayms])

  return (
    <>
      {text}
    </>
  )
}
