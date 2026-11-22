/**
 * Abhijith Saji — Interactive 3D Resume & Developer Portfolio Data
 * Single source of truth for both the 3D Interactive Showcase and Print/ATS PDF Resume.
 */
window.DEFAULT_RESUME_DATA = {
  profile: {
    name: "Abhijith Saji",
    initials: "AS",
    photo: "profile-photo.jpg",
    role: "Full-Stack Web & Native Android Application Developer",
    tagline:
      "Architecting responsive Next.js & TypeScript web platforms, declarative Kotlin & Jetpack Compose Android apps, and real-time Supabase/PostgreSQL systems — from concept and UI/UX prototyping to production cloud launch.",
    availability: "Open to Full-Time, Internship, Remote, Hybrid & On-Site · Open to Relocation",
    location: "Ponkunnam, Kottayam, Kerala, India",
    experienceYears: "Full-Stack Web · Native Android · UI/UX",
    email: "sajiabhijith28@gmail.com",
    phone: "+91 8714858806",
    website: "www.abhijithsaji.in",
    websiteUrl: "https://www.abhijithsaji.in",
    languages: "Malayalam (Native) · English (Professional) · Hindi · Tamil",
    summary:
      "Results-oriented Full-Stack Web and Android Developer with hands-on experience architecting, developing, and deploying responsive web platforms and native mobile applications. Adept at engineering scalable frontend user interfaces using React.js, Next.js, TypeScript, and Tailwind CSS, alongside building high-performance Android applications with Kotlin and Jetpack Compose. Strong foundation in backend integration using Supabase and PostgreSQL, paired with core computer science fundamentals in C and C++. Proven ability to lead end-to-end product development from initial concept and UI/UX prototyping to production cloud deployment, demonstrated through founding and launching My Dr, a regional healthcare appointment booking platform.",
    links: [
      { label: "Portfolio", url: "https://www.abhijithsaji.in", handle: "www.abhijithsaji.in" },
      { label: "Website", url: "https://www.abhijith.in", handle: "www.abhijith.in" },
      { label: "LinkedIn", url: "https://www.linkedin.com/in/sajiabhijith28-collab", handle: "in/sajiabhijith28-collab" },
      { label: "GitHub", url: "https://github.com/sajiabhijith28-collab", handle: "github.com/sajiabhijith28-collab" }
    ]
  },

  metrics: [
    {
      prefix: "",
      value: 4,
      suffix: "+",
      label: "Core Systems Built",
      sublabel: "Healthcare SaaS, Native Android, AI EdTech & C/C++ Suite"
    },
    {
      prefix: "",
      value: 1,
      suffix: " Live",
      label: "Production Launch",
      sublabel: "My Dr regional healthcare platform live on Vercel"
    },
    {
      prefix: "",
      value: 5,
      suffix: "",
      label: "Tech Domains",
      sublabel: "Web · Android · Supabase/SQL · C/C++ · UI/UX"
    },
    {
      prefix: "",
      value: 4,
      suffix: "",
      label: "Languages Spoken",
      sublabel: "Malayalam, English, Hindi & Tamil"
    }
  ],

  experience: [
    {
      id: "exp-mydr",
      role: "Founder & Lead Full-Stack Developer",
      company: "My Dr — Hospital & Specialist Appointment Platform",
      companyType: "Production Launch · Regional Healthcare Platform",
      period: "Production Launch",
      location: "Kerala, India · Next.js + Supabase + Vercel",
      impactMetrics: ["Live Vercel CI/CD", "Supabase + PostgreSQL", "Mobile-First UI/UX"],
      summary:
        "Conceived, architected, and launched a full-stack healthcare platform helping patients across Kerala search, filter, and book appointments with local hospitals and medical specialists.",
      highlights: [
        "Engineered a highly responsive, mobile-first frontend interface using Next.js, React.js, TypeScript, and Tailwind CSS for intuitive user flows and cross-device accessibility.",
        "Designed and integrated a relational backend powered by Supabase and PostgreSQL to manage real-time appointment scheduling, dynamic specialist directories, hospital profiles, and patient records.",
        "Configured automated Git-to-Vercel build pipelines to achieve fast page-load speeds, reliable uptime, and strong search engine visibility.",
        "Architected dynamic filtering and search indexing across medical departments, district locations, and consulting schedules so patients locate specialists quickly.",
        "Implemented client-side and server-side validation alongside structured error handling and modular TypeScript components to protect data integrity and long-term scalability.",
        "Conducted iterative usability testing to refine the end-to-end patient booking workflow and reduce friction across regional healthcare centers."
      ],
      tools: ["Next.js", "React.js", "TypeScript", "Tailwind CSS", "Supabase", "PostgreSQL", "Vercel CI/CD"]
    },
    {
      id: "exp-contro",
      role: "Android Application Developer",
      company: "Contro — Native Mobile Application",
      companyType: "Native Android · Kotlin & Jetpack Compose",
      period: "Kotlin & Compose",
      location: "Android Studio · Material Design",
      impactMetrics: ["100% Declarative Compose", "Custom Dark-Mode System", "Unidirectional State"],
      summary:
        "Designed and engineered a native Android application from the ground up using Android Studio, Kotlin, and Jetpack Compose with a focus on modularity, performance, and low-light visual accessibility.",
      highlights: [
        "Built a modern, fully declarative UI using Jetpack Compose, eliminating legacy XML overhead and accelerating UI component iteration.",
        "Created a custom dark-themed design system with standardized typography, color tokens, and contrast ratios to improve visual hierarchy and accessibility.",
        "Implemented structured screen navigation and reactive state management for smooth transitions and consistent performance across diverse Android screen sizes.",
        "Engineered reusable composable elements and unidirectional data flow patterns to minimize unnecessary recompositions and optimize battery and memory efficiency.",
        "Enforced strict separation of concerns between UI presentation layers and business state handlers to simplify unit testing and future expansion."
      ],
      tools: ["Android Studio", "Kotlin", "Jetpack Compose", "Material Design UI", "Reactive State", "Dark-Mode Tokens"]
    },
    {
      id: "exp-classroom",
      role: "Software Developer",
      company: "AI-Assisted Classroom Management System",
      companyType: "EdTech Platform Architecture · Concept & Prototype",
      period: "Architecture & Prototype",
      location: "Multi-Portal Web · RBAC · AI Workflows",
      impactMetrics: ["3-Role RBAC Portals", "AI Lesson Planning", "End-to-End IA Specs"],
      summary:
        "Architected and prototyped a comprehensive multi-portal educational management platform with dedicated workflows for students, teachers, and school principals.",
      highlights: [
        "Designed AI-assisted lesson preparation workflows helping educators generate structured instructional materials, track syllabus progress, and cut routine administrative workload.",
        "Defined strict Role-Based Access Controls (RBAC) and portal permissions to safeguard academic records while enabling transparent communication across school stakeholders.",
        "Mapped end-to-end user journeys and information architecture for attendance tracking, assignment distribution, and principal-level analytics reporting.",
        "Created interactive wireframes and component specifications aligning multi-role interfaces with institutional compliance and data privacy workflows."
      ],
      tools: ["Multi-Portal Web", "RBAC Architecture", "AI Workflows", "UI/UX Wireframing", "Information Architecture"]
    },
    {
      id: "exp-cpp",
      role: "Core CS & Algorithmic Developer",
      company: "Algorithmic & Logic Programming Portfolio",
      companyType: "Core Computer Science · C & C++ Foundations",
      period: "Core CS Foundations",
      location: "Brocamp / Independent Engineering",
      impactMetrics: ["Memory-Conscious Logic", "OOP & Data Structures", "Trace-Table Verified"],
      summary:
        "Developed a comprehensive suite of algorithmic, data-structure, and object-oriented programs in C and C++ verified through manual dry-runs, trace tables, and edge-case testing.",
      highlights: [
        "Built algorithmic programs in C and C++ covering nested loop control structures, complex number/star pattern generation, and mathematical logic.",
        "Implemented multi-dimensional array operations including sorting, searching, frequency counting, array merging, and in-place insertion and deletion.",
        "Practiced dry-running, trace table verification, and edge-case testing to build deep low-level debugging mastery without relying on high-level abstractions.",
        "Applied object-oriented programming in C++ including encapsulation, class constructors, member functions, and modular header organization."
      ],
      tools: ["C", "C++", "OOP", "Data Structures", "GCC Compiler", "CLI Debugging", "Git"]
    }
  ],

  caseStudies: [
    {
      id: "cs-mydr",
      title: "My Dr — Kerala Healthcare Booking Platform",
      client: "Founded & Shipped",
      year: "Production",
      category: "Full-Stack Web",
      role: "Founder & Lead Full-Stack Dev",
      duration: "Concept → Production Launch",
      heroMetric: "Full-Stack",
      heroMetricLabel: "Next.js + Supabase",
      summary:
        "Full-stack Next.js, TypeScript, and Supabase healthcare platform enabling patients across Kerala to discover hospitals, filter specialists by district & department, and book real-time appointments.",
      mockupType: "mydr-healthcare",
      tags: ["Next.js", "TypeScript", "Tailwind CSS", "Supabase", "PostgreSQL", "Vercel"],
      problem:
        "Patients across regional districts in Kerala faced fragmented hospital schedules, phone-only booking friction, and difficulty locating available medical specialists by department and location.",
      research:
        "Mapped end-to-end patient discovery and appointment booking journeys, running iterative usability tests across real mobile and desktop viewports to eliminate form drop-offs and filter confusion.",
      solution:
        "Engineered a mobile-first Next.js + TypeScript frontend with dynamic multi-criteria search indexing (department, district, schedule) backed by relational PostgreSQL tables, Supabase real-time synchronization, client/server validation, and automated Vercel CI/CD.",
      outcomes: [
        { value: "Live", label: "Deployed on Vercel Edge" },
        { value: "Real-Time", label: "Supabase + PostgreSQL sync" },
        { value: "Strict TS", label: "Modular reusable components" },
        { value: "Mobile 1st", label: "Usability-tested booking UX" }
      ],
      deliverables: [
        "Next.js SSR/CSR Web Application",
        "PostgreSQL Relational Schema & Validation",
        "Dynamic Specialist & District Search Engine",
        "Automated Git-to-Vercel CI/CD Pipeline"
      ]
    },
    {
      id: "cs-contro",
      title: "Contro — Native Android Application",
      client: "Native Mobile Build",
      year: "Kotlin",
      category: "Native Android",
      role: "Android Application Developer",
      duration: "End-to-End Mobile Architecture",
      heroMetric: "100%",
      heroMetricLabel: "Jetpack Compose",
      summary:
        "Modern native Android app built from scratch in Kotlin and Jetpack Compose featuring a bespoke dark-mode design system, reactive state management, and battery-conscious unidirectional data flow.",
      mockupType: "contro-android",
      tags: ["Kotlin", "Jetpack Compose", "Android Studio", "Material Design", "Dark UI System"],
      problem:
        "Traditional XML Android layouts slow down UI iteration, invite tight coupling between views and business logic, and often neglect low-light visual hierarchy and recomposition efficiency.",
      research:
        "Structured screen flows around Material Design accessibility contrast ratios, responsive layout scaling across Android viewport sizes, and unidirectional state-hoisting best practices.",
      solution:
        "Built a fully declarative Jetpack Compose UI layer paired with standardized typography and dark-mode color tokens, clean screen navigation, reusable composables, and strict separation between presentation and business state handlers.",
      outcomes: [
        { value: "0 XML", label: "Pure declarative Compose UI" },
        { value: "Dark UI", label: "Custom tokenized design system" },
        { value: "UDF", label: "Minimal recomposition overhead" },
        { value: "Testable", label: "Decoupled state & UI layers" }
      ],
      deliverables: [
        "Kotlin + Jetpack Compose Codebase",
        "Custom Dark-Mode Design Token System",
        "Reactive Navigation & State Architecture",
        "Reusable Composable UI Component Kit"
      ]
    },
    {
      id: "cs-classroom",
      title: "AI-Assisted Classroom Management System",
      client: "EdTech Platform",
      year: "Prototype",
      category: "AI & EdTech",
      role: "Software Developer & UX Architect",
      duration: "System & Prototype Design",
      heroMetric: "3 Portals",
      heroMetricLabel: "RBAC + AI Workflows",
      summary:
        "Multi-portal educational management architecture combining AI-assisted lesson planning for educators with strict Role-Based Access Control across Student, Teacher, and Principal dashboards.",
      mockupType: "ai-classroom",
      tags: ["Multi-Portal Web", "RBAC Security", "AI Lesson Planning", "UX Prototyping"],
      problem:
        "Schools juggle disconnected tools for lesson prep, attendance, assignments, and leadership oversight — exposing academic records to permission leaks and burdening teachers with manual admin work.",
      research:
        "Mapped stakeholder journeys across students, teachers, and school principals to unify syllabus tracking, attendance reporting, and institutional data-privacy boundaries in one coherent IA.",
      solution:
        "Architected role-isolated RBAC portals featuring tailored dashboards, AI-assisted instructional material generation and syllabus progress tracking for teachers, assignment workflows for students, and analytics views for principals.",
      outcomes: [
        { value: "3 Roles", label: "Student, Teacher & Principal" },
        { value: "RBAC", label: "Strict record-level permissions" },
        { value: "AI Prep", label: "Automated lesson structuring" },
        { value: "UI Specs", label: "Interactive compliance wireframes" }
      ],
      deliverables: [
        "Multi-Portal System Architecture",
        "RBAC Permission & Privacy Matrix",
        "AI-Assisted Lesson Workflow Spec",
        "Interactive Multi-Role Wireframes"
      ]
    },
    {
      id: "cs-cpp",
      title: "C & C++ Algorithmic & Logic Suite",
      client: "Core Computer Science",
      year: "C / C++",
      category: "C / C++ Core",
      role: "Systems & Logic Engineer",
      duration: "Brocamp & CS Foundations",
      heroMetric: "C / C++",
      heroMetricLabel: "Trace-Table Verified",
      summary:
        "Rigorous collection of memory-conscious C and C++ programs mastering multi-dimensional arrays, in-place algorithms, OOP architecture, and disciplined trace-table debugging with GCC.",
      mockupType: "cpp-algorithms",
      tags: ["C", "C++", "OOP", "Data Structures", "GCC Compiler", "Git"],
      problem:
        "Modern high-level frameworks often obscure memory management, time complexity, and edge-case state transitions — weakening root-cause debugging skills when complex bugs emerge.",
      research:
        "Applied structured dry-run analysis, trace tables, and boundary-condition testing across nested loops, array mutations, and class lifecycles to verify correctness mathematically.",
      solution:
        "Engineered modular C and C++ implementations covering sorting, searching, frequency analysis, array merging, in-place insertion/deletion, complex pattern generation, and encapsulated OOP headers compiled and debugged via GCC.",
      outcomes: [
        { value: "In-Place", label: "Memory-conscious array ops" },
        { value: "OOP", label: "Encapsulated modular C++ classes" },
        { value: "100%", label: "Dry-run & edge-case verified" },
        { value: "GCC CLI", label: "Command-line build & debug" }
      ],
      deliverables: [
        "Multi-Dimensional Array Algorithm Suite",
        "Pattern & Mathematical Logic Modules",
        "Modular C++ OOP Header Library",
        "Trace-Table & Edge-Case Verification Logs"
      ]
    }
  ],

  skillGroups: [
    {
      category: "Frontend & Web Development",
      icon: "layers",
      items: [
        { name: "React.js, Next.js & TypeScript", level: 94, tag: "SSR / CSR" },
        { name: "JavaScript (ES6+), HTML5 & CSS3", level: 95, tag: "Core Web" },
        { name: "Tailwind CSS & Responsive Systems", level: 93, tag: "Mobile-First" },
        { name: "Component Architecture & Semantic DOM", level: 91, tag: "Scalable UI" }
      ]
    },
    {
      category: "Mobile App Development",
      icon: "mobile",
      items: [
        { name: "Kotlin & Android Studio", level: 90, tag: "Native" },
        { name: "Jetpack Compose Declarative UI", level: 92, tag: "Modern UI" },
        { name: "Material Design & Custom Dark Systems", level: 91, tag: "Design Craft" },
        { name: "Mobile State & Screen Navigation", level: 88, tag: "UDF" }
      ]
    },
    {
      category: "Backend & Database",
      icon: "database",
      items: [
        { name: "Supabase & PostgreSQL Schemas", level: 90, tag: "Relational" },
        { name: "Real-Time Sync & RESTful APIs", level: 88, tag: "Live Data" },
        { name: "Row-Level Security (RLS) & RBAC", level: 87, tag: "Security" },
        { name: "Auth, Session Security & Cloud Storage", level: 86, tag: "Production" }
      ]
    },
    {
      category: "Programming Fundamentals",
      icon: "code",
      items: [
        { name: "C & C++ Core Programming", level: 91, tag: "Systems" },
        { name: "Object-Oriented Programming (OOP)", level: 90, tag: "Architecture" },
        { name: "Data Structures & Array Manipulation", level: 89, tag: "Algorithms" },
        { name: "Trace Tables, Logic & Memory Optimization", level: 92, tag: "Debugging" }
      ]
    },
    {
      category: "Tools, DevOps & UI/UX Design",
      icon: "compass",
      spanFull: true,
      items: [
        { name: "Git, GitHub & Branching Workflows / Peer Code Reviews", level: 93, tag: "Version Control" },
        { name: "Vercel CI/CD Pipelines & Edge Deployment", level: 92, tag: "Cloud Deploy" },
        { name: "UI/UX Prototyping, Canva & Usability Testing", level: 91, tag: "Product Craft" },
        { name: "GCC Compiler & Command-Line Debugging", level: 89, tag: "Tooling" }
      ]
    }
  ],

  orbitSkills: [
    "Next.js",
    "React.js",
    "TypeScript",
    "Tailwind CSS",
    "Kotlin",
    "Jetpack Compose",
    "Android Studio",
    "Supabase",
    "PostgreSQL",
    "RBAC & RLS",
    "C / C++",
    "OOP",
    "Data Structures",
    "Vercel CI/CD",
    "Git & GitHub",
    "UI/UX Prototyping",
    "Material Design",
    "REST APIs"
  ],

  process: [
    {
      step: "01",
      title: "End-to-End Web Architecture",
      description:
        "Designing modern SSR and CSR web applications using Next.js and TypeScript backed by normalized PostgreSQL schemas, row-level security policies, and real-time Supabase listeners.",
      artifacts: ["Next.js", "PostgreSQL RLS", "TypeScript"]
    },
    {
      step: "02",
      title: "Native Mobile Engineering",
      description:
        "Building declarative, low-latency Android interfaces with Kotlin and Jetpack Compose following unidirectional data flow, state hoisting, and Material Design accessibility standards.",
      artifacts: ["Kotlin", "Jetpack Compose", "Dark UI"]
    },
    {
      step: "03",
      title: "Algorithmic Rigor & Debugging",
      description:
        "Writing clean, memory-conscious logic in C and C++ verified systematically through trace tables, dry-run validations, and structured edge-case testing.",
      artifacts: ["C / C++", "Trace Tables", "GCC Debug"]
    },
    {
      step: "04",
      title: "Cloud Deploy & Optimization",
      description:
        "Managing automated Git-to-Vercel deployment pipelines, optimizing Core Web Vitals, conducting usability testing across real viewports, and enforcing strict type safety.",
      artifacts: ["Vercel CI/CD", "Core Web Vitals", "Usability QA"]
    }
  ],

  engineeringPractices: [
    {
      title: "Full-Stack Product Lifecycle",
      detail: "Requirement gathering, wireframing, relational schema design, full implementation & production cloud hosting."
    },
    {
      title: "Responsive & Accessible UI Engineering",
      detail: "Mobile-first layouts, semantic DOM markup, consistent spacing tokens & high-contrast visual hierarchy."
    },
    {
      title: "Version Control & Code Quality",
      detail: "Git branching workflows, clean commit history, peer code reviews & modular TypeScript / Kotlin codebases."
    },
    {
      title: "System Architecture & Data Integrity",
      detail: "Normalized PostgreSQL tables, Supabase Row-Level Security (RLS) & strict client/server input validation."
    },
    {
      title: "Iterative Testing & Usability Refinement",
      detail: "Testing user journeys on real mobile & desktop viewports to remove bottlenecks via real user feedback."
    }
  ],

  education: [
    {
      degree: "Technical Skill Training Program (Full-Stack Software Development)",
      institution: "Brocamp – Brototype Kochi Hub, Kerala, India",
      period: "2026",
      details:
        "Intensive industry-aligned self-learning program with weekly technical evaluations, C/C++ algorithms, peer/mentor code reviews, and modern web & mobile execution."
    },
    {
      degree: "Higher Secondary Education (12th Grade / Plus Two Certification)",
      institution: "National Institute of Open Schooling (NIOS) / Kerala Board – Kerala, India",
      period: "Completed",
      details: "Focused on analytical reasoning, computer fundamentals, mathematics, and independent technical study."
    },
    {
      degree: "Secondary Education (10th Grade Certification)",
      institution: "National Institute of Open Schooling (NIOS) – Kerala, India",
      period: "Completed",
      details: "Built disciplined foundations in mathematics, science, and quantitative problem-solving."
    }
  ],

  certifications: [
    {
      title: "C++ Programming Coursework",
      issuer: "Saylor Academy",
      year: "OOP, data types, control structures, modular functions & foundational software engineering in C++."
    },
    {
      title: "Critical Thinking & Professional Networking",
      issuer: "HP LIFE",
      year: "Structured analytical problem-solving, root-cause evaluation, decision-making & communication."
    },
    {
      title: "Canva Essentials Certification",
      issuer: "Canva Design School",
      year: "Digital layout composition, typography pairing, visual hierarchy & web/social graphic systems."
    }
  ],

  awards: [
    {
      title: "Community Volunteer — Whitehope Foundation",
      organization: "Kottayam, Kerala, India",
      year: "2026",
      project: "Organized educational workshops, coordinated field event logistics & built digital outreach campaigns."
    },
    {
      title: "Active Member — Google Developer Groups (GDG)",
      organization: "Regional Developer Ecosystem · Kerala, India",
      year: "Active",
      project: "Engaged in regional chapter events, workshops & discussions on Web, Cloud, Kotlin/Compose & AI tooling."
    }
  ]
};
