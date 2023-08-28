import styles from "./expbox.module.scss";

export type ExpBoxProps = {
  title: string;
  company: string;
  date: string;
  bullets: string[];
};

export default function ExpBox({ title, company, date, bullets }: ExpBoxProps) {
  return (
    <div className={styles.expbox_container}>
      <span className={styles.inline_title}>
        <h2>{`${title} | ${company}`}</h2>
        <h3>{date}</h3>
      </span>
      <hr />
      <ul>
        {bullets.map((point, i) => {
          return <li key={i}>{point}</li>;
        })}
      </ul>
    </div>
  );
}
