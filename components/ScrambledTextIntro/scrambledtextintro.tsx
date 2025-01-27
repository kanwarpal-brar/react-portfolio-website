import { useEffect, useState } from "react";

export type ScrambledTextIntroProps = {
  data: string;
  delayms: number;
};

const characters =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export default function ScrambledTextIntro({
  data,
  delayms,
}: ScrambledTextIntroProps) {
  const [text, setText] = useState(data);

  useEffect(() => {
    let offset = 0;
    let iterations = 0;
    const iterationsPerChar = 3; // Number of scrambles before settling on correct character

    function generateText(offset: number, isSettling: boolean) {
      let text = data.substring(0, offset);
      for (let i = offset; i < data.length; ++i) {
        text += isSettling && i === offset 
          ? data[i]
          : characters[Math.floor(Math.random() * (characters.length - 1))];
      }
      setText(text);
    }

    const interval = setInterval(() => {
      const isSettling = iterations === iterationsPerChar - 1;
      generateText(offset, isSettling);
      
      iterations++;
      if (iterations >= iterationsPerChar) {
        iterations = 0;
        offset++;
        if (offset >= data.length) {
          clearInterval(interval);
        }
      }
    }, delayms / iterationsPerChar);

    return () => clearInterval(interval);
  }, [data, delayms]);

  return <>{text}</>;
}
