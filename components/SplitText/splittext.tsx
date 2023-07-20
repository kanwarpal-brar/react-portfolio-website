
export type SplitTextProps = {
    children: string;
    childStyle?: string;
    letterWrapper?: React.ComponentType<any> | string;
}

/*
SplitText will take whatever text is passed as a child and split it into inline span elements for each letter
*/
export default function SplitText(props: SplitTextProps) {
    const letterSpans: Array<React.ReactNode> = [];
    const Wrapper = props.letterWrapper;

    for (let i = 0; i <props.children.length; ++i) {
        letterSpans.push(
            <span className={props.childStyle} key={i}>
                {props.children.charAt(i)}
            </span>);
    }

 return (
    <>
        {Wrapper ? <Wrapper>{letterSpans}</Wrapper> : {letterSpans}}
    </>
 )
}