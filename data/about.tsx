import { ExpBoxProps } from "@/components/ExpBox/expbox";
import { ExtraCurricularBoxProps } from "@/components/ExtraCurricularBox/extracurricularbox";

export const aboutBlurb =
  "Hi, I'm Kanwarpal, Welcome to my portfolio website. I'm a lifetime learner and aspiring software developer in my 4th year of an undergraduate Computer Science degree from the University of Waterloo. I have had the opportunity to intern at numerous software companies and interact with many industry-standard technologies, but I'm always looking for more to learn.";

export const resumeBlurb =
  "Take a look at my resume, and feel free to contact me with questions and opportunities of any nature.";

export const extraCurriculer: ExtraCurricularBoxProps[] = [
  {
    name: "Humans vs. Zombies",
    img: "uwhvz.svg",
    desc: [
      "UWaterloo Humans vs. Zombies (UWHVZ) is a club that runs week-long campus-wide games of Nerf tag between two teams: the Humans and the Zombies. It is my favorite club, combining good exercise with teamwork and strategy.",
      "As 3x Webmaster of UWHVZ, I have a hand in the development of the club website using Django, Python, HTML, CSS, and Javascript",
    ],
  },
  {
    name: "Improv Club",
    img: "improvclub.png",
    desc: [
      "UWaterloo Improv Club is, as the name implies, a club where you do improv. The club runs weekly improv game sessions, as well as guided improv tutorials. Improv Club is full of friendly and welcoming people, so it's super easy to get into.",
      "I joined improv club wanting to learn how to think on the spot better, but ended up having an amazing time and making tonnes of friends.",
    ],
  },
  {
    name: "Tea & Culture Club",
    img: "teaclub.png",
    desc: [
      "UWaterloo Tea Club is a laid-back gathering of games, socialization, and, of course, tea. They run weekly meetings in the evenings with new tea flavors every week.",
      'I love tea, and I love socializing, so Tea Club is a "must attend" for me. Destroying people in UNO is just a bonus.',
    ],
  },
];

export const workExperience: ExpBoxProps[] = [
  {
    title: "Backend Software Engineering Co-op",
    company: "Carta",
    date: "Jan - April 2024",
    paragraph:
      "Spearheaded several pivotal projects to enhance reporting functionalities within the Carta Web application on Carta's Capitalization and Reporting team. Notable achievements include optimizing the OCX report by integrating voting power information and refining cell relationships for faster Excel formula generation. Additionally, I contributed to the development of an AI-powered search bar, elevating search accuracy through prompt engineering. Collaborated closely with business leaders to revamp report visibility, empowering Portfolio Holders to access critical information seamlessly. I thrived in navigating complex systems, demonstrating adeptness in problem-solving and agile adaptation to evolving project scopes.",
  },
  {
    title: "Software Developer",
    company: "Arctic Wolf Networks",
    date: "May - Aug 2023",
    paragraph:
      "Worked as a Software Developer Co-op across two vital teams: the Constructicons and the Transporters. Honed skills in Python and Go, crafting core client-facing services and integrating with OpenAPI 3.0 standard RestAPI's. Spearheaded the completion of a crucial internal Apache Kafka service in Go and initiated work on a Python Kafka wrapper. Notably, revamped the metrics monitoring system for the Go Kafka Wrapper, leveraging concurrency techniques to enhance response times. Additionally, designed a forward and backward-compatible Serialization System for Apache Avro schemas, reducing lead times.",
  },
  {
    title: "Full Stack Software Developer",
    company: "Genesys Laboratories",
    date: "Sept - Dec 2022",
    paragraph:
      "Worked on the Agent Development team, focusing on client-facing software for agent training and scheduling. Spearheaded the transition of the scheduling API to a serverless architecture using Python, Flask, and AWS Lambda, optimizing scalability and efficiency. Revamped the schedule state management REST API with Python, Flask, and RESTX, significantly reducing the codebase size. Implemented standardized unit and integration tests in Python, ensuring robustness and accelerating future development cycles.",
  },
  {
    title: "Software Engineering Intern",
    company: "Cloudspark Labs",
    date: "Jan - Apr 2022",
    paragraph:
      "Engineered and implemented scalable microservices for an innovative suite of HR web applications. Led the development of essential licensing, notification, and authentication microservices for a startup MVP, seamlessly integrating with Microsoft Teams. Proficiently utilized TypeScript, Nest.js, CosmosDB, and Azure Service Bus to deliver robust backend solutions. Specialized in Event-Driven Architecture, adeptly leveraging Azure Service Bus and event sourcing patterns for optimal performance. Demonstrated expertise in dependency injection to optimize resource consumption.",
  },
  {
    title: "DevOps Specialist",
    company: "Pillar To Post",
    date: "May - Aug 2021",
    paragraph:
      "Designed and Developed an Automated Web Software Testing Framework in Selenium using Python and JavaScript, eliminating manual testing and saving 100+ company hours.",
  },
];
