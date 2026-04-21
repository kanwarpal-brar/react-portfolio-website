import { ExpBoxProps } from "@/components/ExpBox/expbox";
import { ExtraCurricularBoxProps } from "@/components/ExtraCurricularBox/extracurricularbox";

export const aboutBlurb =
  "Hi, I'm Kanwarpal — a Production Engineer at Meta and a 2025 Computer Science graduate from the University of Waterloo. I work on infrastructure-as-code, storage systems, and distributed platforms that support AI training at scale. My background spans fintech, cloud infrastructure, microservices, and concurrency, with hands-on experience in Python, Go, Java, C++, Kubernetes, and AWS/Azure.";

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
    title: "Production Engineer",
    company: "Meta",
    date: "Sept 2025 - Present",
    bullets: [
      "Accelerated Meta Blob Storage turnup 95% via typed schema automation, unblocking rapid capacity delivery for AI training fleets",
      "Saved 100+ engineering hours by shipping key-value state layer atop Infrastructure-as-Code definitions, onboarding legacy systems",
      "Restored cluster capacity in 24 hours by diagnosing cross-stack garbage collection SEV, unblocking environments for 6 downstream services",
      "Safeguarded 95% SLO across 7 MBS services as primary oncall, protecting AI training pipelines for Meta Superintelligence Labs",
    ],
  },
  {
    title: "Payments Software Engineering Co-op",
    company: "Carta",
    date: "Sept 2024 - Dec 2024",
    bullets: [
      "Averted $5000+ in regulatory penalties within first 2 weeks by implementing financial compliance controls with Django + React",
      "Managed $5M+ monthly leading international banking integration expansion, leveraging Python, gRPC, and Domain Driven Design",
      "Architected fault-tolerant microservices on AWS with Docker and Kubernetes, achieving 99.99% uptime for robust fintech operations",
      "Slashed network overhead 50% by implementing centralized money movement controls with RBAC in a Java Microservice",
      "Accelerated feature development 40% through flexible Django permission system using YAML-templated definitions",
    ],
  },
  {
    title: "Distributed Systems Research Assistant",
    company: "University of Waterloo",
    date: "May 2024 - Aug 2024",
    bullets: [
      "Benchmarked serverless frameworks with WRK and custom Bash scripts, informing design decisions for high-performance system architecture",
      "Delivered 200+ requests/second per node by deploying & optimizing Kubernetes clusters with KNative Serving and Istio ingress controls",
      "Cut cold-start latency 20% through targeted autoscaling and TCP/IP network optimization, increasing platform responsiveness",
      "Designed architectural changes improving resource utilization 15%, validated with monitoring scripts in a comprehensive technical report",
    ],
  },
  {
    title: "Backend Software Engineering Co-op",
    company: "Carta",
    date: "Jan 2024 - Apr 2024",
    bullets: [
      "Accelerated OCX report generation speed 10% using an O(n) complexity cell management system with Apache POI + Java, streamlining results",
      "Improved semantic search relevance by 6% via refined prompt engineering for report queries & real-world use-cases",
      "Eliminated 3000+ tickets by streamlining Ownership Report permissions in Django, collaborating cross-functionally with product leaders",
      "Slashed user wait times by 10% through optimizing ownership report queries in Spring, enhancing system responsiveness",
    ],
  },
  {
    title: "Software Developer Co-op",
    company: "Arctic Wolf Networks",
    date: "May 2023 - Aug 2023",
    bullets: [
      "Slashed response times by 25% by implementing a concurrent Go monitoring system for Prometheus metrics on an Apache Kafka wrapper",
      "Attained 100% accuracy in identifying test gaps with a reflection-based Golang unit test verifier for an Apache Kafka wrapper",
      "Expedited development by creating a forward/backward compatible Kafka Serialization system using SchemaVer and Avro",
    ],
  },
  {
    title: "Full Stack Software Developer Co-op",
    company: "Genesys Cloud Services",
    date: "Sept 2022 - Dec 2022",
    bullets: [
      "Slashed hosting costs by 5% by migrating a monolithic scheduling API to an end-to-end serverless architecture with Python + Flask + Lambda",
      "Compressed codebase size by 30% and enhanced maintainability through a documented Python + Flask + OpenAPI service for scheduling",
    ],
  },
];
