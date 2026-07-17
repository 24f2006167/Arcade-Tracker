/**
 * Lab Solutions Catalog
 *
 * Each entry maps a badge slug to its labs and shell commands.
 *
 * Command conventions:
 *   - Variables like $PROJECT_ID are exported before use
 *   - Script solutions: curl → chmod → run
 *   - Universal: works for any user, any project
 */
import { slugify } from "./slugify";


export interface SolutionVariable {
  /** Shell variable name (e.g. PROJECT_ID) */
  name: string;
  /** Human-readable label */
  label: string;
  /** How to find this value */
  hint: string;
  /** Auto-detect command (if available, user can run this instead of typing manually) */
  autoDetect?: string;
}

export interface SolutionStep {
  title: string;
  description?: string;
  /** Shell commands — paste each block into Cloud Shell */
  commands: string[];
  /** If true, this is a "create a script file and run it" block */
  isScript?: boolean;
  /** Optional note shown below the commands */
  note?: string;
}

export interface LabSolution {
  labId: string;
  labTitle: string;
  labUrl?: string;
  /** A single curl+chmod+run 3-command quick solution (optional) */
  quickScript?: {
    description: string;
    commands: string[];
  };
  /** Variables that must be exported before any commands run */
  variables?: SolutionVariable[];
  steps: SolutionStep[];
}

export interface BadgeSolution {
  badgeTitle: string;
  badgeSlug: string;
  badgeUrl?: string;
  description?: string;
  labs: LabSolution[];
}

// ─── COMMON VARIABLES ────────────────────────────────────────────────────────

const VAR_PROJECT: SolutionVariable = {
  name: "PROJECT_ID",
  label: "Project ID",
  hint: "Found in the lab panel or Google Cloud Console",
  autoDetect: "export PROJECT_ID=$(gcloud config get-value project)",
};

const VAR_REGION: SolutionVariable = {
  name: "REGION",
  label: "Region",
  hint: "Shown in the lab instructions (e.g. us-east1)",
  autoDetect: `export REGION=$(gcloud compute project-info describe --format="value(commonInstanceMetadata.items[google-compute-default-region])")`,
};

const VAR_ZONE: SolutionVariable = {
  name: "ZONE",
  label: "Zone",
  hint: "Shown in the lab instructions (e.g. us-east1-b)",
  autoDetect: `export ZONE=$(gcloud compute project-info describe --format="value(commonInstanceMetadata.items[google-compute-default-zone])")`,
};

// ─── SOLUTIONS CATALOG ────────────────────────────────────────────────────────

export const SOLUTIONS: BadgeSolution[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // BUILD INFRASTRUCTURE WITH TERRAFORM ON GOOGLE CLOUD
  // ──────────────────────────────────────────────────────────────────────────
  {
    badgeTitle: "Build Infrastructure with Terraform on Google Cloud",
    badgeSlug: "build-infrastructure-with-terraform-on-google-cloud",
    badgeUrl: "https://www.cloudskillsboost.google/course_templates/636",
    description:
      "Complete all 4 Terraform labs using the auto-run scripts below. Each script handles all tasks including resource creation, state management, and modules.",
    labs: [
      {
        labId: "GSP750",
        labTitle: "Terraform Fundamentals",
        labUrl: "https://www.cloudskillsboost.google/focuses/14940",
        quickScript: {
          description: "Downloads and runs a complete solution script for GSP750.",
          commands: [
            "curl -LO raw.githubusercontent.com/gcpdecode/Terraform-Fundamentals/main/gsp750.sh",
            "sudo chmod +x gsp750.sh",
            "./gsp750.sh",
          ],
        },
        variables: [VAR_PROJECT, VAR_REGION, VAR_ZONE],
        steps: [
          {
            title: "Set your project variables",
            commands: [
              `export PROJECT_ID=$(gcloud config get-value project)`,
              `export REGION="us-east1"   # Change if your lab uses a different region`,
              `export ZONE="us-east1-b"   # Change if your lab uses a different zone`,
            ],
          },
          {
            title: "Install Terraform and verify",
            commands: [
              "terraform --version",
            ],
            note: "Terraform is pre-installed in Cloud Shell.",
          },
          {
            title: "Create and apply infrastructure",
            commands: [
              `mkdir -p terraform-infra && cd terraform-infra`,
              `cat > main.tf << 'EOF'\nterraform {\n  required_providers {\n    google = {\n      source  = "hashicorp/google"\n      version = "4.53.0"\n    }\n  }\n}\nprovider "google" {\n  project = var.project_id\n  region  = var.region\n  zone    = var.zone\n}\nvariable "project_id" {}\nvariable "region" { default = "us-east1" }\nvariable "zone"   { default = "us-east1-b" }\nresource "google_compute_instance" "terraform" {\n  name         = "terraform"\n  machine_type = "n1-standard-1"\n  tags         = ["web","dev"]\n  boot_disk {\n    initialize_params { image = "debian-cloud/debian-11" }\n  }\n  network_interface {\n    network = "default"\n    access_config {}\n  }\n}\nEOF`,
              `terraform init`,
              `terraform plan -var="project_id=$PROJECT_ID"`,
              `terraform apply -var="project_id=$PROJECT_ID" -auto-approve`,
            ],
          },
        ],
      },
      {
        labId: "GSP751",
        labTitle: "Infrastructure as Code with Terraform",
        labUrl: "https://www.cloudskillsboost.google/focuses/14942",
        quickScript: {
          description: "Downloads and runs a complete solution script for GSP751.",
          commands: [
            "curl -LO raw.githubusercontent.com/gcpdecode/Infrastructure-as-Code-with-Terraform/main/gsp751.sh",
            "sudo chmod +x gsp751.sh",
            "./gsp751.sh",
          ],
        },
        variables: [VAR_PROJECT, VAR_REGION, VAR_ZONE],
        steps: [
          {
            title: "Set variables",
            commands: [
              `export PROJECT_ID=$(gcloud config get-value project)`,
              `export REGION="us-east1"`,
              `export ZONE="us-east1-b"`,
            ],
          },
          {
            title: "Create Terraform configuration with variables",
            commands: [
              `mkdir -p iac-terraform && cd iac-terraform`,
              `cat > variables.tf << 'EOF'\nvariable "project_id" {}\nvariable "region" { default = "us-east1" }\nvariable "zone"   { default = "us-east1-b" }\nEOF`,
              `cat > main.tf << 'EOF'\nterraform {\n  required_providers {\n    google = { source = "hashicorp/google" version = "4.53.0" }\n  }\n}\nprovider "google" {\n  project = var.project_id\n  region  = var.region\n  zone    = var.zone\n}\nresource "google_compute_instance" "terraform" {\n  name         = "terraform"\n  machine_type = "n1-standard-1"\n  boot_disk { initialize_params { image = "debian-cloud/debian-11" } }\n  network_interface { network = "default" access_config {} }\n}\nEOF`,
              `terraform init && terraform apply -var="project_id=$PROJECT_ID" -auto-approve`,
            ],
          },
        ],
      },
      {
        labId: "GSP752",
        labTitle: "Manage Terraform State",
        labUrl: "https://www.cloudskillsboost.google/focuses/14946",
        quickScript: {
          description: "Downloads and runs a complete solution script for GSP752. All tasks complete automatically.",
          commands: [
            "curl -LO raw.githubusercontent.com/gcpdecode/Manage-Terraform-State/29a1eb9ecff38efe3120bf3f764c0029733d67f9/gsp752.sh",
            "sudo chmod +x gsp752.sh",
            "./gsp752.sh",
          ],
        },
        variables: [VAR_PROJECT, VAR_REGION],
        steps: [
          {
            title: "Set variables",
            commands: [
              `export PROJECT_ID=$(gcloud config get-value project)`,
              `export REGION="us-east1"`,
            ],
          },
          {
            title: "Create a GCS bucket for remote state",
            commands: [
              `export BUCKET_NAME="${"$"}{PROJECT_ID}-tf-state"`,
              `gsutil mb -p $PROJECT_ID gs://$BUCKET_NAME`,
            ],
          },
          {
            title: "Configure Terraform backend",
            commands: [
              `cat > backend.tf << EOF\nterraform {\n  backend "gcs" {\n    bucket = "$BUCKET_NAME"\n    prefix = "terraform/state"\n  }\n}\nEOF`,
              `terraform init -migrate-state`,
            ],
          },
        ],
      },
      {
        labId: "GSP492",
        labTitle: "Build Infrastructure with Terraform on Google Cloud: Challenge Lab",
        labUrl: "https://www.cloudskillsboost.google/focuses/42413",
        variables: [VAR_PROJECT, VAR_REGION, VAR_ZONE],
        steps: [
          {
            title: "Set your lab-specific variables",
            description: "Get these values from the Lab panel on the left side of the lab page.",
            commands: [
              `export PROJECT_ID=$(gcloud config get-value project)`,
              `export REGION="us-east1"      # Replace with your assigned region`,
              `export ZONE="us-east1-b"      # Replace with your assigned zone`,
              `export INSTANCE_NAME="tf-instance-1"  # Replace with given instance name`,
              `export INSTANCE_NAME_2="tf-instance-2"`,
              `export BUCKET_NAME="$PROJECT_ID-tf-bucket"`,
            ],
          },
          {
            title: "Task 1 – Create the Terraform configuration files",
            commands: [
              `mkdir -p terraform-challenge && cd terraform-challenge`,
              `cat > main.tf << 'EOF'\nterraform {\n  required_providers {\n    google = { source = "hashicorp/google" version = "4.53.0" }\n  }\n  backend "gcs" {\n    bucket  = "BUCKET_PLACEHOLDER"\n    prefix  = "terraform/state"\n  }\n}\nprovider "google" {\n  project = var.project_id\n  region  = var.region\n  zone    = var.zone\n}\nEOF`,
              `sed -i "s/BUCKET_PLACEHOLDER/$BUCKET_NAME/" main.tf`,
            ],
          },
          {
            title: "Task 2 – Import infrastructure",
            commands: [
              `terraform import module.instances.google_compute_instance.tf-instance-1 $PROJECT_ID/zones/$ZONE/$INSTANCE_NAME`,
              `terraform import module.instances.google_compute_instance.tf-instance-2 $PROJECT_ID/zones/$ZONE/$INSTANCE_NAME_2`,
            ],
          },
          {
            title: "Task 3 – Configure remote backend",
            commands: [
              `gsutil mb -p $PROJECT_ID gs://$BUCKET_NAME`,
              `terraform init -migrate-state -force-copy`,
            ],
          },
          {
            title: "Task 4 – Modify and update infrastructure",
            commands: [
              `terraform plan && terraform apply -auto-approve`,
            ],
          },
          {
            title: "Task 5 – Destroy resources",
            commands: [
              `terraform destroy -target=module.instances.google_compute_instance.tf-instance-3 -auto-approve`,
            ],
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // IMPLEMENT DEVOPS WORKFLOWS IN GOOGLE CLOUD
  // ──────────────────────────────────────────────────────────────────────────
  {
    badgeTitle: "Implement DevOps Workflows in Google Cloud",
    badgeSlug: "implement-devops-workflows-in-google-cloud",
    badgeUrl: "https://www.cloudskillsboost.google/course_templates/716",
    description: "Complete all DevOps labs using Cloud Shell. Labs cover Cloud Source Repositories, Cloud Build, and CI/CD pipelines.",
    labs: [
      {
        labId: "GSP764",
        labTitle: "Introduction to Cloud Build",
        labUrl: "https://www.cloudskillsboost.google/focuses/1  1986",
        quickScript: {
          description: "Runs the complete solution for GSP764.",
          commands: [
            "curl -LO raw.githubusercontent.com/gcpdecode/DevOps-Workflows/main/gsp764.sh",
            "sudo chmod +x gsp764.sh",
            "./gsp764.sh",
          ],
        },
        variables: [VAR_PROJECT, VAR_REGION],
        steps: [
          {
            title: "Enable APIs",
            commands: [
              `export PROJECT_ID=$(gcloud config get-value project)`,
              `gcloud services enable cloudbuild.googleapis.com sourcerepo.googleapis.com containerregistry.googleapis.com`,
            ],
          },
          {
            title: "Create a Cloud Source Repository",
            commands: [
              `gcloud source repos create hello-cloudbuild-app`,
              `gcloud source repos create hello-cloudbuild-env`,
            ],
          },
          {
            title: "Clone and configure the repos",
            commands: [
              `cd ~`,
              `gcloud source repos clone hello-cloudbuild-app`,
              `cd hello-cloudbuild-app`,
              `git checkout -b master`,
              `cat > app.py << 'EOF'\nfrom flask import Flask\napp = Flask(__name__)\n@app.route('/')\ndef hello_world():\n    return 'Hello World!'\nif __name__ == '__main__':\n    app.run(host='0.0.0.0', port=8080)\nEOF`,
              `git add . && git commit -m "Initial commit" && git push origin master`,
            ],
          },
        ],
      },
      {
        labId: "GSP716",
        labTitle: "Implement DevOps Workflows in Google Cloud: Challenge Lab",
        labUrl: "https://www.cloudskillsboost.google/focuses/35789",
        variables: [VAR_PROJECT, VAR_REGION],
        steps: [
          {
            title: "Set variables from Lab panel",
            commands: [
              `export PROJECT_ID=$(gcloud config get-value project)`,
              `export REGION="us-east1"    # Replace with your lab region`,
              `export CLUSTER_NAME="hello-cluster"`,
            ],
          },
          {
            title: "Task 1 – Create the GKE cluster",
            commands: [
              `gcloud container clusters create $CLUSTER_NAME \\`,
              `  --num-nodes 3 --region $REGION`,
            ],
          },
          {
            title: "Task 2 – Enable APIs and create repos",
            commands: [
              `gcloud services enable container.googleapis.com cloudbuild.googleapis.com sourcerepo.googleapis.com`,
              `gcloud source repos create hello-cloudbuild-app`,
              `gcloud source repos create hello-cloudbuild-env`,
            ],
          },
          {
            title: "Task 3 – Create Cloud Build trigger",
            commands: [
              `gcloud beta builds triggers create cloud-source-repositories \\`,
              `  --repo=hello-cloudbuild-app \\`,
              `  --branch-pattern="^master$" \\`,
              `  --build-config=cloudbuild.yaml`,
            ],
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // DEPLOY KUBERNETES APPLICATIONS ON GOOGLE CLOUD
  // ──────────────────────────────────────────────────────────────────────────
  {
    badgeTitle: "Deploy Kubernetes Applications on Google Cloud",
    badgeSlug: "deploy-kubernetes-applications-on-google-cloud",
    badgeUrl: "https://www.cloudskillsboost.google/course_templates/663",
    description: "Labs covering Docker, Kubernetes deployments, rolling updates, and GKE configuration.",
    labs: [
      {
        labId: "GSP055",
        labTitle: "Introduction to Docker",
        labUrl: "https://www.cloudskillsboost.google/focuses/1029",
        quickScript: {
          description: "Quick solution for GSP055 Docker introduction lab.",
          commands: [
            "curl -LO raw.githubusercontent.com/gcpdecode/Deploy-Kubernetes-Applications/main/gsp055.sh",
            "sudo chmod +x gsp055.sh",
            "./gsp055.sh",
          ],
        },
        variables: [VAR_PROJECT],
        steps: [
          {
            title: "Run Docker hello-world",
            commands: [`docker run hello-world`],
          },
          {
            title: "Build a Docker image",
            commands: [
              `mkdir test-docker && cd test-docker`,
              `cat > Dockerfile << 'EOF'\nFROM node:6\nWORKDIR /app\nADD . /app\nEXPOSE 80\nCMD ["node", "app.js"]\nEOF`,
              `cat > app.js << 'EOF'\nconst http = require('http');\nconst server = http.createServer((req, res) => {\n  res.writeHead(200);\n  res.end('Hello World');\n});\nserver.listen(80);\nEOF`,
              `docker build -t node-app:0.1 .`,
            ],
          },
          {
            title: "Push to Container Registry",
            commands: [
              `export PROJECT_ID=$(gcloud config get-value project)`,
              `docker tag node-app:0.1 gcr.io/$PROJECT_ID/node-app:0.2`,
              `docker push gcr.io/$PROJECT_ID/node-app:0.2`,
            ],
          },
        ],
      },
      {
        labId: "GSP663",
        labTitle: "Deploy Kubernetes Applications on Google Cloud: Challenge Lab",
        labUrl: "https://www.cloudskillsboost.google/focuses/10457",
        variables: [VAR_PROJECT, VAR_ZONE],
        steps: [
          {
            title: "Set variables from Lab panel",
            commands: [
              `export PROJECT_ID=$(gcloud config get-value project)`,
              `export ZONE="us-central1-a"   # Replace with your zone`,
              `export IMAGE_NAME="echo-app"`,
              `export TAG="v1"`,
              `export CLUSTER_NAME="echo-cluster"`,
              `export DEPLOYMENT_NAME="echo-web"`,
            ],
          },
          {
            title: "Create GKE cluster and build image",
            commands: [
              `gcloud container clusters create $CLUSTER_NAME --num-nodes 2 --zone $ZONE`,
              `gcloud container clusters get-credentials $CLUSTER_NAME --zone $ZONE`,
            ],
          },
          {
            title: "Deploy to Kubernetes",
            commands: [
              `kubectl create deployment $DEPLOYMENT_NAME --image=gcr.io/$PROJECT_ID/$IMAGE_NAME:$TAG`,
              `kubectl expose deployment $DEPLOYMENT_NAME --type=LoadBalancer --port=80 --target-port=8000`,
            ],
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // BUILD A SECURE GOOGLE CLOUD NETWORK
  // ──────────────────────────────────────────────────────────────────────────
  {
    badgeTitle: "Build a Secure Google Cloud Network",
    badgeSlug: "build-a-secure-google-cloud-network",
    badgeUrl: "https://www.cloudskillsboost.google/course_templates/654",
    description: "Labs covering VPC networks, firewall rules, VPC peering, and network security.",
    labs: [
      {
        labId: "GSP211",
        labTitle: "VPC Networks - Controlling Access",
        labUrl: "https://www.cloudskillsboost.google/focuses/1231",
        variables: [VAR_PROJECT, VAR_ZONE],
        steps: [
          {
            title: "Create custom VPC network",
            commands: [
              `export PROJECT_ID=$(gcloud config get-value project)`,
              `gcloud compute networks create privatenet --subnet-mode=custom`,
              `gcloud compute networks subnets create privatesubnet-us \\`,
              `  --network=privatenet --region=us-east1 --range=172.16.0.0/24`,
            ],
          },
          {
            title: "Create firewall rules",
            commands: [
              `gcloud compute firewall-rules create privatenet-allow-icmp-ssh-rdp \\`,
              `  --direction=INGRESS --priority=1000 --network=privatenet \\`,
              `  --action=ALLOW --rules=icmp,tcp:22,tcp:3389 --source-ranges=0.0.0.0/0`,
            ],
          },
        ],
      },
      {
        labId: "GSP654",
        labTitle: "Build a Secure Google Cloud Network: Challenge Lab",
        labUrl: "https://www.cloudskillsboost.google/focuses/12068",
        quickScript: {
          description: "Runs complete solution script for GSP654.",
          commands: [
            "curl -LO raw.githubusercontent.com/gcpdecode/Build-Secure-Google-Cloud-Network/main/gsp654.sh",
            "sudo chmod +x gsp654.sh",
            "./gsp654.sh",
          ],
        },
        variables: [VAR_PROJECT, VAR_ZONE],
        steps: [
          {
            title: "Set variables from Lab panel",
            commands: [
              `export PROJECT_ID=$(gcloud config get-value project)`,
              `export ZONE="us-central1-c"   # Get exact value from Lab panel`,
              `export REGION="us-central1"`,
              `export SSH_IAP_NETWORK_TAG="allow-ssh-iap-ingress-ql-XXXX"  # From Lab panel`,
              `export HTTP_NETWORK_TAG="allow-http-ingress-ql-XXXX"  # From Lab panel`,
              `export INSTANCE_NAME="linux-iap"`,
            ],
          },
          {
            title: "Remove overly permissive firewall rules",
            commands: [
              `gcloud compute firewall-rules delete open-access --quiet`,
            ],
          },
          {
            title: "Create specific firewall rules for SSH via IAP",
            commands: [
              `gcloud compute firewall-rules create ssh-ingress \\`,
              `  --allow=tcp:22 --source-ranges 35.235.240.0/20 \\`,
              `  --target-tags $SSH_IAP_NETWORK_TAG --network acme-vpc`,
              `gcloud compute instances add-tags $INSTANCE_NAME --tags=$SSH_IAP_NETWORK_TAG --zone=$ZONE`,
            ],
          },
          {
            title: "Create HTTP firewall rule and tag web server",
            commands: [
              `gcloud compute firewall-rules create http-ingress \\`,
              `  --allow=tcp:80 --source-ranges 0.0.0.0/0 \\`,
              `  --target-tags $HTTP_NETWORK_TAG --network acme-vpc`,
              `gcloud compute instances add-tags juice-shop --tags=$HTTP_NETWORK_TAG --zone=$ZONE`,
            ],
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // MANAGE KUBERNETES IN GOOGLE CLOUD
  // ──────────────────────────────────────────────────────────────────────────
  {
    badgeTitle: "Manage Kubernetes in Google Cloud",
    badgeSlug: "manage-kubernetes-in-google-cloud",
    badgeUrl: "https://www.cloudskillsboost.google/course_templates/783",
    description: "Labs on managing GKE clusters, node pools, upgrades, and operations.",
    labs: [
      {
        labId: "GSP783",
        labTitle: "Manage Kubernetes in Google Cloud: Challenge Lab",
        labUrl: "https://www.cloudskillsboost.google/focuses/57349",
        quickScript: {
          description: "Runs complete solution script for GSP783.",
          commands: [
            "curl -LO raw.githubusercontent.com/gcpdecode/Manage-Kubernetes-in-Google-Cloud/main/gsp783.sh",
            "sudo chmod +x gsp783.sh",
            "./gsp783.sh",
          ],
        },
        variables: [VAR_PROJECT, VAR_ZONE, VAR_REGION],
        steps: [
          {
            title: "Set variables from Lab panel",
            commands: [
              `export PROJECT_ID=$(gcloud config get-value project)`,
              `export ZONE="us-central1-c"   # Replace with your zone`,
              `export REGION="us-central1"`,
              `export CLUSTER_NAME="onlineboutique-cluster"`,
              `export NAMESPACE_NAME="dev"`,
            ],
          },
          {
            title: "Create GKE Autopilot cluster",
            commands: [
              `gcloud container clusters create-auto $CLUSTER_NAME --region=$REGION`,
              `gcloud container clusters get-credentials $CLUSTER_NAME --region=$REGION`,
            ],
          },
          {
            title: "Create namespace and deploy Online Boutique",
            commands: [
              `kubectl create namespace $NAMESPACE_NAME`,
              `kubectl apply -n $NAMESPACE_NAME -f "https://raw.githubusercontent.com/GoogleCloudPlatform/microservices-demo/main/release/kubernetes-manifests.yaml"`,
              `kubectl wait --for=condition=Ready pods --all -n $NAMESPACE_NAME --timeout=300s`,
            ],
          },
          {
            title: "Deploy a pod disruption budget",
            commands: [
              `kubectl create poddisruptionbudget onlineboutique-frontend-pdb \\`,
              `  --selector app=frontend --min-available 1 -n $NAMESPACE_NAME`,
            ],
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // SET UP AN APP DEV ENVIRONMENT ON GOOGLE CLOUD
  // ──────────────────────────────────────────────────────────────────────────
  {
    badgeTitle: "Set Up an App Dev Environment on Google Cloud",
    badgeSlug: "set-up-an-app-dev-environment-on-google-cloud",
    badgeUrl: "https://www.cloudskillsboost.google/course_templates/637",
    description: "Labs covering Pub/Sub, Cloud Run, Artifact Registry, and developer workflows.",
    labs: [
      {
        labId: "GSP315",
        labTitle: "Set Up an App Dev Environment on Google Cloud: Challenge Lab",
        labUrl: "https://www.cloudskillsboost.google/focuses/10419",
        quickScript: {
          description: "Complete solution for GSP315.",
          commands: [
            "curl -LO raw.githubusercontent.com/gcpdecode/App-Dev-Environment/main/gsp315.sh",
            "sudo chmod +x gsp315.sh",
            "./gsp315.sh",
          ],
        },
        variables: [VAR_PROJECT, VAR_REGION],
        steps: [
          {
            title: "Set variables from Lab panel",
            commands: [
              `export PROJECT_ID=$(gcloud config get-value project)`,
              `export REGION="us-east1"  # Replace with your region`,
              `export BUCKET_NAME="$PROJECT_ID-bucket"`,
              `export TOPIC_NAME="topic-memories-XXXX"  # From Lab panel`,
              `export FUNCTION_NAME="memories-thumbnail-creator"`,
              `export USER_EMAIL="student-XXXX@qwiklabs.net"  # Your Qwiklabs email`,
            ],
          },
          {
            title: "Create Cloud Storage bucket",
            commands: [
              `gsutil mb -l $REGION gs://$BUCKET_NAME`,
            ],
          },
          {
            title: "Create Pub/Sub topic",
            commands: [
              `gcloud pubsub topics create $TOPIC_NAME`,
            ],
          },
          {
            title: "Deploy Cloud Run function",
            description: "Create the function files and deploy. The script below handles all file creation.",
            commands: [
              "mkdir thumbnail-fn && cd thumbnail-fn",
              "# Download the pre-built solution files:",
              "curl -LO https://raw.githubusercontent.com/gcpdecode/App-Dev-Environment/main/index.js",
              "curl -LO https://raw.githubusercontent.com/gcpdecode/App-Dev-Environment/main/package.json",
              "# Deploy the function:",
              "gcloud functions deploy $FUNCTION_NAME \\",
              "  --gen2 --runtime nodejs18 --entry-point memories-thumbnail-creator \\",
              "  --trigger-bucket $BUCKET_NAME --region $REGION \\",
              "  --set-env-vars TOPIC_NAME=$TOPIC_NAME --quiet",
            ],
            note: "If the curl download doesn't work, use the Quick Script at the top which handles everything automatically.",
          },
          {
            title: "Grant permissions to service account",
            commands: [
              `gcloud projects add-iam-policy-binding $PROJECT_ID \\`,
              `  --member="user:$USER_EMAIL" --role="roles/run.admin"`,
              `gcloud projects add-iam-policy-binding $PROJECT_ID \\`,
              `  --member="serviceAccount:$PROJECT_ID@appspot.gserviceaccount.com" \\`,
              `  --role="roles/artifactregistry.reader"`,
            ],
          },
        ],
      },
    ],
  },


  // ──────────────────────────────────────────────────────────────────────────
  // STREAMING ANALYTICS INTO BIGQUERY
  // ──────────────────────────────────────────────────────────────────────────
  {
    badgeTitle: "Streaming Analytics into BigQuery",
    badgeSlug: "streaming-analytics-into-bigquery",
    badgeUrl: "https://www.cloudskillsboost.google/course_templates/752",
    description: "Labs covering Dataflow streaming pipelines and real-time analytics with BigQuery.",
    labs: [
      {
        labId: "GSP1110",
        labTitle: "Streaming Analytics into BigQuery: Challenge Lab",
        labUrl: "https://www.cloudskillsboost.google/focuses/67064",
        quickScript: {
          description: "Runs complete solution for GSP1110.",
          commands: [
            "curl -LO raw.githubusercontent.com/gcpdecode/Streaming-Analytics-BigQuery/main/gsp1110.sh",
            "sudo chmod +x gsp1110.sh",
            "./gsp1110.sh",
          ],
        },
        variables: [VAR_PROJECT, VAR_REGION],
        steps: [
          {
            title: "Set variables from Lab panel",
            commands: [
              `export PROJECT_ID=$(gcloud config get-value project)`,
              `export REGION="us-east1"   # Replace with your region`,
              `export BUCKET_NAME="$PROJECT_ID"`,
              `export DATASET_NAME="baseline_dataset"`,
              `export TABLE_NAME="baseline_table"`,
            ],
          },
          {
            title: "Create BigQuery dataset and table",
            commands: [
              `bq mk -d $DATASET_NAME`,
              `bq mk -t $DATASET_NAME.$TABLE_NAME \\\n  user_id:INTEGER,age:INTEGER,gender:STRING,country:STRING,is_existing_user:BOOLEAN`,
            ],
          },
          {
            title: "Create GCS bucket and run Dataflow job",
            commands: [
              `gsutil mb -l $REGION gs://$BUCKET_NAME`,
              `gcloud dataflow jobs run streaming-job \\`,
              `  --gcs-location gs://dataflow-templates-$REGION/latest/GCS_Text_to_BigQuery \\`,
              `  --region $REGION \\`,
              `  --staging-location gs://$BUCKET_NAME/temp \\`,
              `  --parameters inputFilePattern=gs://$BUCKET_NAME/*.json,JSONPath=gs://$BUCKET_NAME/bq_schema.json,outputTable=$PROJECT_ID:$DATASET_NAME.$TABLE_NAME,bigQueryLoadingTemporaryDirectory=gs://$BUCKET_NAME/temp`,
            ],
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // IMPLEMENT CI/CD PIPELINES ON GOOGLE CLOUD
  // ──────────────────────────────────────────────────────────────────────────
  {
    badgeTitle: "Implement CI/CD Pipelines on Google Cloud",
    badgeSlug: "implement-cicd-pipelines-on-google-cloud",
    badgeUrl: "https://www.cloudskillsboost.google/course_templates/691",
    description: "Labs covering Cloud Deploy, Cloud Build, and complete CI/CD pipelines.",
    labs: [
      {
        labId: "GSP1077",
        labTitle: "Implement CI/CD Pipelines on Google Cloud: Challenge Lab",
        labUrl: "https://www.cloudskillsboost.google/focuses/65147",
        quickScript: {
          description: "Complete solution for the CI/CD pipelines challenge.",
          commands: [
            "curl -LO raw.githubusercontent.com/gcpdecode/Implement-CICD-Pipelines/main/gsp1077.sh",
            "sudo chmod +x gsp1077.sh",
            "./gsp1077.sh",
          ],
        },
        variables: [VAR_PROJECT, VAR_REGION],
        steps: [
          {
            title: "Set variables",
            commands: [
              `export PROJECT_ID=$(gcloud config get-value project)`,
              `export REGION="us-central1"   # Replace with your region`,
              `gcloud config set compute/region $REGION`,
            ],
          },
          {
            title: "Enable required APIs",
            commands: [
              `gcloud services enable clouddeploy.googleapis.com \\`,
              `  cloudbuild.googleapis.com \\`,
              `  run.googleapis.com \\`,
              `  artifactregistry.googleapis.com`,
            ],
          },
          {
            title: "Create Artifact Registry repository",
            commands: [
              `gcloud artifacts repositories create cicd-challenge \\`,
              `  --repository-format=docker --location=$REGION`,
            ],
          },
          {
            title: "Build and push container image",
            commands: [
              `cd ~/cloud-deploy-pipeline`,
              `gcloud builds submit --tag $REGION-docker.pkg.dev/$PROJECT_ID/cicd-challenge/sample-app:blue`,
            ],
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // DEVELOP SERVERLESS APPLICATIONS ON CLOUD RUN
  // ──────────────────────────────────────────────────────────────────────────
  {
    badgeTitle: "Develop Serverless Applications on Cloud Run",
    badgeSlug: "develop-serverless-applications-on-cloud-run",
    badgeUrl: "https://www.cloudskillsboost.google/course_templates/741",
    description: "Labs covering Cloud Run deployments, service management, and serverless patterns.",
    labs: [
      {
        labId: "GSP328",
        labTitle: "Develop Serverless Applications on Cloud Run: Challenge Lab",
        labUrl: "https://www.cloudskillsboost.google/focuses/14744",
        quickScript: {
          description: "Complete solution for GSP328.",
          commands: [
            "curl -LO raw.githubusercontent.com/gcpdecode/Serverless-Cloud-Run/main/gsp328.sh",
            "sudo chmod +x gsp328.sh",
            "./gsp328.sh",
          ],
        },
        variables: [VAR_PROJECT, VAR_REGION],
        steps: [
          {
            title: "Set variables",
            commands: [
              `export PROJECT_ID=$(gcloud config get-value project)`,
              `export REGION="us-central1"   # Replace with your region`,
              `export PUBLIC_BILLING_SERVICE_NAME="billing-service-XXXX"  # From Lab panel`,
              `export FRONTEND_SERVICE_NAME="frontend-XXXX"  # From Lab panel`,
              `export PRIVATE_BILLING_SERVICE_NAME="private-billing-service-XXXX"`,
            ],
          },
          {
            title: "Enable APIs and configure project",
            commands: [
              `gcloud services enable run.googleapis.com`,
              `gcloud config set run/region $REGION`,
            ],
          },
          {
            title: "Deploy the public billing service",
            commands: [
              `gcloud run deploy $PUBLIC_BILLING_SERVICE_NAME \\`,
              `  --image gcr.io/qwiklabs-resources/billing-staging-api:0.1 \\`,
              `  --allow-unauthenticated --region $REGION --quiet`,
            ],
          },
          {
            title: "Deploy the private billing service",
            commands: [
              `gcloud run deploy $PRIVATE_BILLING_SERVICE_NAME \\`,
              `  --image gcr.io/qwiklabs-resources/billing-staging-api:0.1 \\`,
              `  --no-allow-unauthenticated --region $REGION --quiet`,
            ],
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // MONITOR AND LOG WITH GOOGLE CLOUD OBSERVABILITY
  // ──────────────────────────────────────────────────────────────────────────
  {
    badgeTitle: "Monitor and Log with Google Cloud Observability",
    badgeSlug: "monitor-and-log-with-google-cloud-observability",
    badgeUrl: "https://www.cloudskillsboost.google/course_templates/749",
    description: "Labs covering Cloud Monitoring, Cloud Logging, dashboards, and alerting.",
    labs: [
      {
        labId: "GSP338",
        labTitle: "Monitor and Log with Google Cloud Observability: Challenge Lab",
        labUrl: "https://www.cloudskillsboost.google/focuses/14862",
        quickScript: {
          description: "Complete solution for GSP338.",
          commands: [
            "curl -LO raw.githubusercontent.com/gcpdecode/Cloud-Observability/main/gsp338.sh",
            "sudo chmod +x gsp338.sh",
            "./gsp338.sh",
          ],
        },
        variables: [VAR_PROJECT, VAR_ZONE],
        steps: [
          {
            title: "Set variables",
            commands: [
              `export PROJECT_ID=$(gcloud config get-value project)`,
              `export ZONE="us-central1-a"   # Replace with your zone`,
              `export REGION="us-central1"`,
            ],
          },
          {
            title: "Create an uptime check",
            commands: [
              `gcloud monitoring uptime create my-uptime-check \\`,
              `  --display-name="my-uptime-check" \\`,
              `  --resource-type=gae-app \\`,
              `  --resource-labels=project_id=$PROJECT_ID,module_id=default`,
            ],
          },
          {
            title: "Create an alerting policy",
            commands: [
              `cat > alert-policy.json << 'EOF'\n{\n  "displayName": "VM Alerts - alert-1",\n  "conditions": [{\n    "displayName": "VM Instance - CPU utilization",\n    "conditionThreshold": {\n      "filter": "resource.type = \\"gce_instance\\" AND metric.type = \\"compute.googleapis.com/instance/cpu/utilization\\"",\n      "comparison": "COMPARISON_GT",\n      "thresholdValue": 0.8,\n      "duration": "60s",\n      "aggregations": [{"alignmentPeriod": "60s", "perSeriesAligner": "ALIGN_MEAN"}]\n    }\n  }],\n  "combiner": "OR",\n  "enabled": true\n}\nEOF`,
              `gcloud alpha monitoring policies create --policy-from-file=alert-policy.json`,
            ],
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // ARCADE BASE CAMP - JULY 2026
  // ──────────────────────────────────────────────────────────────────────────
  {
    badgeTitle: "Arcade Base Camp",
    badgeSlug: "arcade-base-camp",
    badgeUrl: "https://www.skills.google/games/7313",
    description: "July 2026 Arcade Base Camp game labs. Complete the quests to earn the badge.",
    labs: [
      {
        labId: "GSP752",
        labTitle: "Manage Terraform State (Lab 1)",
        labUrl: "https://www.skills.google/games/7313/labs/45037",
        quickScript: {
          description: "Complete solution — paste all 3 commands into Cloud Shell.",
          commands: [
            "curl -LO raw.githubusercontent.com/gcpdecode/Manage-Terraform-State/29a1eb9ecff38efe3120bf3f764c0029733d67f9/gsp752.sh",
            "sudo chmod +x gsp752.sh",
            "./gsp752.sh",
          ],
        },
        variables: [VAR_PROJECT, VAR_REGION],
        steps: [
          {
            title: "Optional: Run manually instead",
            description: "If you prefer to run commands individually:",
            commands: [
              `export PROJECT_ID=$(gcloud config get-value project)`,
              `export REGION="us-east1"   # Replace with your lab region`,
              `export BUCKET="$PROJECT_ID-tf-state"`,
              `gsutil mb -p $PROJECT_ID gs://$BUCKET`,
              `cat > backend.tf << EOF\nterraform {\n  backend "gcs" {\n    bucket = "$BUCKET"\n    prefix = "terraform/state"\n  }\n}\nEOF`,
              `terraform init -migrate-state`,
              `terraform apply -auto-approve`,
            ],
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // IMPLEMENT CLOUD SECURITY FUNDAMENTALS ON GOOGLE CLOUD
  // ──────────────────────────────────────────────────────────────────────────
  {
    badgeTitle: "Implement Cloud Security Fundamentals on Google Cloud",
    badgeSlug: "implement-cloud-security-fundamentals-on-google-cloud",
    badgeUrl: "https://www.cloudskillsboost.google/course_templates/645",
    description: "Labs covering IAM, service accounts, Cloud KMS, and security best practices.",
    labs: [
      {
        labId: "GSP342",
        labTitle: "Implement Cloud Security Fundamentals on Google Cloud: Challenge Lab",
        labUrl: "https://www.cloudskillsboost.google/focuses/10599",
        quickScript: {
          description: "Complete solution for GSP342.",
          commands: [
            "curl -LO raw.githubusercontent.com/gcpdecode/Cloud-Security-Fundamentals/main/gsp342.sh",
            "sudo chmod +x gsp342.sh",
            "./gsp342.sh",
          ],
        },
        variables: [VAR_PROJECT, VAR_REGION],
        steps: [
          {
            title: "Set variables from Lab panel",
            commands: [
              `export PROJECT_ID=$(gcloud config get-value project)`,
              `export REGION="us-east1"`,
              `export SERVICE_ACCOUNT_NAME="orca-private-cluster-sa"`,
              `export CLUSTER_NAME="orca-cluster"`,
              `export SUBNET_NAME="orca-subnet-XXXX"  # From Lab panel`,
            ],
          },
          {
            title: "Create a custom service account",
            commands: [
              `gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME`,
              `gcloud projects add-iam-policy-binding $PROJECT_ID \\`,
              `  --member="serviceAccount:$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com" \\`,
              `  --role="roles/monitoring.viewer"`,
              `gcloud projects add-iam-policy-binding $PROJECT_ID \\`,
              `  --member="serviceAccount:$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com" \\`,
              `  --role="roles/monitoring.metricWriter"`,
              `gcloud projects add-iam-policy-binding $PROJECT_ID \\`,
              `  --member="serviceAccount:$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com" \\`,
              `  --role="roles/logging.logWriter"`,
            ],
          },
          {
            title: "Create private GKE cluster",
            commands: [
              `gcloud container clusters create $CLUSTER_NAME \\`,
              `  --enable-private-nodes --master-ipv4-cidr=172.16.0.16/28 \\`,
              `  --enable-ip-alias --subnetwork=$SUBNET_NAME \\`,
              `  --service-account=$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com \\`,
              `  --zone=$REGION-b`,
            ],
          },
        ],
      },
    ],
  },
];

/**
 * Look up a solution by badge slug.
 */
export function getSolutionBySlug(slug: string): BadgeSolution | undefined {
  return SOLUTIONS.find((s) => s.badgeSlug === slug);
}

/**
 * Check if a solution exists for a badge title.
 */
export function hasSolution(badgeTitle: string): boolean {
  const slug = slugify(badgeTitle);
  return SOLUTIONS.some((s) => s.badgeSlug === slug);
}

/**
 * Get the solution slug for a badge title.
 */
export function getSolutionSlug(badgeTitle: string): string {
  return slugify(badgeTitle);
}

