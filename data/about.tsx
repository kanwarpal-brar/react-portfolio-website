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
    title: "Payments Software Engineering Co-op",
    company: "Carta",
    date: "Sept — Dec 2024",
    paragraph:
      "Prevented $5000+ in potential audit fines by designing and shipping a critical permissions feature using Python, Django and React within first 2 weeks. Implemented scalable Microservices on AWS using Docker and Kubernetes, ensuring robust and reliable fintech solutions. Collaborated with banking partners on payment integrations processing $5M+ monthly, leveraging Domain Driven Design, gRPC and Protocol Buffers.",
  },
  {
    title: "Distributed Systems Research Assistant",
    company: "UWaterloo",
    date: "May - Aug 2024",
    paragraph:
      "Conducted comprehensive benchmarking of Serverless frameworks to inform the design of a new high-performance Serverless platform. Deployed & Optimized Kubernetes clusters achieving 200+ requests/second per node with KNative Serving. Reduced cold-start latency 20% through analysis and tuning of autoscaling, node configuration, and container runtime. Authored a comprehensive technical report proposing architectural changes, improving resource utilization 15%.",
  },
  {
    title: "Backend Software Engineering Co-op",
    company: "Carta",
    date: "Jan - April 2024",
    paragraph:
      "Improved OCX report generation speed 10% by implementing an O(n) complexity cell management system with Apache POI + Java. Enhanced AI powered search accuracy 6% through prompt engineering of report questions & use-cases. Resolved 3000+ support tickets by streamlining Ownership Report access permissions in Carta Web's Django codebase. Optimized ownership report query complexity in Spring framework, resulting in a 5% decrease in user wait times.",
  },
  {
    title: "Software Developer",
    company: "Arctic Wolf",
    date: "May - Aug 2023",
    paragraph:
      "Reduced response times 25% by developing a concurrent Prometheus metrics monitoring system in Go for an Apache Kafka Wrapper. Developed a reflection-based Golang unit test verifier, identifying missing/broken metrics tests with 100% accuracy. Reduced lead times by designing a forward/backwards compatible Kafka Serialization system using SchemaVer and Avro.",
  },
  {
    title: "Full Stack Software Developer",
    company: "Genesys",
    date: "Sept - Dec 2022",
    paragraph:
      "Reduced hosting costs 5% by transitioning scheduling API to serverless architecture using Python, Flask, and Lambda. Shrunk codebase size 30% by rewriting schedule statement management REST API in Python + Flask + RESTX.",
  },
  {
    title: "Software Engineering Intern",
    company: "Cloudspark",
    date: "Jan - Apr 2022",
    paragraph:
      "Designed & Implemented scalable RESTful and Event-Driven microservices for web apps leveraging Microsoft Azure. Led the development of Licensing, Notification, and Auth microservices for a start-up MVP, utilizing TypeScript, Nest.JS, CosmosDB, Dependency Injection, and Azure Service Bus.",
  },
  {
    title: "DevOps Specialist",
    company: "Pillar To Post",
    date: "May - Aug 2021",
    paragraph:
      "Designed and Developed an Automated Web Software Testing Framework in Selenium using Python and JavaScript, eliminating manual testing and saving 100+ company hours.",
  },
];
