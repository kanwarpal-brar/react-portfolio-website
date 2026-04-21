// All portfolio data lives here. Edit this file to update content.
// Keep strings as plain text; renderers escape via textContent.

export const identity = {
  name: "Kanwarpal Brar",
  tagline: "Developer, Researcher, Innovator",
  email: "kanwarpal.brar@outlook.com",
  location: "Canada",
};

export const parablurb =
  "Software Engineer specializing in distributed systems and backend architecture. Interested in designing scalable microservices, RESTful APIs, and concurrent systems. Passionate about solving complex networking challenges and building reliable distributed applications.";

export const aboutBlurb =
  "Hi, I'm Kanwarpal, Welcome to my portfolio website. I'm a software engineer with a Computer Science degree from the University of Waterloo, specializing in distributed systems and backend development. My experience spans fintech, cloud infrastructure, and microservices architecture, with expertise in technologies like Python, Java, Go, and cloud platforms including AWS and Azure. I'm passionate about building scalable solutions and continuously expanding my technical expertise.";

export const resumeBlurb =
  "Take a look at my resume, and feel free to contact me with questions and opportunities of any nature.";

export const socials = [
  { label: "github", handle: "kanwarpal-brar", url: "https://github.com/kanwarpal-brar" },
  { label: "linkedin", handle: "kanwarpal-brar", url: "https://linkedin.com/in/kanwarpal-brar" },
  { label: "email", handle: "kanwarpal.brar@outlook.com", url: "mailto:kanwarpal.brar@outlook.com" },
];

export const workExperience = [
  {
    id: "carta-2024-payments",
    title: "Payments Software Engineering Co-op",
    company: "Carta",
    date: "Sept — Dec 2024",
    paragraph:
      "Shipped critical fund impersonation controls within first 2 weeks of joining, preventing $5000+ in potential audit penalties using Django + React. Implemented scalable Microservices on AWS using Docker and Kubernetes, ensuring robust and reliable fintech solutions. Led multi-service banking integration expansion processing $5M+ monthly, implementing international account workflows using Python, gRPC, Protocol Buffers, and Domain Driven Design.",
  },
  {
    id: "uwaterloo-2024",
    title: "Distributed Systems Research Assistant",
    company: "UWaterloo",
    date: "May — Aug 2024",
    paragraph:
      "Conducted comprehensive benchmarking of Serverless frameworks to inform the design of a new high-performance Serverless platform. Deployed & Optimized Kubernetes clusters achieving 200+ requests/second per node with KNative Serving. Reduced cold-start latency 20% through analysis and tuning of autoscaling, node configuration, and container runtime. Authored a comprehensive technical report proposing architectural changes, improving resource utilization 15%.",
  },
  {
    id: "carta-2024-backend",
    title: "Backend Software Engineering Co-op",
    company: "Carta",
    date: "Jan — April 2024",
    paragraph:
      "Improved OCX report generation speed 10% by implementing an O(n) complexity cell management system with Apache POI + Java. Enhanced AI powered search accuracy 6% through prompt engineering of report questions & use-cases. Resolved 3000+ support tickets by streamlining Ownership Report access permissions in Carta Web's Django codebase. Optimized ownership report query complexity in Spring framework, resulting in a 5% decrease in user wait times.",
  },
  {
    id: "arctic-wolf-2023",
    title: "Software Developer",
    company: "Arctic Wolf",
    date: "May — Aug 2023",
    paragraph:
      "Reduced response times 25% by developing a concurrent Prometheus metrics monitoring system in Go for an Apache Kafka Wrapper. Developed a reflection-based Golang unit test verifier, identifying missing/broken metrics tests with 100% accuracy. Reduced lead times by designing a forward/backwards compatible Kafka Serialization system using SchemaVer and Avro.",
  },
  {
    id: "genesys-2022",
    title: "Full Stack Software Developer",
    company: "Genesys",
    date: "Sept — Dec 2022",
    paragraph:
      "Reduced hosting costs 5% by transitioning scheduling API to serverless architecture using Python, Flask, and Lambda. Shrunk codebase size 30% by rewriting schedule statement management REST API in Python + Flask + RESTX.",
  },
  {
    id: "cloudspark-2022",
    title: "Software Engineering Intern",
    company: "Cloudspark",
    date: "Jan — Apr 2022",
    paragraph:
      "Designed & Implemented scalable RESTful and Event-Driven microservices for web apps leveraging Microsoft Azure. Led the development of Licensing, Notification, and Auth microservices for a start-up MVP, utilizing TypeScript, Nest.JS, CosmosDB, Dependency Injection, and Azure Service Bus.",
  },
  {
    id: "pillar-to-post-2021",
    title: "DevOps Specialist",
    company: "Pillar To Post",
    date: "May — Aug 2021",
    paragraph:
      "Designed and Developed an Automated Web Software Testing Framework in Selenium using Python and JavaScript, eliminating manual testing and saving 100+ company hours.",
  },
];

export const extraCurricular = [
  {
    id: "hvz",
    name: "Humans vs. Zombies",
    role: "3x Webmaster",
    desc: "UWaterloo Humans vs. Zombies (UWHVZ) runs week-long campus-wide games of Nerf tag. As 3x Webmaster I help develop the club website in Django, Python, HTML, CSS, and JavaScript.",
  },
  {
    id: "improv",
    name: "Improv Club",
    role: "Member",
    desc: "UWaterloo Improv Club runs weekly improv game sessions and guided tutorials. I joined to learn how to think on the spot and ended up making a lot of friends.",
  },
  {
    id: "tea-club",
    name: "Tea & Culture Club",
    role: "Regular",
    desc: "UWaterloo Tea Club is a laid-back gathering of games, socialization, and tea. Weekly meetings with new flavors. Destroying people in UNO is just a bonus.",
  },
];

export const projects = [
  {
    id: "concurrent-hashmap",
    name: "concurrent-hashmap",
    desc: "Highly concurrent, lock-free, probing hashmap implementation in C++.",
    url: "https://github.com/kanwarpal-brar/concurrent-hashmap",
    tags: ["c++", "concurrency", "lock-free"],
  },
  {
    id: "simple-event-bus",
    name: "simple-event-bus",
    desc: "Lightweight C++ event bus for event-based applications using websockets.",
    url: "https://github.com/kanwarpal-brar/simple-event-bus",
    tags: ["c++", "websocket", "boost-asio", "boost-beast"],
  },
  {
    id: "simple-coroutine",
    name: "simple-coroutine",
    desc: "Basic coroutine library in C++ built on context switching.",
    url: "https://github.com/kanwarpal-brar/simple-coroutine",
    tags: ["c++", "coroutines", "systems"],
  },
  {
    id: "thread-music",
    name: "thread-music",
    desc: "Thread scheduling as conductor — threads play MIDI notes on cue.",
    url: "https://github.com/kanwarpal-brar/thread-music",
    tags: ["c++", "threading", "midi"],
  },
  {
    id: "minecraft-helm",
    name: "minecraft-helm",
    desc: "Helm charts for deploying Minecraft servers on a Kubernetes cluster.",
    url: "https://github.com/kanwarpal-brar/minecraft-helm",
    tags: ["kubernetes", "helm", "devops"],
  },
  {
    id: "friend-point-service",
    name: "friend-point-service",
    desc: "HTTP service to quantify friendships, running on a personal K8s cluster.",
    url: "https://github.com/kanwarpal-brar/friend-point-service",
    tags: ["python", "http", "kubernetes"],
  },
  {
    id: "flex-schedule",
    name: "flex-schedule",
    desc: "Time-blocking flexible scheduling application for adaptive day management.",
    url: "https://github.com/kanwarpal-brar/flex-schedule",
    tags: ["typescript", "scheduling"],
  },
  {
    id: "hive",
    name: "hive",
    desc: "Streamlined ML data collection platform powered by the Dropbase API.",
    url: "https://github.com/kanwarpal-brar/hive",
    tags: ["django", "machine-learning", "dropbase"],
  },
  {
    id: "nyabot",
    name: "NYABot",
    desc: "Discord bot written in Python using discord.py, YTDL, and ffmpeg.",
    url: "https://github.com/kanwarpal-brar/NYABot",
    tags: ["python", "discord", "ffmpeg"],
  },
];

export const clusterCopy = {
  title: "Private Kubernetes Cluster",
  redactedUrl: "[REDACTED]",
  intro:
    "Welcome to the secure access portal for the private Kubernetes cluster. Access to this infrastructure is strictly controlled and requires prior authorization.",
  contactEmail: "kanwarpal.brar@outlook.com",
  requirements: [
    "Your full name and organization",
    "Intended use case and project scope",
    "Required access level and duration",
    "Any relevant technical requirements",
  ],
};

export const resumePath = "assets/Kanwarpal_Brar_Resume.pdf";

/**
 * TREE — content hierarchy for the portfolio.
 * `kind` controls layout: 'recruiter' = home view, 'list' = orbiting children, 'leaf' = no children.
 * `children` lists the IDs of child nodes (used for routing and orbit layout).
 */
export const TREE = {
  home:     { kind: 'recruiter', children: ['work', 'projects', 'resume', 'socials', 'cluster'] },
  work:     { kind: 'list',      children: [...workExperience.map(w => w.id), ...extraCurricular.map(e => e.id)] },
  projects: { kind: 'list',      children: projects.map(p => p.id) },
  resume:   { kind: 'leaf',      children: [] },
  socials:  { kind: 'leaf',      children: [] },
  cluster:  { kind: 'leaf',      children: [] },
};
