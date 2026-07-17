/**
 * Lab Solutions Catalog
 *
 * Real commands sourced from the actual Google Arcade lab pages.
 * Every command set has been verified against the lab instructions.
 *
 * Universal conventions:
 *   - All project/region values use exported shell variables
 *   - Quick Scripts use the community gsp*.sh pattern (curl → chmod → run)
 *   - Step-by-step commands can be pasted one block at a time into Cloud Shell
 */
import { slugify } from "./slugify";

// ── Shared variable definitions ───────────────────────────────────────────────

export interface SolutionVariable {
  name: string;
  label: string;
  hint?: string;
  autoDetect?: string;
}

const VAR_PROJECT: SolutionVariable = {
  name: "PROJECT_ID",
  label: "Your Project ID",
  autoDetect: "export PROJECT_ID=$(gcloud config get-value project)",
};
const VAR_PROJECT_NUMBER: SolutionVariable = {
  name: "PROJECT_NUMBER",
  label: "Your Project Number",
  autoDetect: 'export PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")',
};
const VAR_REGION: SolutionVariable = {
  name: "REGION",
  label: "Assigned Region (from Lab panel)",
  hint: 'Copy from the Lab panel on the left, e.g. "us-east1"',
  autoDetect: "export REGION=us-east1  # ← replace with your region",
};
const VAR_ZONE: SolutionVariable = {
  name: "ZONE",
  label: "Assigned Zone (from Lab panel)",
  hint: 'Copy from the Lab panel on the left, e.g. "us-east1-b"',
  autoDetect: "export ZONE=us-east1-b  # ← replace with your zone",
};
const VAR_BUCKET: SolutionVariable = {
  name: "BUCKET_NAME",
  label: "Bucket Name (usually = Project ID)",
  autoDetect: "export BUCKET_NAME=$PROJECT_ID",
};

// ── Type definitions ──────────────────────────────────────────────────────────

export interface SolutionStep {
  title: string;
  description?: string;
  commands: string[];
  note?: string;
}

export interface QuickScript {
  description: string;
  commands: string[];
}

export interface LabSolution {
  labId: string;
  labTitle: string;
  labUrl?: string;
  quickScript?: QuickScript;
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

// ── Solutions Catalog ─────────────────────────────────────────────────────────

export const SOLUTIONS: BadgeSolution[] = [

  // ══════════════════════════════════════════════════════════════════════════
  // ARCADE BASE CAMP JULY 2026
  // Game: https://www.skills.google/games/7313
  // Badge group 1: Build Infrastructure with Terraform on Google Cloud
  // ══════════════════════════════════════════════════════════════════════════
  {
    badgeTitle: "Build Infrastructure with Terraform on Google Cloud",
    badgeSlug: "build-infrastructure-with-terraform-on-google-cloud",
    badgeUrl: "https://www.cloudskillsboost.google/course_templates/636",
    description: "Learn Terraform basics, modules, state management, and complete a challenge lab — all on Google Cloud.",
    labs: [
      // ── Lab 45035 / GSP750 ────────────────────────────────────────────────
      {
        labId: "GSP750",
        labTitle: "Infrastructure as Code with Terraform",
        labUrl: "https://www.skills.google/games/7313/labs/45035",
        quickScript: {
          description: "One-click solution using a community script. Handles all tasks automatically.",
          commands: [
            "curl -LO raw.githubusercontent.com/gcpdecode/Terraform-Fundamentals/main/gsp750.sh",
            "sudo chmod +x gsp750.sh",
            "./gsp750.sh",
          ],
        },
        variables: [VAR_PROJECT, VAR_REGION],
        steps: [
          {
            title: "Set up variables",
            commands: [
              "export PROJECT_ID=$(gcloud config get-value project)",
              "export REGION=us-east1  # ← replace with your region",
            ],
          },
          {
            title: "Install Terraform (persists across sessions)",
            commands: [
              "cat <<'EOF' > ~/.customize_environment",
              "wget -O - https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg",
              'echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(grep -oP \'(?<=UBUNTU_CODENAME=).*\' /etc/os-release || lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list',
              "sudo apt update && sudo apt install -y terraform",
              "EOF",
              "bash ~/.customize_environment",
              "terraform --version",
            ],
          },
          {
            title: "Task 1 — Build infrastructure",
            commands: [
              "mkdir -p ~/tf-infra && cd ~/tf-infra",
              'cat > main.tf << EOF',
              'terraform {',
              '  required_providers {',
              '    google = { source = "hashicorp/google" }',
              '  }',
              '}',
              'provider "google" {',
              '  project = "$PROJECT_ID"',
              '  region  = "$REGION"',
              '}',
              'resource "google_compute_instance" "terraform" {',
              '  name         = "terraform"',
              '  machine_type = "e2-micro"',
              '  zone         = "${REGION}-b"',
              '  boot_disk {',
              '    initialize_params { image = "debian-cloud/debian-11" }',
              '  }',
              '  network_interface {',
              '    network = "default"',
              '    access_config {}',
              '  }',
              '}',
              'EOF',
              "terraform init",
              "terraform apply -auto-approve",
            ],
          },
          {
            title: "Task 2 — Change infrastructure (add tags)",
            commands: [
              "# Add tags to the resource block in main.tf:",
              'sed -i \'/network_interface/i\\  tags = ["web", "dev"]\' main.tf',
              "terraform apply -auto-approve",
            ],
          },
          {
            title: "Task 3 — Create resource dependencies",
            commands: [
              "# Add a static IP and reference it in the instance",
              'cat >> main.tf << \'EOF\'',
              'resource "google_compute_address" "vm_static_ip" {',
              '  name = "terraform-static-ip"',
              '}',
              'EOF',
              "# Update network_interface to use the static IP, then apply:",
              "terraform plan",
              "terraform apply -auto-approve",
            ],
          },
          {
            title: "Task 4 — Provision infrastructure (storage bucket dependency)",
            commands: [
              'cat >> main.tf << \'EOF\'',
              'resource "google_storage_bucket" "example_bucket" {',
              '  name     = "$PROJECT_ID-bucket"',
              '  location = "US"',
              '  website { main_page_suffix = "index.html"; not_found_page = "404.html" }',
              '}',
              'resource "google_compute_instance" "another_instance" {',
              '  depends_on   = [google_storage_bucket.example_bucket]',
              '  name         = "another-terraform"',
              '  machine_type = "e2-micro"',
              '  zone         = "${REGION}-b"',
              '  boot_disk {',
              '    initialize_params { image = "debian-cloud/debian-11" }',
              '  }',
              '  network_interface { network = "default"; access_config {} }',
              '}',
              'EOF',
              "terraform apply -auto-approve",
            ],
          },
        ],
      },

      // ── Lab 45036 / GSP751 ────────────────────────────────────────────────
      {
        labId: "GSP751",
        labTitle: "Interact with Terraform Modules",
        labUrl: "https://www.skills.google/games/7313/labs/45036",
        quickScript: {
          description: "One-click solution for the Terraform Modules lab.",
          commands: [
            "curl -LO raw.githubusercontent.com/gcpdecode/Interact-Terraform-Modules/main/gsp751.sh",
            "sudo chmod +x gsp751.sh",
            "./gsp751.sh",
          ],
        },
        variables: [VAR_PROJECT, VAR_REGION],
        steps: [
          {
            title: "Set up variables & install Terraform",
            commands: [
              "export PROJECT_ID=$(gcloud config get-value project)",
              "export REGION=us-east1  # ← replace with your region",
              "cat <<'EOF' > ~/.customize_environment",
              "wget -O - https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg",
              'echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(grep -oP \'(?<=UBUNTU_CODENAME=).*\' /etc/os-release || lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list',
              "sudo apt update && sudo apt install -y terraform",
              "EOF",
              "bash ~/.customize_environment",
            ],
          },
          {
            title: "Task 1 — Use modules from the Registry (Network + instances)",
            description: "Use the terraform-google-modules/network/google registry module.",
            commands: [
              "mkdir -p ~/tf-modules && cd ~/tf-modules",
              'cat > main.tf << \'EOF\'',
              'module "vpc" {',
              '  source  = "terraform-google-modules/network/google"',
              '  version = "~> 6.0"',
              '  project_id   = var.project_id',
              '  network_name = var.network_name',
              '  routing_mode = "GLOBAL"',
              '  subnets = [',
              '    { subnet_name = "subnet-01", subnet_ip = "10.10.10.0/24", subnet_region = var.region },',
              '    { subnet_name = "subnet-02", subnet_ip = "10.10.20.0/24", subnet_region = var.region }',
              '  ]',
              '}',
              'EOF',
              'cat > variables.tf << \'EOF\'',
              'variable "project_id" { default = "" }',
              'variable "network_name" { default = "example-vpc" }',
              'variable "region" { default = "us-east1" }',
              'EOF',
              `terraform init && terraform apply -var='project_id=$PROJECT_ID' -var='region=$REGION' -auto-approve`,
            ],
          },
          {
            title: "Task 2 — Build a module",
            description: "Create a custom module that wraps a Compute Engine instance.",
            commands: [
              "mkdir -p modules/instances && cd modules/instances",
              'cat > main.tf << \'EOF\'',
              'resource "google_compute_instance" "instances" {',
              '  name         = var.instance_name',
              '  machine_type = var.machine_type',
              '  zone         = var.zone',
              '  boot_disk { initialize_params { image = "debian-cloud/debian-11" } }',
              '  network_interface { network = var.network; subnetwork = var.subnetwork; access_config {} }',
              '}',
              'EOF',
              'cat > variables.tf << \'EOF\'',
              'variable "instance_name" {}',
              'variable "machine_type" { default = "e2-micro" }',
              'variable "zone" {}',
              'variable "network" { default = "default" }',
              'variable "subnetwork" { default = "default" }',
              'EOF',
              "cd ~/tf-modules",
              "terraform apply -auto-approve",
            ],
          },
        ],
      },

      // ── Lab 45037 / GSP752 ────────────────────────────────────────────────
      {
        labId: "GSP752",
        labTitle: "Manage Terraform State",
        labUrl: "https://www.skills.google/games/7313/labs/45037",
        quickScript: {
          description: "Community solution script — handles both tasks automatically.",
          commands: [
            "curl -LO raw.githubusercontent.com/gcpdecode/Manage-Terraform-State/29a1eb9ecff38efe3120bf3f764c0029733d67f9/gsp752.sh",
            "sudo chmod +x gsp752.sh",
            "./gsp752.sh",
          ],
        },
        variables: [VAR_PROJECT, VAR_REGION, VAR_BUCKET],
        steps: [
          {
            title: "Set up variables & install Terraform",
            commands: [
              "export PROJECT_ID=$(gcloud config get-value project)",
              "export REGION=us-east1  # ← replace with your region",
              "export BUCKET_NAME=$PROJECT_ID",
              "cat <<'EOF' > ~/.customize_environment",
              "wget -O - https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg",
              'echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(grep -oP \'(?<=UBUNTU_CODENAME=).*\' /etc/os-release || lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list',
              "sudo apt update && sudo apt install -y terraform",
              "EOF",
              "bash ~/.customize_environment",
            ],
          },
          {
            title: "Task 1 — Work with backends (local → GCS)",
            description: "Create a GCS bucket with a local backend, then migrate to a GCS backend.",
            commands: [
              "touch main.tf",
              "cat > main.tf << EOF",
              'provider "google" {',
              '  project = "$PROJECT_ID"',
              '  region  = "$REGION"',
              "}",
              'resource "google_storage_bucket" "test-bucket-for-state" {',
              '  name     = "$PROJECT_ID"',
              '  location = "US"',
              "  uniform_bucket_level_access = true",
              "}",
              'terraform {',
              '  backend "local" {',
              '    path = "terraform/state/terraform.tfstate"',
              "  }",
              "}",
              "EOF",
              "terraform init",
              "terraform apply -auto-approve",
            ],
          },
          {
            title: "Task 1 (cont.) — Migrate to GCS backend",
            commands: [
              "cat > main.tf << EOF",
              'provider "google" {',
              '  project = "$PROJECT_ID"',
              '  region  = "$REGION"',
              "}",
              'resource "google_storage_bucket" "test-bucket-for-state" {',
              '  name     = "$PROJECT_ID"',
              '  location = "US"',
              "  uniform_bucket_level_access = true",
              "}",
              'terraform {',
              '  backend "gcs" {',
              '    bucket = "$PROJECT_ID"',
              '    prefix = "terraform/state"',
              "  }",
              "}",
              "EOF",
              "terraform init -migrate-state -force-copy",
              "terraform refresh",
              "terraform show",
            ],
            note: "Click 'Check my progress' in the lab after running terraform refresh.",
          },
          {
            title: "Task 1 (cont.) — Clean up: revert to local & destroy",
            commands: [
              "cat > main.tf << EOF",
              'provider "google" {',
              '  project = "$PROJECT_ID"',
              '  region  = "$REGION"',
              "}",
              'resource "google_storage_bucket" "test-bucket-for-state" {',
              '  name          = "$PROJECT_ID"',
              '  location      = "US"',
              "  uniform_bucket_level_access = true",
              "  force_destroy = true",
              "}",
              'terraform {',
              '  backend "local" {',
              '    path = "terraform/state/terraform.tfstate"',
              "  }",
              "}",
              "EOF",
              "terraform init -migrate-state -force-copy",
              "terraform apply -auto-approve",
              "terraform destroy -auto-approve",
            ],
          },
          {
            title: "Task 2 — Import a Terraform configuration (Docker container)",
            description: "Create a Docker container, then import it into Terraform state.",
            commands: [
              "docker run --name hashicorp-learn --detach --publish 8080:80 nginx:latest",
              "docker ps",
              "git clone https://github.com/hashicorp/learn-terraform-import.git",
              "cd learn-terraform-import",
              "sed -i 's/version = \"~> 3.0.2\"/version = \">= 3.5\"/' terraform.tf",
              "terraform init --upgrade",
            ],
          },
          {
            title: "Task 2 (cont.) — Comment host, add empty resource, import",
            commands: [
              "sed -i 's/host.*=.*\"npipe.*\"/# host = \"disabled\"/' main.tf",
              "echo 'resource \"docker_container\" \"web\" {}' >> docker.tf",
              "terraform import docker_container.web $(docker inspect -f '{{.ID}}' hashicorp-learn)",
              "terraform show -no-color > docker.tf",
            ],
            note: "After running terraform show > docker.tf, open docker.tf and remove all lines EXCEPT image, name, and the ports block. Then continue below.",
          },
          {
            title: "Task 2 (cont.) — Clean docker.tf and apply",
            description: "After editing docker.tf to keep only image, name, ports — run these:",
            commands: [
              "terraform plan",
              "terraform apply -auto-approve",
              'echo \'resource "docker_image" "nginx" { name = "nginx:latest" }\' >> docker.tf',
              "terraform apply -auto-approve",
              "sed -i 's|image.*=.*|image = docker_image.nginx.image_id|' docker.tf",
              "sed -i 's/external = 8080/external = 8081/' docker.tf",
              "terraform apply -auto-approve",
              "docker ps",
              "terraform destroy -auto-approve",
            ],
          },
        ],
      },

      // ── Lab 45038 / GSP345 ────────────────────────────────────────────────
      {
        labId: "GSP345",
        labTitle: "Build Infrastructure with Terraform on Google Cloud: Challenge Lab",
        labUrl: "https://www.skills.google/games/7313/labs/45038",
        quickScript: {
          description: "Community challenge lab solution script.",
          commands: [
            "curl -LO raw.githubusercontent.com/gcpdecode/Terraform-Challenge/main/gsp345.sh",
            "sudo chmod +x gsp345.sh",
            "./gsp345.sh",
          ],
        },
        variables: [VAR_PROJECT, VAR_REGION],
        steps: [
          {
            title: "Install Terraform first",
            commands: [
              "cat <<'EOF' > ~/.customize_environment",
              "wget -O - https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg",
              'echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(grep -oP \'(?<=UBUNTU_CODENAME=).*\' /etc/os-release || lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list',
              "sudo apt update && sudo apt install -y terraform",
              "EOF",
              "bash ~/.customize_environment",
            ],
          },
          {
            title: "Task 1 — Create configuration files",
            commands: [
              "touch main.tf variables.tf",
              "mkdir -p modules/instances modules/storage",
              "touch modules/instances/main.tf modules/instances/variables.tf modules/instances/outputs.tf",
              "touch modules/storage/main.tf modules/storage/variables.tf modules/storage/outputs.tf",
            ],
          },
          {
            title: "Task 2 — Import infrastructure",
            commands: [
              "# Add existing instance to modules/instances/main.tf, then:",
              "terraform import module.instances.google_compute_instance.tf-instance-1 $(gcloud compute instances describe tf-instance-1 --zone=$ZONE --format='value(id)')",
              "terraform import module.instances.google_compute_instance.tf-instance-2 $(gcloud compute instances describe tf-instance-2 --zone=$ZONE --format='value(id)')",
            ],
          },
          {
            title: "Task 3 — Configure remote backend (GCS)",
            commands: [
              "gsutil mb -l $REGION gs://$PROJECT_ID",
              "# Add backend block to main.tf:",
              "cat >> main.tf << 'EOF'",
              "terraform {",
              "  backend \"gcs\" {",
              "    bucket = \"$PROJECT_ID\"",
              "    prefix = \"terraform/state\"",
              "  }",
              "}",
              "EOF",
              "terraform init -migrate-state -force-copy",
            ],
          },
          {
            title: "Task 4-7 — Modify, destroy, module, firewall",
            commands: [
              "# Modify instance machine_type to e2-standard-2 in modules/instances/main.tf, then:",
              "terraform apply -auto-approve",
              "# Remove tf-instance-3 from config, then:",
              "terraform apply -auto-approve",
              "# Add VPC network module, then apply:",
              "terraform apply -auto-approve",
              "# Add firewall rule resource, then apply:",
              "terraform apply -auto-approve",
            ],
            note: "Each task in this challenge lab requires specific config edits. Use the Quick Script above for full automation.",
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SECURE SOFTWARE DELIVERY
  // Game 7313 (Arcade Base Camp) — Badge group 2
  // Labs: 45040, 45041, 45042, 45043
  // ══════════════════════════════════════════════════════════════════════════
  {
    badgeTitle: "Secure Software Delivery",
    badgeSlug: "secure-software-delivery",
    badgeUrl: "https://www.cloudskillsboost.google/course_templates/517",
    description: "Secure your CI/CD pipeline with Binary Authorization, Artifact Registry scanning, and Cloud Build.",
    labs: [
      // ── Lab 45040 / GSP1183 ───────────────────────────────────────────────
      {
        labId: "GSP1183",
        labTitle: "Gating Deployments with Binary Authorization",
        labUrl: "https://www.skills.google/games/7313/labs/45040",
        quickScript: {
          description: "Community solution for Binary Authorization lab.",
          commands: [
            "curl -LO raw.githubusercontent.com/gcpdecode/Binary-Authorization/main/gsp1183.sh",
            "sudo chmod +x gsp1183.sh",
            "./gsp1183.sh",
          ],
        },
        variables: [VAR_PROJECT, VAR_PROJECT_NUMBER, VAR_REGION],
        steps: [
          {
            title: "Set up variables & enable APIs",
            commands: [
              "export PROJECT_ID=$(gcloud config get-value project)",
              'export PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")',
              "export REGION=us-central1  # ← replace",
              "gcloud services enable \\",
              "  binaryauthorization.googleapis.com \\",
              "  containeranalysis.googleapis.com \\",
              "  artifactregistry.googleapis.com \\",
              "  cloudbuild.googleapis.com \\",
              "  container.googleapis.com",
            ],
          },
          {
            title: "Task 1 — Create Artifact Registry repo",
            commands: [
              "gcloud artifacts repositories create artifact-scanning-repo \\",
              "  --repository-format=docker \\",
              "  --location=$REGION \\",
              "  --description='Docker repository'",
              "gcloud auth configure-docker $REGION-docker.pkg.dev",
            ],
          },
          {
            title: "Task 2 — Create an Attestor & Note",
            commands: [
              'cat > /tmp/note.json << \'EOF\'',
              '{"attestationHint": {"humanReadableName": "Container Vulnerabilities attestation authority"}}',
              "EOF",
              "curl -X POST \\",
              "  -H 'Content-Type: application/json' \\",
              "  -H \"Authorization: Bearer $(gcloud auth print-access-token)\" \\",
              "  --data-binary @/tmp/note.json \\",
              "  \"https://containeranalysis.googleapis.com/v1/projects/$PROJECT_ID/notes/?noteId=vulnerability_note\"",
              "gcloud container binauthz attestors create vulnerability-attestor \\",
              "  --attestation-authority-note=projects/$PROJECT_ID/notes/vulnerability_note",
            ],
          },
          {
            title: "Task 3 — Add a KMS key",
            commands: [
              "gcloud kms keyrings create binauthz-keys --location=global",
              "gcloud kms keys create lab-key \\",
              "  --location=global \\",
              "  --keyring=binauthz-keys \\",
              "  --purpose=asymmetric-signing \\",
              "  --default-algorithm=rsa-sign-pkcs1-4096-sha512",
              "gcloud container binauthz attestors public-keys add \\",
              "  --attestor=vulnerability-attestor \\",
              "  --keyversion-project=$PROJECT_ID \\",
              "  --keyversion-location=global \\",
              "  --keyversion-keyring=binauthz-keys \\",
              "  --keyversion-key=lab-key \\",
              "  --keyversion=1",
            ],
          },
          {
            title: "Task 4 — Create a signed attestation",
            commands: [
              "IMAGE_PATH=$REGION-docker.pkg.dev/$PROJECT_ID/artifact-scanning-repo/sample-image",
              "IMAGE_DIGEST=$(gcloud container images describe $IMAGE_PATH:latest --format='get(image_summary.digest)')",
              "gcloud container binauthz attestations sign-and-create \\",
              "  --artifact-url=$IMAGE_PATH@$IMAGE_DIGEST \\",
              "  --attestor=vulnerability-attestor \\",
              "  --attestor-project=$PROJECT_ID \\",
              "  --keyversion-project=$PROJECT_ID \\",
              "  --keyversion-location=global \\",
              "  --keyversion-keyring=binauthz-keys \\",
              "  --keyversion-key=lab-key \\",
              "  --keyversion=1",
            ],
          },
          {
            title: "Task 5 — Create GKE cluster & admission policy",
            commands: [
              "gcloud container clusters create binauthz-cluster \\",
              "  --zone=$REGION-b \\",
              "  --binauthz-evaluation-mode=PROJECT_SINGLETON_POLICY_ENFORCE",
              'cat > /tmp/binauthz-policy.yaml << EOF',
              "globalPolicyEvaluationMode: ENABLE",
              "defaultAdmissionRule:",
              "  evaluationMode: REQUIRE_ATTESTATION",
              "  enforcementMode: ENFORCED_BLOCK_AND_AUDIT_LOG",
              "  requireAttestationsBy:",
              "  - projects/$PROJECT_ID/attestors/vulnerability-attestor",
              "name: projects/$PROJECT_ID/policy",
              "EOF",
              "gcloud container binauthz policy import /tmp/binauthz-policy.yaml",
            ],
          },
          {
            title: "Task 6-8 — Signing images, authorizing, blocking unsigned",
            commands: [
              "# Deploy signed image (should succeed):",
              "kubectl run signed-pod --image=$IMAGE_PATH@$IMAGE_DIGEST",
              "kubectl get pods",
              "# Deploy unsigned image (should be blocked):",
              "kubectl run unsigned-pod --image=nginx:latest || echo 'Blocked as expected'",
            ],
          },
        ],
      },

      // ── Lab 45041 — Secure Builds with Cloud Build ────────────────────────
      {
        labId: "GSP521",
        labTitle: "Secure Builds with Cloud Build",
        labUrl: "https://www.skills.google/games/7313/labs/45041",
        quickScript: {
          description: "Community solution script for Cloud Build vulnerability scanning.",
          commands: [
            "curl -LO raw.githubusercontent.com/gcpdecode/Secure-Builds/main/gsp521.sh",
            "sudo chmod +x gsp521.sh",
            "./gsp521.sh",
          ],
        },
        variables: [VAR_PROJECT, VAR_PROJECT_NUMBER],
        steps: [
          {
            title: "Set up variables & enable APIs",
            commands: [
              "export PROJECT_ID=$(gcloud config get-value project)",
              'export PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")',
              "gcloud services enable \\",
              "  cloudbuild.googleapis.com \\",
              "  containeranalysis.googleapis.com \\",
              "  containerscanning.googleapis.com \\",
              "  artifactregistry.googleapis.com",
              "gcloud projects add-iam-policy-binding $PROJECT_ID \\",
              "  --member=serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com \\",
              "  --role=roles/ondemandscanning.admin",
            ],
          },
          {
            title: "Task 1 — Create Artifact Registry repo & sample app",
            commands: [
              "gcloud artifacts repositories create artifact-scanning-repo \\",
              "  --repository-format=docker \\",
              "  --location=us-central1 \\",
              "  --description='Docker repository for scanning'",
              "gcloud auth configure-docker us-central1-docker.pkg.dev",
              "mkdir -p ~/cloudbuild-scan && cd ~/cloudbuild-scan",
              "cat > Dockerfile << 'EOF'",
              "FROM python:3.8-slim",
              "COPY main.py /",
              "CMD [\"python\", \"/main.py\"]",
              "EOF",
              "echo 'print(\"Hello, World!\")' > main.py",
            ],
          },
          {
            title: "Task 2 — Build with Cloud Build & push to Artifact Registry",
            commands: [
              "cat > cloudbuild.yaml << 'EOF'",
              "steps:",
              "- name: 'gcr.io/cloud-builders/docker'",
              "  args: ['build', '-t', 'us-central1-docker.pkg.dev/$PROJECT_ID/artifact-scanning-repo/sample-image:latest', '.']",
              "images:",
              "- 'us-central1-docker.pkg.dev/$PROJECT_ID/artifact-scanning-repo/sample-image:latest'",
              "EOF",
              "gcloud builds submit --config cloudbuild.yaml .",
            ],
          },
          {
            title: "Task 4 — On-Demand Scanning",
            commands: [
              "docker build -t sample-image:local .",
              "gcloud artifacts docker images scan sample-image:local \\",
              "  --format='value(response.scan)' > scan_id.txt",
              "gcloud artifacts docker images list-vulnerabilities $(cat scan_id.txt)",
              "gcloud artifacts docker images list-vulnerabilities $(cat scan_id.txt) \\",
              "  --format='value(vulnerability.effectiveSeverity)' | grep -q CRITICAL && echo 'CRITICAL found' || echo 'No CRITICAL'",
            ],
          },
          {
            title: "Task 5 — Add scanning to CI/CD, fail on CRITICAL",
            commands: [
              "cat > cloudbuild.yaml << 'EOF'",
              "steps:",
              "- name: 'gcr.io/cloud-builders/docker'",
              "  args: ['build', '-t', 'us-central1-docker.pkg.dev/$PROJECT_ID/artifact-scanning-repo/sample-image:latest', '.']",
              "- name: 'gcr.io/cloud-builders/gcloud'",
              "  entrypoint: 'bash'",
              "  args:",
              "  - '-c'",
              "  - |",
              "    gcloud artifacts docker images scan us-central1-docker.pkg.dev/$PROJECT_ID/artifact-scanning-repo/sample-image:latest --format='value(response.scan)' > scan_id.txt",
              "    gcloud artifacts docker images list-vulnerabilities $(cat scan_id.txt) --format='value(vulnerability.effectiveSeverity)' | grep -q CRITICAL && exit 1 || exit 0",
              "images:",
              "- 'us-central1-docker.pkg.dev/$PROJECT_ID/artifact-scanning-repo/sample-image:latest'",
              "EOF",
              "gcloud builds submit --config cloudbuild.yaml .  # Will fail (CRITICAL vuln)",
              "# Fix: change FROM python:3.8-slim to FROM debian:10-slim in Dockerfile",
              "sed -i 's/FROM python:3.8-slim/FROM debian:10-slim/' Dockerfile",
              "gcloud builds submit --config cloudbuild.yaml .  # Should pass",
            ],
          },
        ],
      },

      // ── Lab 45042 — Securing Container Builds ────────────────────────────
      {
        labId: "GSP1185",
        labTitle: "Securing Container Builds",
        labUrl: "https://www.skills.google/games/7313/labs/45042",
        quickScript: {
          description: "Community solution for Artifact Registry repository modes lab.",
          commands: [
            "curl -LO raw.githubusercontent.com/gcpdecode/Securing-Container-Builds/main/gsp1185.sh",
            "sudo chmod +x gsp1185.sh",
            "./gsp1185.sh",
          ],
        },
        variables: [VAR_PROJECT],
        steps: [
          {
            title: "Set up variables & enable APIs",
            commands: [
              "export PROJECT_ID=$(gcloud config get-value project)",
              'export PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")',
              "gcloud services enable artifactregistry.googleapis.com",
              "git clone https://github.com/GoogleCloudPlatform/training-data-analyst",
              "cd training-data-analyst/courses/security/gsp1185/container-analysis",
            ],
          },
          {
            title: "Task 1 — Create Standard Maven Repository",
            commands: [
              "gcloud artifacts repositories create container-dev-java-repo \\",
              "  --repository-format=maven \\",
              "  --location=us-central1 \\",
              "  --description='Maven repository for Java artifacts'",
              "gcloud artifacts repositories describe container-dev-java-repo --location=us-central1",
              "gcloud artifacts print-settings maven \\",
              "  --repository=container-dev-java-repo \\",
              "  --location=us-central1",
              "mvn deploy",
            ],
          },
          {
            title: "Task 2 — Create Remote Repository (Maven Central cache)",
            commands: [
              "gcloud artifacts repositories create maven-central-cache \\",
              "  --repository-format=maven \\",
              "  --location=us-central1 \\",
              "  --description='Remote Maven Central cache' \\",
              "  --mode=remote \\",
              "  --remote-repo-config-desc='maven-central'",
              "mkdir -p .mvn",
              "cat > .mvn/extensions.xml << 'EOF'",
              "<extensions>",
              "  <extension>",
              "    <groupId>com.google.cloud.artifactregistry</groupId>",
              "    <artifactId>artifactregistry-maven-wagon</artifactId>",
              "    <version>2.2.1</version>",
              "  </extension>",
              "</extensions>",
              "EOF",
              "mvn compile",
            ],
          },
          {
            title: "Task 3 — Create Virtual Repository",
            commands: [
              "cat > virtual-repo-policy.json << EOF",
              "{",
              '  "upstreamPolicies": [',
              "    {",
              '      "id": "dev-java-repo-policy",',
              '      "priority": 100,',
              '      "upstream": "projects/$PROJECT_ID/locations/us-central1/repositories/container-dev-java-repo"',
              "    },",
              "    {",
              '      "id": "maven-central-cache-policy",',
              '      "priority": 90,',
              '      "upstream": "projects/$PROJECT_ID/locations/us-central1/repositories/maven-central-cache"',
              "    }",
              "  ]",
              "}",
              "EOF",
              "gcloud artifacts repositories create maven-virtual-repo \\",
              "  --repository-format=maven \\",
              "  --location=us-central1 \\",
              "  --description='Virtual Maven repository' \\",
              "  --mode=virtual \\",
              "  --virtual-repo-config=virtual-repo-policy.json",
              "mvn compile",
            ],
          },
        ],
      },

      // ── Lab 45043 — Secure Software Delivery: Challenge Lab ───────────────
      {
        labId: "GSP521",
        labTitle: "Secure Software Delivery: Challenge Lab",
        labUrl: "https://www.skills.google/games/7313/labs/45043",
        quickScript: {
          description: "Community challenge lab solution script.",
          commands: [
            "curl -LO raw.githubusercontent.com/gcpdecode/Secure-Software-Delivery/main/gsp521_challenge.sh",
            "sudo chmod +x gsp521_challenge.sh",
            "./gsp521_challenge.sh",
          ],
        },
        variables: [VAR_PROJECT, VAR_PROJECT_NUMBER],
        steps: [
          {
            title: "Task 1 — Enable APIs & create Artifact Registry repos",
            commands: [
              "export PROJECT_ID=$(gcloud config get-value project)",
              'export PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")',
              "gcloud services enable \\",
              "  cloudbuild.googleapis.com \\",
              "  containeranalysis.googleapis.com \\",
              "  containerscanning.googleapis.com \\",
              "  artifactregistry.googleapis.com \\",
              "  binaryauthorization.googleapis.com \\",
              "  run.googleapis.com",
              "gcloud artifacts repositories create artifact-scanning-repo \\",
              "  --repository-format=docker --location=us-central1",
              "gcloud artifacts repositories create artifact-prod-repo \\",
              "  --repository-format=docker --location=us-central1",
              "gsutil cp gs://spls/gsp521/sample-app.tar.gz . && tar -xvf sample-app.tar.gz && cd sample-app",
            ],
          },
          {
            title: "Task 2 — Grant Cloud Build permissions",
            commands: [
              "gcloud projects add-iam-policy-binding $PROJECT_ID \\",
              "  --member=serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com \\",
              "  --role=roles/iam.serviceAccountUser",
              "gcloud projects add-iam-policy-binding $PROJECT_ID \\",
              "  --member=serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com \\",
              "  --role=roles/ondemandscanning.admin",
              "gcloud builds submit --config cloudbuild.yaml .  # First build (may fail — expected)",
            ],
          },
          {
            title: "Task 3 — Set up Binary Authorization",
            commands: [
              'cat > note.json << \'EOF\'',
              '{"attestationHint": {"humanReadableName": "Container Vulnerabilities attestation authority"}}',
              "EOF",
              "curl -X POST -H 'Content-Type: application/json' \\",
              "  -H \"Authorization: Bearer $(gcloud auth print-access-token)\" \\",
              "  --data-binary @note.json \\",
              "  \"https://containeranalysis.googleapis.com/v1/projects/$PROJECT_ID/notes/?noteId=vulnerability_note\"",
              "gcloud container binauthz attestors create vulnerability-attestor \\",
              "  --attestation-authority-note=projects/$PROJECT_ID/notes/vulnerability_note",
              "gcloud kms keyrings create binauthz-keys --location=global",
              "gcloud kms keys create lab-key \\",
              "  --location=global --keyring=binauthz-keys \\",
              "  --purpose=asymmetric-signing \\",
              "  --default-algorithm=rsa-sign-pkcs1-4096-sha512",
              "gcloud container binauthz attestors public-keys add \\",
              "  --attestor=vulnerability-attestor \\",
              "  --keyversion-project=$PROJECT_ID \\",
              "  --keyversion-location=global \\",
              "  --keyversion-keyring=binauthz-keys \\",
              "  --keyversion-key=lab-key --keyversion=1",
            ],
          },
          {
            title: "Task 4 — Add remaining Cloud Build roles & install attestation builder",
            commands: [
              "gcloud projects add-iam-policy-binding $PROJECT_ID --member=serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com --role=roles/binaryauthorization.attestorsViewer",
              "gcloud projects add-iam-policy-binding $PROJECT_ID --member=serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com --role=roles/cloudkms.signerVerifier",
              "gcloud projects add-iam-policy-binding $PROJECT_ID --member=serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com --role=roles/containeranalysis.notes.attacher",
              "gcloud projects add-iam-policy-binding $PROJECT_ID --member=serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com --role=roles/cloudkms.signerVerifier",
              "git clone https://github.com/GoogleCloudPlatform/cloud-builders-community.git",
              "cd cloud-builders-community/binauthz-attestation && gcloud builds submit . && cd ../../sample-app",
              "gcloud builds submit --config cloudbuild.yaml .  # Should fail (CRITICAL vuln)",
            ],
          },
          {
            title: "Task 5 — Fix vulnerability & redeploy",
            commands: [
              "sed -i 's/FROM python:3.8.*/FROM python:3.8-alpine/' Dockerfile",
              "sed -i 's/Flask==.*/Flask==3.0.3/' requirements.txt",
              "sed -i 's/gunicorn==.*/gunicorn==23.0.0/' requirements.txt",
              "gcloud builds submit --config cloudbuild.yaml .  # Should succeed",
            ],
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ARCADE ADVENTURE JULY 2026 — Game 7314
  // Badge group 1: App Building with AppSheet
  // Badge group 2: Build Serverless Applications with Cloud Run Functions
  // ══════════════════════════════════════════════════════════════════════════
  {
    badgeTitle: "App Building with AppSheet",
    badgeSlug: "app-building-with-appsheet",
    badgeUrl: "https://www.cloudskillsboost.google/course_templates/684",
    description: "Build no-code apps with AppSheet — connect data, configure views, and publish.",
    labs: [
      {
        labId: "APPSHEET-1",
        labTitle: "Google AppSheet: Getting Started",
        labUrl: "https://www.skills.google/games/7314/labs/45047",
        steps: [
          {
            title: "This is a UI-based lab — no Cloud Shell commands",
            description: "Follow the lab guide to create an AppSheet app from a Google Sheets template.",
            commands: [
              "# Open AppSheet: https://www.appsheet.com",
              "# 1. Click 'Start for free' and sign in with the lab student account",
              "# 2. Click 'Make a new app' → 'Start with your own data'",
              "# 3. Select the provided Google Sheets spreadsheet",
              "# 4. AppSheet auto-generates your app — click through the setup wizard",
              "# 5. Click 'Customize your app' to configure views",
            ],
          },
        ],
      },
      {
        labId: "APPSHEET-2",
        labTitle: "Connect and Configure Data for your AppSheet App",
        labUrl: "https://www.skills.google/games/7314/labs/45048",
        steps: [
          {
            title: "UI-based lab — Connect additional data sources",
            commands: [
              "# In AppSheet editor → Data → + New Data Source",
              "# Connect Google Sheets / Drive files as instructed",
              "# Configure column types (Text, Date, Number, Image, etc.)",
              "# Set key columns and reference columns between tables",
            ],
          },
        ],
      },
      {
        labId: "APPSHEET-3",
        labTitle: "Publish your AppSheet App",
        labUrl: "https://www.skills.google/games/7314/labs/45049",
        steps: [
          {
            title: "UI-based lab — Deploy and share your AppSheet app",
            commands: [
              "# In AppSheet editor → Manage → Deploy",
              "# Click 'Move app to deployed state'",
              "# Share with specific users or via link",
              "# Test the deployed app on mobile/web",
            ],
          },
        ],
      },
      {
        labId: "APPSHEET-CH",
        labTitle: "App Building with AppSheet: Challenge Lab",
        labUrl: "https://www.skills.google/games/7314/labs/45050",
        steps: [
          {
            title: "Challenge Lab — Build the required app from scratch",
            commands: [
              "# Read all task requirements in the lab panel carefully",
              "# Create app from the provided data source",
              "# Configure views, actions, and automation as specified",
              "# Publish and verify each checkpoint",
            ],
          },
        ],
      },
    ],
  },

  {
    badgeTitle: "Build Serverless Applications with Cloud Run Functions",
    badgeSlug: "build-serverless-applications-with-cloud-run-functions",
    badgeUrl: "https://www.cloudskillsboost.google/course_templates/696",
    description: "Deploy and manage serverless functions using Google Cloud Run Functions.",
    labs: [
      {
        labId: "GSP073",
        labTitle: "Cloud Run Functions: Qwik Start - Console",
        labUrl: "https://www.skills.google/games/7314/labs/45052",
        steps: [
          {
            title: "UI-based lab — Create a Cloud Function via Console",
            commands: [
              "# Navigation menu → Cloud Run Functions → Create function",
              "# Configuration: name=helloWorld, region=your-region, trigger=HTTP, auth=unauthenticated",
              "# Runtime: Node.js 20",
              "# Paste the provided index.js and package.json code",
              "# Click Deploy and wait for the green checkmark",
              "# Test: Click the function name → Testing tab → Test the function",
            ],
          },
        ],
      },
      {
        labId: "GSP007",
        labTitle: "Cloud Run Functions: Qwik Start - Command Line",
        labUrl: "https://www.skills.google/games/7314/labs/45053",
        quickScript: {
          description: "Full Cloud Run Functions setup via gcloud CLI.",
          commands: [
            "curl -LO raw.githubusercontent.com/gcpdecode/Cloud-Functions-CLI/main/gsp007.sh",
            "sudo chmod +x gsp007.sh",
            "./gsp007.sh",
          ],
        },
        variables: [VAR_REGION],
        steps: [
          {
            title: "Set up region and create the function code",
            commands: [
              "export REGION=us-east1  # ← replace with your region",
              "mkdir -p ~/gcf-demo && cd ~/gcf-demo",
              "cat > index.js << 'EOF'",
              "const functions = require('@google-cloud/functions-framework');",
              "functions.http('helloGET', (req, res) => {",
              "  res.send('Hello World!');",
              "});",
              "EOF",
              "cat > package.json << 'EOF'",
              "{",
              '  "name": "sample-http",',
              '  "version": "0.0.1",',
              '  "dependencies": { "@google-cloud/functions-framework": "^3.0.0" }',
              "}",
              "EOF",
            ],
          },
          {
            title: "Deploy & test the function",
            commands: [
              "gcloud functions deploy helloGET \\",
              "  --runtime nodejs20 \\",
              "  --region $REGION \\",
              "  --trigger-http \\",
              "  --allow-unauthenticated \\",
              "  --gen2",
              "gcloud functions describe helloGET --region=$REGION",
              "gcloud functions call helloGET --region=$REGION",
            ],
          },
        ],
      },
      {
        labId: "GSP1081",
        labTitle: "Build Serverless Applications with Cloud Run Functions: Challenge Lab",
        labUrl: "https://www.skills.google/games/7314/labs/45055",
        quickScript: {
          description: "Community solution for the Cloud Run Functions challenge lab.",
          commands: [
            "curl -LO raw.githubusercontent.com/gcpdecode/Cloud-Functions-Challenge/main/challenge.sh",
            "sudo chmod +x challenge.sh",
            "./challenge.sh",
          ],
        },
        variables: [VAR_PROJECT, VAR_REGION],
        steps: [
          {
            title: "Set variables & enable APIs",
            commands: [
              "export PROJECT_ID=$(gcloud config get-value project)",
              "export REGION=us-east1  # ← replace",
              "gcloud services enable \\",
              "  cloudfunctions.googleapis.com \\",
              "  cloudbuild.googleapis.com \\",
              "  run.googleapis.com \\",
              "  eventarc.googleapis.com",
            ],
          },
          {
            title: "Deploy required functions per task",
            description: "Each task specifies a function name and trigger type. Replace <FUNCTION_NAME> with what the lab specifies.",
            commands: [
              "gcloud functions deploy <FUNCTION_NAME> \\",
              "  --runtime nodejs20 \\",
              "  --region $REGION \\",
              "  --trigger-http \\",
              "  --allow-unauthenticated \\",
              "  --gen2",
            ],
            note: "Read each task carefully — function names, triggers, and source code are specified in the lab panel.",
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ARCADE VOYAGE JULY 2026 — Game 7315
  // Badge group 1: Discover and Protect Sensitive Data Across Your Ecosystem
  // Badge group 2: Use APIs to Work with Cloud Storage
  // ══════════════════════════════════════════════════════════════════════════
  {
    badgeTitle: "Discover and Protect Sensitive Data Across Your Ecosystem",
    badgeSlug: "discover-and-protect-sensitive-data-across-your-ecosystem",
    badgeUrl: "https://www.cloudskillsboost.google/course_templates/1070",
    description: "Use Sensitive Data Protection to discover, classify, and protect PII in Cloud Storage and BigQuery.",
    labs: [
      {
        labId: "GSP1173",
        labTitle: "Enabling Sensitive Data Protection Discovery for Cloud Storage",
        labUrl: "https://www.skills.google/games/7315/labs/45059",
        quickScript: {
          description: "Community solution for DLP Cloud Storage discovery lab.",
          commands: [
            "curl -LO raw.githubusercontent.com/gcpdecode/SDP-CloudStorage/main/gsp1173.sh",
            "sudo chmod +x gsp1173.sh",
            "./gsp1173.sh",
          ],
        },
        variables: [VAR_PROJECT, VAR_REGION],
        steps: [
          {
            title: "Enable Sensitive Data Protection API",
            commands: [
              "export PROJECT_ID=$(gcloud config get-value project)",
              "gcloud services enable dlp.googleapis.com",
            ],
          },
          {
            title: "Create a Cloud Storage bucket with sample PII data",
            commands: [
              "gsutil mb -l us gs://$PROJECT_ID-dlp-test",
              "cat > sample.txt << 'EOF'",
              "Name: John Smith, SSN: 123-45-6789, Email: john@example.com",
              "Card: 4111111111111111, Phone: 555-867-5309",
              "EOF",
              "gsutil cp sample.txt gs://$PROJECT_ID-dlp-test/",
            ],
          },
          {
            title: "Configure Discovery Scan via Console",
            commands: [
              "# Navigation menu → Security → Sensitive Data Protection → Discovery",
              "# Click 'Create scan configuration'",
              "# Target: Cloud Storage bucket gs://$PROJECT_ID-dlp-test",
              "# Select built-in infoTypes (CREDIT_CARD_NUMBER, EMAIL_ADDRESS, PHONE_NUMBER, US_SOCIAL_SECURITY_NUMBER)",
              "# Schedule: On-demand",
              "# Click Create and then Run",
            ],
          },
          {
            title: "Review discovery results",
            commands: [
              "# In the console: Security → Sensitive Data Protection → Discovery → View findings",
              "# Or via CLI:",
              "gcloud dlp discoveries list --location=global",
            ],
          },
        ],
      },
      {
        labId: "GSP297",
        labTitle: "Google Cloud Storage - Bucket Lock",
        labUrl: "https://www.skills.google/games/7315/labs/45060",
        quickScript: {
          description: "Community solution for Cloud Storage Bucket Lock lab.",
          commands: [
            "curl -LO raw.githubusercontent.com/gcpdecode/Bucket-Lock/main/gsp297.sh",
            "sudo chmod +x gsp297.sh",
            "./gsp297.sh",
          ],
        },
        variables: [VAR_PROJECT],
        steps: [
          {
            title: "Create bucket, upload file, set retention policy",
            commands: [
              "export PROJECT_ID=$(gcloud config get-value project)",
              "gsutil mb gs://$PROJECT_ID-lock-bucket",
              "echo 'Test file' > test.txt",
              "gsutil cp test.txt gs://$PROJECT_ID-lock-bucket/",
              "# Set 10-second retention policy:",
              "gsutil retention set 10s gs://$PROJECT_ID-lock-bucket",
              "gsutil retention get gs://$PROJECT_ID-lock-bucket",
            ],
          },
          {
            title: "Lock the retention policy",
            commands: [
              "gsutil retention lock gs://$PROJECT_ID-lock-bucket",
              "# Try to delete (should fail):",
              "gsutil rm gs://$PROJECT_ID-lock-bucket/test.txt || echo 'Delete blocked by retention policy'",
              "# Wait 10 seconds then delete:",
              "sleep 15",
              "gsutil rm gs://$PROJECT_ID-lock-bucket/test.txt",
            ],
          },
        ],
      },
      {
        labId: "GSP1174",
        labTitle: "Enabling Sensitive Data Protection Discovery for BigQuery",
        labUrl: "https://www.skills.google/games/7315/labs/45061",
        steps: [
          {
            title: "Enable API & create a BigQuery dataset with PII",
            commands: [
              "export PROJECT_ID=$(gcloud config get-value project)",
              "gcloud services enable dlp.googleapis.com bigquery.googleapis.com",
              "bq mk --dataset $PROJECT_ID:dlp_test",
              "bq query --use_legacy_sql=false \\",
              "  'CREATE TABLE dlp_test.sample AS SELECT \"John Smith\" AS name, \"123-45-6789\" AS ssn, \"john@example.com\" AS email'",
            ],
          },
          {
            title: "Configure BigQuery Discovery Scan via Console",
            commands: [
              "# Navigation menu → Security → Sensitive Data Protection → Discovery",
              "# Click 'Create scan configuration'",
              "# Target: BigQuery dataset $PROJECT_ID:dlp_test",
              "# Select infoTypes: US_SOCIAL_SECURITY_NUMBER, EMAIL_ADDRESS, PERSON_NAME",
              "# Schedule: On-demand → Create → Run",
            ],
          },
        ],
      },
      {
        labId: "GSP1175",
        labTitle: "Discover and Protect Sensitive Data Across Your Ecosystem: Challenge Lab",
        labUrl: "https://www.skills.google/games/7315/labs/45062",
        quickScript: {
          description: "Community challenge lab solution for SDP.",
          commands: [
            "curl -LO raw.githubusercontent.com/gcpdecode/SDP-Challenge/main/challenge.sh",
            "sudo chmod +x challenge.sh",
            "./challenge.sh",
          ],
        },
        variables: [VAR_PROJECT, VAR_REGION],
        steps: [
          {
            title: "Task 1 — Set up environment",
            commands: [
              "export PROJECT_ID=$(gcloud config get-value project)",
              "gcloud services enable dlp.googleapis.com",
            ],
          },
          {
            title: "Complete remaining tasks via Console as specified in lab",
            description: "This challenge lab requires creating discovery configs, inspecting results, and applying de-identification templates as specified in the lab panel.",
            commands: [
              "# All remaining tasks are Console-based",
              "# Read each task carefully in the lab panel",
              "# Navigate to Security → Sensitive Data Protection for each step",
            ],
          },
        ],
      },
    ],
  },

  {
    badgeTitle: "Use APIs to Work with Cloud Storage",
    badgeSlug: "use-apis-to-work-with-cloud-storage",
    badgeUrl: "https://www.cloudskillsboost.google/course_templates/755",
    description: "Use REST APIs and gcloud to manage Cloud Storage buckets and objects.",
    labs: [
      {
        labId: "GSP073-CS",
        labTitle: "Cloud Storage: Qwik Start - CLI/SDK",
        labUrl: "https://www.skills.google/games/7315/labs/45064",
        quickScript: {
          description: "Full Cloud Storage CLI lab solution.",
          commands: [
            "curl -LO raw.githubusercontent.com/gcpdecode/Cloud-Storage-CLI/main/solution.sh",
            "sudo chmod +x solution.sh",
            "./solution.sh",
          ],
        },
        variables: [VAR_PROJECT, VAR_REGION],
        steps: [
          {
            title: "Create bucket, upload, list, share",
            commands: [
              "export PROJECT_ID=$(gcloud config get-value project)",
              "export REGION=us-east1  # ← replace",
              "gsutil mb -l $REGION gs://$PROJECT_ID",
              "echo 'Hello Cloud Storage' > hello.txt",
              "gsutil cp hello.txt gs://$PROJECT_ID",
              "gsutil ls gs://$PROJECT_ID",
              "gsutil cp gs://$PROJECT_ID/hello.txt .",
              "gsutil acl ch -u allUsers:R gs://$PROJECT_ID/hello.txt",
              "gsutil acl ch -d allUsers gs://$PROJECT_ID/hello.txt",
              "gsutil rm gs://$PROJECT_ID/hello.txt",
            ],
          },
        ],
      },
      {
        labId: "GSP421",
        labTitle: "APIs Explorer: Cloud Storage",
        labUrl: "https://www.skills.google/games/7315/labs/45065",
        steps: [
          {
            title: "UI-based lab — Use the APIs Explorer to call Cloud Storage REST APIs",
            commands: [
              "# This lab uses the Google APIs Explorer — no Cloud Shell needed",
              "# Navigate to: https://developers.google.com/apis-explorer",
              "# Search for 'Cloud Storage JSON API'",
              "# Use the listed endpoints to create buckets, upload objects, etc.",
              "# Follow each task in the lab panel step by step",
            ],
          },
        ],
      },
      {
        labId: "GSP294",
        labTitle: "Use APIs to Work with Cloud Storage: Challenge Lab",
        labUrl: "https://www.skills.google/games/7315/labs/45067",
        quickScript: {
          description: "Community challenge lab solution for Cloud Storage APIs.",
          commands: [
            "curl -LO raw.githubusercontent.com/gcpdecode/Cloud-Storage-API-Challenge/main/challenge.sh",
            "sudo chmod +x challenge.sh",
            "./challenge.sh",
          ],
        },
        variables: [VAR_PROJECT],
        steps: [
          {
            title: "Task 1 — Create bucket and upload object via REST API",
            commands: [
              "export PROJECT_ID=$(gcloud config get-value project)",
              "export ACCESS_TOKEN=$(gcloud auth print-access-token)",
              "curl -X POST \\",
              "  -H 'Content-Type: application/json' \\",
              "  -H \"Authorization: Bearer $ACCESS_TOKEN\" \\",
              "  -d '{\"name\": \"$PROJECT_ID-api-bucket\"}' \\",
              "  'https://storage.googleapis.com/storage/v1/b?project=$PROJECT_ID'",
            ],
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ARCADE TRAIL JULY 2026 — Game 7316
  // Badge group 1: Configure Your Workplace: Google Workspace for IT Admins
  // ══════════════════════════════════════════════════════════════════════════
  {
    badgeTitle: "Configure Your Workplace: Google Workspace for IT Admins",
    badgeSlug: "configure-your-workplace-google-workspace-for-it-admins",
    badgeUrl: "https://www.cloudskillsboost.google/course_templates/748",
    description: "Configure Google Workspace: manage users, apps, and admin settings from the Admin Console.",
    labs: [
      {
        labId: "GSP050",
        labTitle: "Google Workspace Admin: Getting Started",
        labUrl: "https://www.skills.google/games/7316/labs/45071",
        steps: [
          {
            title: "UI-based lab — Google Workspace Admin Console",
            commands: [
              "# Open: https://admin.google.com with your lab student credentials",
              "# Explore: Users, Groups, Devices, Apps, Reports tabs",
              "# Task 1: Create a new user → Directory → Users → Add new user",
              "# Task 2: Create an organizational unit → Directory → Org units",
              "# Follow each checkpoint in the lab panel",
            ],
          },
        ],
      },
      {
        labId: "GSP051",
        labTitle: "Google Workspace Admin: Provisioning",
        labUrl: "https://www.skills.google/games/7316/labs/45072",
        steps: [
          {
            title: "UI-based lab — Provision users & groups in bulk",
            commands: [
              "# Admin Console → Directory → Users → Bulk upload users",
              "# Download the CSV template, fill in the user details as specified",
              "# Upload the CSV and confirm the users are created",
              "# Create groups: Directory → Groups → Create group",
            ],
          },
        ],
      },
      {
        labId: "GSP052",
        labTitle: "Google Workspace Admin: Managing Applications",
        labUrl: "https://www.skills.google/games/7316/labs/45073",
        steps: [
          {
            title: "UI-based lab — Manage app access and Marketplace apps",
            commands: [
              "# Admin Console → Apps → Google Workspace",
              "# Enable/disable services per OU (organizational unit)",
              "# Apps → Marketplace apps → Search and install third-party apps",
              "# Set app access policies per the lab tasks",
            ],
          },
        ],
      },
      {
        labId: "GSP053",
        labTitle: "Configure Your Workplace: Google Workspace for IT Admins: Challenge Lab",
        labUrl: "https://www.skills.google/games/7316/labs/45074",
        steps: [
          {
            title: "Challenge Lab — Complete all admin tasks as specified",
            commands: [
              "# Read all challenge tasks carefully in the lab panel",
              "# Common tasks: create users, groups, OUs, configure app policies",
              "# Open: https://admin.google.com → complete each task",
              "# Verify each checkpoint after completion",
            ],
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SAFE SPACES JULY 2026 — Game 7318
  // Badge group 1: Mitigate Threats and Vulnerabilities with Security Command Center
  // Badge group 2: Optimize Costs for Google Kubernetes Engine
  // ══════════════════════════════════════════════════════════════════════════
  {
    badgeTitle: "Mitigate Threats and Vulnerabilities with Security Command Center",
    badgeSlug: "mitigate-threats-and-vulnerabilities-with-security-command-center",
    badgeUrl: "https://www.cloudskillsboost.google/course_templates/759",
    description: "Use Security Command Center to detect, investigate, and mitigate threats.",
    labs: [
      {
        labId: "GSP1164",
        labTitle: "Get Started with Security Command Center",
        labUrl: "https://www.skills.google/games/7318/labs/45095",
        quickScript: {
          description: "Community SCC setup solution.",
          commands: [
            "curl -LO raw.githubusercontent.com/gcpdecode/SCC-Setup/main/gsp1164.sh",
            "sudo chmod +x gsp1164.sh",
            "./gsp1164.sh",
          ],
        },
        variables: [VAR_PROJECT],
        steps: [
          {
            title: "Enable Security Command Center",
            commands: [
              "export PROJECT_ID=$(gcloud config get-value project)",
              "gcloud services enable securitycenter.googleapis.com",
              "# Navigate to: Security → Security Command Center in Cloud Console",
              "# Click 'Set up Security Command Center'",
              "# Select Standard or Premium tier as the lab specifies",
            ],
          },
          {
            title: "Review findings and assets",
            commands: [
              "# In SCC: click Findings to see any auto-detected vulnerabilities",
              "# Click Assets to see all resources under monitoring",
              "# Review the vulnerability categories: HIGH, MEDIUM, LOW",
            ],
          },
        ],
      },
      {
        labId: "GSP1166",
        labTitle: "Analyze Findings with Security Command Center",
        labUrl: "https://www.skills.google/games/7318/labs/45096",
        steps: [
          {
            title: "Set up vulnerable resources & analyze SCC findings",
            commands: [
              "export PROJECT_ID=$(gcloud config get-value project)",
              "# Create a VM without OS Login (intentionally misconfigured):",
              "gcloud compute instances create scc-test-vm \\",
              "  --zone=us-central1-a \\",
              "  --machine-type=e2-micro \\",
              "  --image-family=debian-11 \\",
              "  --image-project=debian-cloud \\",
              "  --metadata=enable-oslogin=FALSE",
              "# Open SCC: Security → Security Command Center → Findings",
              "# Filter by category to find the misconfigurations",
              "# Review and export findings as specified in tasks",
            ],
          },
        ],
      },
      {
        labId: "GSP1168",
        labTitle: "Detect and Investigate Threats with Security Command Center",
        labUrl: "https://www.skills.google/games/7318/labs/45097",
        steps: [
          {
            title: "Trigger threat detections",
            commands: [
              "export PROJECT_ID=$(gcloud config get-value project)",
              "# Simulate a threat: port scan on a VM",
              "gcloud compute instances create threat-test \\",
              "  --zone=us-central1-a --machine-type=e2-micro \\",
              "  --image-family=debian-11 --image-project=debian-cloud",
              "# In SCC: navigate to Threats tab to see Event Threat Detection findings",
              "# Review each threat finding and trace to the source",
            ],
          },
        ],
      },
      {
        labId: "GSP1170",
        labTitle: "Mitigate Threats and Vulnerabilities with Security Command Center: Challenge Lab",
        labUrl: "https://www.skills.google/games/7318/labs/45098",
        quickScript: {
          description: "Community challenge lab solution for SCC.",
          commands: [
            "curl -LO raw.githubusercontent.com/gcpdecode/SCC-Challenge/main/gsp1170.sh",
            "sudo chmod +x gsp1170.sh",
            "./gsp1170.sh",
          ],
        },
        variables: [VAR_PROJECT],
        steps: [
          {
            title: "Complete all SCC challenge tasks",
            commands: [
              "export PROJECT_ID=$(gcloud config get-value project)",
              "gcloud services enable securitycenter.googleapis.com",
              "# Each task involves remediating a specific finding in SCC",
              "# Navigate to Security → Security Command Center → Findings",
              "# For each task, find the specified vulnerability and apply the fix",
            ],
          },
        ],
      },
    ],
  },

  {
    badgeTitle: "Optimize Costs for Google Kubernetes Engine",
    badgeSlug: "optimize-costs-for-google-kubernetes-engine",
    badgeUrl: "https://www.cloudskillsboost.google/course_templates/655",
    description: "Optimize GKE cluster costs with namespaces, autoscaling, and VM selection strategies.",
    labs: [
      {
        labId: "GSP766",
        labTitle: "Managing a GKE Multi-tenant Cluster with Namespaces",
        labUrl: "https://www.skills.google/games/7318/labs/45100",
        quickScript: {
          description: "Community solution for GKE namespaces lab.",
          commands: [
            "curl -LO raw.githubusercontent.com/gcpdecode/GKE-Namespaces/main/gsp766.sh",
            "sudo chmod +x gsp766.sh",
            "./gsp766.sh",
          ],
        },
        variables: [VAR_PROJECT, VAR_ZONE],
        steps: [
          {
            title: "Create GKE cluster & set up namespaces",
            commands: [
              "export PROJECT_ID=$(gcloud config get-value project)",
              "export ZONE=us-central1-a  # ← replace with your zone",
              "gcloud container clusters create multi-tenant-cluster \\",
              "  --zone=$ZONE \\",
              "  --num-nodes=3",
              "gcloud container clusters get-credentials multi-tenant-cluster --zone=$ZONE",
              "kubectl create namespace team-a",
              "kubectl create namespace team-b",
              "kubectl get namespaces",
            ],
          },
          {
            title: "Apply resource quotas to namespaces",
            commands: [
              "cat > quota.yaml << 'EOF'",
              "apiVersion: v1",
              "kind: ResourceQuota",
              "metadata:",
              "  name: quota-team-a",
              "  namespace: team-a",
              "spec:",
              "  hard:",
              "    cpu: '2'",
              "    memory: 4Gi",
              "    pods: '10'",
              "EOF",
              "kubectl apply -f quota.yaml",
              "kubectl describe quota -n team-a",
            ],
          },
        ],
      },
      {
        labId: "GSP767",
        labTitle: "Exploring Cost-optimization for GKE Virtual Machines",
        labUrl: "https://www.skills.google/games/7318/labs/45101",
        variables: [VAR_PROJECT, VAR_ZONE],
        steps: [
          {
            title: "Create cluster with mixed node pools (Standard + Spot)",
            commands: [
              "export PROJECT_ID=$(gcloud config get-value project)",
              "export ZONE=us-central1-a  # ← replace",
              "gcloud container clusters create cost-optimized-cluster \\",
              "  --zone=$ZONE \\",
              "  --num-nodes=2 \\",
              "  --machine-type=e2-standard-2",
              "gcloud container clusters get-credentials cost-optimized-cluster --zone=$ZONE",
              "gcloud container node-pools create spot-pool \\",
              "  --cluster=cost-optimized-cluster \\",
              "  --zone=$ZONE \\",
              "  --machine-type=e2-standard-2 \\",
              "  --spot \\",
              "  --num-nodes=2",
              "kubectl get nodes -L cloud.google.com/gke-spot",
            ],
          },
        ],
      },
      {
        labId: "GSP768",
        labTitle: "Understanding and Combining GKE Autoscaling Strategies",
        labUrl: "https://www.skills.google/games/7318/labs/45102",
        variables: [VAR_PROJECT, VAR_ZONE],
        steps: [
          {
            title: "Enable Cluster Autoscaler and HPA",
            commands: [
              "export PROJECT_ID=$(gcloud config get-value project)",
              "export ZONE=us-central1-a  # ← replace",
              "gcloud container clusters create autoscaling-cluster \\",
              "  --zone=$ZONE \\",
              "  --enable-autoscaling \\",
              "  --min-nodes=1 \\",
              "  --max-nodes=5 \\",
              "  --machine-type=e2-standard-2",
              "gcloud container clusters get-credentials autoscaling-cluster --zone=$ZONE",
              "# Deploy a sample workload",
              "kubectl create deployment php-apache \\",
              "  --image=registry.k8s.io/hpa-example \\",
              "  --requests=cpu=200m",
              "kubectl expose deployment php-apache --port=80",
              "# Enable HPA:",
              "kubectl autoscale deployment php-apache \\",
              "  --cpu-percent=50 \\",
              "  --min=1 \\",
              "  --max=10",
              "kubectl get hpa",
            ],
          },
        ],
      },
      {
        labId: "GSP769",
        labTitle: "Optimize Costs for Google Kubernetes Engine: Challenge Lab",
        labUrl: "https://www.skills.google/games/7318/labs/45103",
        quickScript: {
          description: "Community challenge lab solution for GKE cost optimization.",
          commands: [
            "curl -LO raw.githubusercontent.com/gcpdecode/GKE-Cost-Challenge/main/gsp769.sh",
            "sudo chmod +x gsp769.sh",
            "./gsp769.sh",
          ],
        },
        variables: [VAR_PROJECT, VAR_ZONE],
        steps: [
          {
            title: "Set up cluster as specified by the challenge",
            commands: [
              "export PROJECT_ID=$(gcloud config get-value project)",
              "export ZONE=us-central1-a  # ← replace with your zone",
              "gcloud container clusters get-credentials onlineboutique-cluster-326 --zone=$ZONE",
              "kubectl create namespace dev",
              "kubectl create namespace prod",
              "# Apply resource quotas as specified in the challenge tasks",
              "# Add node pools as specified in the challenge tasks",
            ],
          },
          {
            title: "Configure autoscaling & node affinity per tasks",
            commands: [
              "# Task: Update deployments to use spot instances via node affinity",
              "# Task: Enable Cluster Autoscaler on node pool",
              "# Task: Apply VPA (Vertical Pod Autoscaler) to optimize resource requests",
              "# Read each task's specific requirements in the lab panel",
            ],
            note: "Use the Quick Script above for full automation of all challenge tasks.",
          },
        ],
      },
    ],
  },

];

// ── Helper functions ──────────────────────────────────────────────────────────

export function getSolutionBySlug(slug: string): BadgeSolution | undefined {
  return SOLUTIONS.find((s) => s.badgeSlug === slug);
}

export function hasSolution(badgeTitle: string): boolean {
  const slug = slugify(badgeTitle);
  return SOLUTIONS.some((s) => s.badgeSlug === slug);
}

export function getSolutionSlug(badgeTitle: string): string {
  return slugify(badgeTitle);
}
