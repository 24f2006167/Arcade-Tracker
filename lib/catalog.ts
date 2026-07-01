export interface CatalogBadge {
  title: string;
  type: "game" | "skill" | "trivia";
  url: string;
  /** Official badge/game image from Google servers */
  imageUrl?: string;
  /** Access code to enroll in this game/badge */
  accessCode?: string;
  /** Points this badge earns (games = 1, skills = 0.5 i.e. 1 per 2) */
  pointValue?: number;
  /** Human-readable points description */
  pointLabel?: string;
  /** ISO date when this game/badge becomes available */
  startDate?: string;
  /** ISO date when this game/badge expires and can no longer be earned */
  endDate?: string;
}

/** Game catalog with access codes and images from go.cloudskillsboost.google/arcade */
export const ARCADE_GAMES: CatalogBadge[] = [
  {
    title: "Arcade Trail",
    type: "game",
    url: "https://www.cloudskillsboost.google/games",
    imageUrl: "https://services.google.com/fh/files/misc/arcade_trail.png",
    accessCode: "1q-dataset-72501",
    pointValue: 1,
    pointLabel: "1 Arcade Point per badge",
    startDate: "2026-06-01T00:00:00Z",
    endDate: "2026-06-30T23:59:59Z",
  },
  {
    title: "Arcade Adventure",
    type: "game",
    url: "https://www.cloudskillsboost.google/games",
    imageUrl: "https://services.google.com/fh/files/misc/arcade_adv.png",
    accessCode: "1q-observe-07175",
    pointValue: 1,
    pointLabel: "1 Arcade Point per badge",
    startDate: "2026-06-01T00:00:00Z",
    endDate: "2026-06-30T23:59:59Z",
  },
  {
    title: "Arcade Voyage",
    type: "game",
    url: "https://www.cloudskillsboost.google/games",
    imageUrl: "https://services.google.com/fh/files/misc/arcade_voy.png",
    accessCode: "1q-permission-2296",
    pointValue: 1,
    pointLabel: "1 Arcade Point per badge",
    startDate: "2026-06-01T00:00:00Z",
    endDate: "2026-06-30T23:59:59Z",
  },
  {
    title: "Arcade Base Camp",
    type: "game",
    url: "https://www.cloudskillsboost.google/games",
    imageUrl: "https://services.google.com/fh/files/misc/arcade_bc.png",
    accessCode: "1q-basecamp-0626",
    pointValue: 1,
    pointLabel: "1 Arcade Point per badge",
    startDate: "2026-06-01T00:00:00Z",
    endDate: "2026-06-30T23:59:59Z",
  },
  {
    title: "Work Meets Play: Cloud Canvas",
    type: "game",
    url: "https://www.skills.google/games/7227",
    imageUrl: "https://services.google.com/fh/files/misc/arcade_work.png",
    accessCode: "1q-worknplay-2557",
    pointValue: 1,
    pointLabel: "1 Arcade Point per badge (7 pts for all Jan–Jun 2026)",
    startDate: "2026-01-01T00:00:00Z",
    endDate: "2026-06-30T23:59:59Z",
  },
  {
    title: "Logic Log",
    type: "game",
    url: "https://www.cloudskillsboost.google/games",
    imageUrl: "https://services.google.com/fh/files/misc/arcade_logic.png",
    accessCode: "1q-lookml-25118",
    pointValue: 1,
    pointLabel: "1 Arcade Point per badge",
    startDate: "2026-06-01T00:00:00Z",
    endDate: "2026-06-30T23:59:59Z",
  },
  // ── July 2026 games (add new ones here as they are announced) ──
];


export const CATALOG_BADGES: CatalogBadge[] = [
  {
    title: "Work Meets Play: Cloud Canvas",
    type: "game",
    url: "https://www.skills.google/games/7227"
  },
  {
    title: "Get Started with Dataplex",
    type: "skill",
    url: "https://www.cloudskillsboost.google/course_templates/726"
  },
  {
    title: "Cloud Architecture: Design, Implement, and Manage",
    type: "skill",
    url: "https://www.cloudskillsboost.google/course_templates/640"
  },
  {
    title: "App Engine: 3 Ways",
    type: "skill",
    url: "https://www.cloudskillsboost.google/course_templates/671"
  },
  {
    title: "Build LookML Objects in Looker",
    type: "skill",
    url: "https://www.cloudskillsboost.google/course_templates/639"
  },
  {
    title: "Deploy and Manage Apigee X",
    type: "skill",
    url: "https://www.cloudskillsboost.google/course_templates/661"
  },
  {
    title: "Implement DevOps Workflows in Google Cloud",
    type: "skill",
    url: "https://www.cloudskillsboost.google/course_templates/716"
  },
  {
    title: "Use Machine Learning APIs on Google Cloud",
    type: "skill",
    url: "https://www.cloudskillsboost.google/course_templates/630"
  },
  {
    title: "Create and Manage Bigtable Instances",
    type: "skill",
    url: "https://www.cloudskillsboost.google/course_templates/650"
  },
  {
    title: "Store, Process, and Manage Data on Google Cloud - Console",
    type: "skill",
    url: "https://www.cloudskillsboost.google/course_templates/658"
  },
  {
    title: "Mitigate Threats and Vulnerabilities with Security Command Center",
    type: "skill",
    url: "https://www.cloudskillsboost.google/course_templates/759"
  },
  {
    title: "Use Functions, Formulas, and Charts in Google Sheets",
    type: "skill",
    url: "https://www.cloudskillsboost.google/course_templates/776"
  },
  {
    title: "Use APIs to Work with Cloud Storage",
    type: "skill",
    url: "https://www.cloudskillsboost.google/course_templates/755"
  },
  {
    title: "Monitor and Log with Google Cloud Observability",
    type: "skill",
    url: "https://www.cloudskillsboost.google/course_templates/749"
  },
  {
    title: "Build a Data Mesh with Dataplex",
    type: "skill",
    url: "https://www.cloudskillsboost.google/course_templates/681"
  },
  {
    title: "Prepare Data for ML APIs on Google Cloud",
    type: "skill",
    url: "https://www.cloudskillsboost.google/course_templates/631"
  },
  {
    title: "Engineer Data for Predictive Modeling with BigQuery ML",
    type: "skill",
    url: "https://www.cloudskillsboost.google/course_templates/627"
  },
  {
    title: "Build a Data Warehouse with BigQuery",
    type: "skill",
    url: "https://www.cloudskillsboost.google/course_templates/624"
  },
  {
    title: "Develop Serverless Applications on Cloud Run",
    type: "skill",
    url: "https://www.cloudskillsboost.google/course_templates/741"
  },
  {
    title: "Integrate BigQuery Data and Google Workspace using Apps Script",
    type: "skill",
    url: "https://www.cloudskillsboost.google/course_templates/737"
  },
  {
    title: "Get Started with Cloud Storage",
    type: "skill",
    url: "https://www.cloudskillsboost.google/course_templates/725"
  },
  {
    title: "Manage Kubernetes in Google Cloud",
    type: "skill",
    url: "https://www.cloudskillsboost.google/course_templates/783"
  },
  {
    title: "App Building with AppSheet",
    type: "skill",
    url: "https://www.cloudskillsboost.google/course_templates/635"
  },
  {
    title: "Share Data Using Google Data Cloud",
    type: "skill",
    url: "https://www.cloudskillsboost.google/course_templates/657"
  },
  {
    title: "Deploy Kubernetes Applications on Google Cloud",
    type: "skill",
    url: "https://www.cloudskillsboost.google/course_templates/663"
  },
  {
    title: "Classify Images with TensorFlow on Google Cloud",
    type: "skill",
    url: "https://www.cloudskillsboost.google/course_templates/646"
  },
  {
    "title": "Build a Website on Google Cloud",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/638"
  },
  {
    "title": "Get Started with Pub/Sub",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/728"
  },
  {
    "title": "Analyze BigQuery Data in Connected Sheets",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/632"
  },
  {
    "title": "Create and Manage Cloud SQL for PostgreSQL Instances",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/652"
  },
  {
    "title": "Create ML Models with BigQuery ML",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/626"
  },
  {
    "title": "Get Started with Sensitive Data Protection",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/750"
  },
  {
    "title": "Streaming Analytics into BigQuery",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/752"
  },
  {
    "title": "Automate Data Capture at Scale with Document AI",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/674"
  },
  {
    "title": "Store, Process, and Manage Data on Google Cloud - Command Line",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/659"
  },
  {
    "title": "Discover and Protect Sensitive Data Across Your Ecosystem",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/1177"
  },
  {
    "title": "Using the Google Cloud Speech API",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/756"
  },
  {
    "title": "Create a Streaming Data Lake on Cloud Storage",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/705"
  },
  {
    "title": "Monitoring in Google Cloud",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/747"
  },
  {
    "title": "Build Google Cloud Infrastructure for AWS Professionals",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/687"
  },
  {
    "title": "The Basics of Google Cloud Compute",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/754"
  },
  {
    "title": "Analyze Images with the Cloud Vision API",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/633"
  },
  {
    "title": "Create a Secure Data Lake on Cloud Storage",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/704"
  },
  {
    "title": "Get Started with Google Workspace Tools",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/676"
  },
  {
    "title": "Cloud Run Functions: 3 Ways",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/696"
  },
  {
    "title": "Create and Manage Cloud Spanner Instances",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/643"
  },
  {
    "title": "Monitor Environments with Google Cloud Managed Service for Prometheus",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/761"
  },
  {
    "title": "Develop with Apps Script and AppSheet",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/715"
  },
  {
    "title": "Enhance Gemini Model Capabilities",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/1241"
  },
  {
    "title": "Develop and Secure APIs with Apigee X",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/714"
  },
  {
    "title": "Derive Insights from BigQuery Data",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/623"
  },
  {
    "title": "Set Up a Google Cloud Network",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/641"
  },
  {
    "title": "Inspect Rich Documents with Gemini Multimodality and Multimodal RAG",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/981"
  },
  {
    "title": "Get Started with API Gateway",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/662"
  },
  {
    "title": "Protect Cloud Traffic with Chrome Enterprise Premium Security",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/784"
  },
  {
    "title": "Develop Serverless Apps with Firebase",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/649"
  },
  {
    "title": "Optimize Costs for Google Kubernetes Engine",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/655"
  },
  {
    "title": "Create and Manage AlloyDB Instances",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/642"
  },
  {
    "title": "Analyze Sentiment with Natural Language API",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/667"
  },
  {
    "title": "Implement Cloud Security Fundamentals on Google Cloud",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/645"
  },
  {
    "title": "Explore Generative AI with the Gemini API in Vertex AI",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/959"
  },
  {
    "title": "Get Started with Eventarc",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/727"
  },
  {
    "title": "Build Real World AI Applications with Gemini and Imagen",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/1076"
  },
  {
    "title": "Analyze Speech and Language with Google APIs",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/634"
  },
  {
    "title": "Prompt Design in Vertex AI",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/976"
  },
  {
    "title": "Configure Service Accounts and IAM Roles for Google Cloud",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/702"
  },
  {
    "title": "Get Started with Looker",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/647"
  },
  {
    "title": "Manage Data Models in Looker",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/651"
  },
  {
    "title": "Secure Software Delivery",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/1164"
  },
  {
    "title": "Perform Predictive Data Analysis in BigQuery",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/656"
  },
  {
    "title": "Monitor and Manage Google Cloud Resources",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/653"
  },
  {
    "title": "Implement CI/CD Pipelines on Google Cloud",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/691"
  },
  {
    "title": "Build Infrastructure with Terraform on Google Cloud",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/636"
  },
  {
    "title": "Build a Secure Google Cloud Network",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/654"
  },
  {
    "title": "Cloud Speech API: 3 Ways",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/700"
  },
  {
    "title": "Set Up an App Dev Environment on Google Cloud",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/637"
  },
  {
    "title": "Implement Multimodal Vector Search with BigQuery",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/1232"
  },
  {
    "title": "Analyze and Reason on Multimodal Data with Gemini",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/1240"
  },
  {
    "title": "Privileged Access with IAM",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/1337"
  },
  {
    "title": "Implementing Cloud Load Balancing for Compute Engine",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/648"
  },
  {
    "title": "Connecting Cloud Networks with NCC",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/1364"
  },
  {
    "title": "Designing Network Security in Google Cloud",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/1412"
  },
  {
    "title": "Develop Your Google Cloud Network",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/625"
  },
  {
    "title": "Build Google Cloud Infrastructure for Azure Professionals",
    "type": "skill",
    "url": "https://www.skills.google/course_templates/688"
  },
  {
    "title": "Google DeepMind: Train A Small Language Model",
    "type": "skill",
    "url": "https://www.skills.google/course_templates/1453"
  },
  {
    "title": "Kickstarting Application Development with Gemini Code Assist",
    "type": "skill",
    "url": "https://www.skills.google/course_templates/1399"
  },
  {
    "title": "Enrich Metadata and Discovery of BigLake Data",
    "type": "skill",
    "url": "https://www.cloudskillsboost.google/course_templates/753"
  },
  {
    "title": "Create Your First Gemini Enterprise Application",
    "type": "skill",
    "url": "https://www.skills.google/course_templates/1586"
  }
];
