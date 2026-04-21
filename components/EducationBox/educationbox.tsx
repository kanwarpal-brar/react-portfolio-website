import styles from "./educationbox.module.scss";

export type ResearchSubsection = {
  title: string;
  institution?: string;
  date: string;
  summary: string;
  bullets?: string[];
};

export type EducationBoxProps = {
  school: string;
  degree: string;
  gpa?: string;
  date: string;
  courses?: string[];
  research?: ResearchSubsection;
};

export default function EducationBox({
  school,
  degree,
  gpa,
  date,
  courses,
  research,
}: EducationBoxProps) {
  return (
    <div className={styles.educationbox_container}>
      <div className={styles.inline_title}>
        <h2>{school}</h2>
        <h3>{`${degree}${gpa ? ` | CGPA ${gpa}` : ""}`}</h3>
        <span className={styles.date}>{date}</span>
      </div>
      <hr />
      {courses && courses.length > 0 && (
        <p className={styles.courses}>Courses: {courses.join(", ")}</p>
      )}
      {research && (
        <div className={styles.research_block}>
          <h3 className={styles.research_heading}>Undergraduate Research</h3>
          <div className={styles.research_meta}>
            {`${research.title}${research.institution ? ` — ${research.institution}` : ""} — ${research.date}`}
          </div>
          <p>{research.summary}</p>
          {research.bullets && research.bullets.length > 0 && (
            <ul>
              {research.bullets.map((bullet, i) => (
                <li key={i}>{bullet}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
