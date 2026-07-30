Cloud Support Engineering & Customer Support Simulation
This project is a hands-on simulation of an AWS-based Customer Support Analyst / Cloud Support Engineering workflow. Built to directly align with enterprise support requirements, the focus of this environment is providing proactive, empathetic, and highly technical support for software and cloud applications. The simulation validates core competencies including remote fault diagnosis via VPNs, log file analysis, backup/restore operations, customer communication, and knowledge base (KB) article creation.

Core Competencies Demonstrated
Remote Issue Resolution & VPNs: Configured and utilized AWS Client VPN (Mutual TLS) and Systems Manager (SSM) Session Manager to securely access remote servers and diagnose faults internally.
Fault Diagnosis & Log Analysis: Queried and interpreted application logs using Amazon CloudWatch Logs Insights to isolate complex network configuration issues from application-level failures.
Archiving & Restoring Data: Executed point-in-time recovery using AWS Backup, restoring corrupted/missing customer data onto replacement EC2 instances and verifying state integrity.
Technical Documentation & KBs: Translated complex technical findings into usable site manuals and Knowledge Base articles to share best practices across the support team.
Customer-Facing Communication: Drafted empathetic, non-jargon status updates to keep external customers informed during service disruptions, demonstrating tact and excellent interpersonal skills.
Operational Scenarios Executed
Scenario 01: Service Unreachable (Network vs. Application Health)
A simulated customer reported their application was completely unresponsive externally. By using SSM Session Manager for secure remote access and querying CloudWatch Logs Insights, the issue was rapidly isolated to a misconfigured Security Group network rule rather than a server crash. The ingress rule was re-configured and verified, restoring full service with minimal downtime.

Scenario 02: Missing Customer Data Recovery
A critical customer data record was deleted, requiring rapid response. A manual restore job was executed via AWS Backup to recover a recent recovery point onto a new instance. Direct inspection of the restored environment confirmed successful recovery, while reinforcing a critical lesson on backup timing and data consistency.

Tools and Services Used
Remote Access & Networking: AWS Client VPN (Mutual TLS), AWS Systems Manager (SSM) Session Manager, AWS Default VPC, Security Groups
Observability: Amazon CloudWatch Logs Insights, CloudWatch Agent
Data Protection: AWS Backup (Vaults, Plans, Recovery Points, On-Demand Restores)
Compute: AWS EC2 (Amazon Linux 2023)
Security: AWS IAM (Strict Least-Privilege Scoped Policies)
Visual Evidence & Screenshots
To validate the hands-on execution of these tasks, over 50 screenshots capturing terminal commands, AWS Console configurations, VPN connections, log queries, and backup operations have been documented in the repository.

View Visual Evidence (screenshots/)
Project Documentation
Incident Reports:
INC-001: App Unreachable
INC-002: Customer Data Missing
Knowledge Base Articles:
KB-001: Diagnosing "Application Down" Reports
KB-002: Restoring EC2 Instances via AWS Backup
Customer Communications:
Customer Communication Samples
Architecture & Setup:
Tech Stack Details
Project Requirements (PRD)
Project Definition
Lessons Learned & Best Practices
The most significant operational learning from this simulation came during the data recovery scenario. While the AWS Backup restore job completed successfully (reporting COMPLETED status), direct validation inside the newly restored instance revealed that a file written seconds before the backup was triggered did not persist in the snapshot. This reinforced a critical real-world support lesson: never trust a "success" status blind. A snapshot captures block storage state at the exact moment of registration, meaning point-in-time consistency requires direct, empirical validation by the support analyst before communicating recovery to a customer.



Self-Healing Microservice on AWS
A cloud-deployed containerized microservice on AWS demonstrating layered self-healing, automated scaling, and CI/CD-driven delivery with integrated security validation.

This project focuses on system resilience and recovery mechanisms across multiple layers—application, container, instance, and traffic routing.

🧠 Overview
This system implements a fault-tolerant microservice architecture where failures are automatically detected and recovered without manual intervention.

Key design principles:

Health-driven recovery
Infrastructure-level redundancy
Automated deployment pipelines
Observability-backed decision making
🏗️ Architecture
Flow:

Developer Push → CI Pipeline → Container Registry → AWS Infrastructure → Running Microservice

AWS Stack:

VPC (multi-AZ)
Application Load Balancer (ALB)
Target Group with health checks
Auto Scaling Group (2–4 instances)
EC2 instances running containerized service
CI/CD Pipeline:

Build → Security Scan → Containerize → Push → Deploy-ready artifact
✨ Key Features
Layered self-healing across multiple system levels
Automatic instance replacement via Auto Scaling Group
Health-based traffic routing using ALB
CPU-based horizontal scaling under load
Fully containerized deployment
CI/CD pipeline with integrated vulnerability scanning
Infrastructure provisioned using Terraform
Multi-AZ deployment for high availability
🛠 Tech Stack
Layer	Technology
Application	Containerized backend service
Build & CI/CD	GitHub Actions
Containerization	Docker
Security	Snyk (dependency + image scanning)
Cloud	AWS EC2, ALB, Auto Scaling Group, CloudWatch, VPC
Infrastructure	Terraform
🔄 Self-Healing Strategy
This system is designed with multi-layer fault recovery:

1. Application-Level Health
Health endpoint exposed (/actuator/health)
Reports service readiness and liveness
Used by downstream systems for failure detection
2. Container-Level Recovery
Container health checks configured
Failed health checks mark container as unhealthy
Automatic restart via container runtime
3. Instance-Level Recovery
Auto Scaling Group monitors instance health
Unhealthy instances are terminated and replaced
Desired capacity is continuously maintained
4. Traffic-Level Isolation
ALB performs periodic health checks
Unhealthy instances removed from rotation
Requests routed only to healthy targets
5. Demand-Based Scaling
CloudWatch monitors CPU utilization
Scale-out triggered at sustained high load (~80%)
Scale-in during low utilization
🔄 CI/CD Pipeline
Triggered on every push.

Pipeline Stages:

Build application
Run dependency vulnerability scan
Build Docker image
Push image to registry
Run container image security scan
Pipeline enforces fail-fast on high-severity vulnerabilities.

☁️ Deployment (Terraform)
Infrastructure is provisioned using Infrastructure-as-Code:

VPC with multi-AZ configuration
Load balancer + health checks
Auto Scaling Group with dynamic capacity
EC2 instances configured for container runtime
Infrastructure is created and destroyed on demand to optimize cost usage.

📊 Monitoring & Scaling
Health Checks

Endpoint: /actuator/health
Interval: 30s
Failure thresholds configured for automatic isolation
Auto Scaling

Metric: CPU utilization
Target: ~80%
Min: 2 instances
Max: 4 instances
📁 Project Structure
self-healing-microservice/
├── .github/workflows/ci.yml
├── src/
├── terraform/
├── Dockerfile
├── build configuration files
└── README.md
🔐 Security Considerations
No hardcoded credentials
IAM roles used for instance access
Security groups restrict inbound traffic
Automated vulnerability scanning in CI pipeline
Sensitive files excluded via version control rules
🎯 Objectives
This project demonstrates:

Designing resilient microservice systems
Implementing layered self-healing strategies
Automating deployment and validation pipelines
Managing infrastructure using Terraform
Running containerized workloads in a cloud environment
Understanding load balancer health and failover behavior
🏁 Outcome
A fully functional self-healing microservice deployed on AWS, capable of:

Detecting failures at multiple levels
Recovering automatically without manual intervention
Scaling dynamically based on system load
This project represents a practical implementation of resilient, cloud-native microservice architecture.

📌 Notes
The system was deployed and validated on AWS. Infrastructure resources were decommissioned after testing to optimize cost usage. Deployment artifacts and logs are included in the repository for verification.


Cloud Security Observability Stack — AWS ECS Fargate
A production-style security observability pipeline deployed on AWS ECS Fargate using Terraform. Prometheus scrapes infrastructure metrics and Grafana visualizes them with real-time alerting — built to simulate InfoSec SRE monitoring workflows.

Architecture
┌─────────────────────────────────────────────────────┐ │ AWS (ap-south-1) │ │ │ │ ┌─────────────┐ ┌─────────────────────┐ │ │ │ Prometheus │────────▶│ Grafana │ │ │ │ (ECS Fargate)│ scrapes │ (ECS Fargate) │ │ │ │ port: 9090 │metrics │ port: 3000 │ │ │ └──────┬───────┘ └──────────┬──────────┘ │ │ │ │ │ │ ▼ ▼ │ │ CloudWatch Logs Alert Rules │ │ (severity: warning) │ │ │ │ ┌────────────────────────────────────────────────┐ │ │ │ VPC → Subnets → IGW → Security Groups → ECR │ │ │ │ (Provisioned via Terraform) │ │ │ └────────────────────────────────────────────────┘ │ └─────────────────────────────────────────────────────┘

Stack
Layer	Technology
Infrastructure	AWS ECS Fargate, VPC, ECR, CloudWatch
IaC	Terraform
Metrics	Prometheus (custom Docker image)
Visualization	Grafana
Alerting	Grafana Alert Rules
Container Registry	AWS ECR
Screenshots
AWS ECS Cluster — Both Services Running
AWS Cluster

Grafana Dashboard — Live Metrics
Grafana Dashboard

Prometheus Targets — UP Status
Prometheus Targets

Grafana Alert Rule — High Request Rate
Alert Rule

Terraform Apply — Infrastructure Provisioning
Terraform 1 Terraform 2 Terraform 3 Terraform 4 Terraform 5 Terraform 6 Terraform 7

Features
Containerized Prometheus + Grafana running on ECS Fargate (zero EC2)
Custom Prometheus Docker image built for linux/amd64 and pushed to ECR
Prometheus scraping its own metrics (prometheus_http_requests_total, prometheus_tsdb_head_series)
Grafana dashboard with 3 panels: HTTP Requests, Request Rate (5m), Active Time Series
Alert rule: High Request Rate Alert — fires when request rate exceeds 0.5 (severity: warning)
CloudWatch log group for container logs with 7-day retention
IAM roles following least-privilege principle (separate execution role + task role)
Infrastructure (Terraform)
Resources provisioned:

VPC (10.0.0.0/16) with 2 public subnets across ap-south-1a and ap-south-1b
Internet Gateway + Route Tables
Security Groups (inbound: 9090 for Prometheus, 3000 for Grafana)
ECS Cluster + Task Definitions for Prometheus and Grafana
IAM Execution Role + Task Role (CloudWatch read access)
CloudWatch Log Group (/ecs/observability-fargate, 7-day retention)
Project Structure
. ├── terraform/ │ ├── main.tf # All AWS resources │ ├── variables.tf # Input variables │ ├── outputs.tf # Output values │ └── provider.tf # AWS provider config ├── prometheus/ │ ├── Dockerfile # Custom Prometheus image (linux/amd64) │ └── prometheus.yml # Scrape config ├── Screenshots/ # Project screenshots └── README.md

Setup
Prerequisites
AWS CLI configured with appropriate IAM permissions
Terraform >= 1.0
Docker with buildx support
Deploy
cd terraform
terraform init
terraform apply -auto-approve
Build & Push Custom Prometheus Image
cd prometheus
# Build for linux/amd64 (required for ECS Fargate)
docker buildx build --platform linux/amd64 -t prometheus-custom:amd64 --load .
docker tag prometheus-custom:amd64 <account_id>.dkr.ecr.ap-south-1.amazonaws.com/prometheus-custom:latest
docker push <account_id>.dkr.ecr.ap-south-1.amazonaws.com/prometheus-custom:latest
Destroy
cd terraform
terraform destroy -auto-approve
Grafana Metrics
Metric	Description
prometheus_http_requests_total	Total HTTP requests to Prometheus
rate(prometheus_http_requests_total[5m])	Request rate over 5 minute window
prometheus_tsdb_head_series	Active time series in TSDB
Alert Rule
Field	Value
Name	High Request Rate Alert
Condition	rate(prometheus_http_requests_total[5m]) IS ABOVE 0.5
Evaluation	Every 1 minute
Pending Period	1 minute
Severity	warning


AI Test Generator
A FastAPI-based microservice that generates executable pytest test suites from Python code using LLM inference, deployed via a fully automated GitOps CI/CD pipeline.

🧠 Overview
This system automates test generation by converting raw Python functions into structured pytest suites using a large language model. The service is designed with a production-style delivery pipeline, including automated testing, containerization, and GitOps-based deployment.

Core capabilities:

LLM-driven test generation from source code
API-based interaction with validation and rate limiting
Automated CI/CD with coverage enforcement
GitOps-driven deployment to a Kubernetes environment
🏗️ Architecture
Flow:

Developer Push → CI Pipeline → Container Registry → GitOps Repo → ArgoCD → Kubernetes Cluster

Key Components:

FastAPI microservice (test generation engine)
Jenkins CI pipeline (build, test, security gates)
AWS ECR (container registry)
GitOps repository (deployment state)
ArgoCD (continuous delivery)
Kubernetes (Minikube) runtime
⚙️ Tech Stack
Layer	Technology
Backend	FastAPI (Python 3.11)
AI/LLM	Groq API (LLaMA 3.1)
CI/CD	Jenkins
Containerization	Docker
Orchestration	Kubernetes (Minikube), Helm
GitOps	ArgoCD
Registry	AWS ECR
IaC	Terraform
🚀 Functionality
Client sends Python code to /generate endpoint
Service validates input (size, format, rate limits)
Code is passed to Groq LLM with structured prompt
LLM returns a complete pytest test suite
Response is returned as executable test code
Additional controls:

Rate limiting: 5 requests/minute (slowapi)
Input validation for robustness
Health endpoint for monitoring
🧩 System Behavior
Test generation is deterministic at API level (validated inputs, structured prompts)
CI enforces a minimum 70% coverage gate before deployment
Each build produces a uniquely tagged container image
Deployment is fully automated via GitOps synchronization
📁 Project Structure
ai-test-generator/
├── app/
├── tests/
├── terraform/
├── Dockerfile
├── Jenkinsfile
├── requirements.txt
└── README.md
💻 Local Setup
Prerequisites
Python 3.11+
Docker
Groq API key
Steps
git clone https://github.com/SannidhiSriram-06/ai-test-generator.git
cd ai-test-generator

python3 -m venv venv
source venv/bin/activate

pip install -r requirements.txt
echo "GROQ_API_KEY=your_key_here" > .env

uvicorn app.main:app --reload --port 8000
API runs at: http://localhost:8000

🔬 Testing
pytest tests/ --cov=app --cov-fail-under=70 -v
Coverage threshold enforced both locally and in CI
Ensures deployment only occurs for validated builds
🔄 CI/CD Pipeline
Triggered on every push to main.

Pipeline stages:

Checkout code
Install dependencies
Run tests with coverage gate
Build Docker image
Push image to AWS ECR
Update GitOps repository (values.yaml)
ArgoCD sync triggers deployment
Key characteristics:

Fail-fast on test or coverage failure
Immutable image tagging (BUILD_NUMBER-COMMIT_SHA)
Separation of application and deployment state
☁️ Deployment Model
Application containerized and deployed on Kubernetes (Minikube)
Helm manages release configuration
ArgoCD continuously reconciles desired state from GitOps repo
A complete deployment workflow is implemented and documented within the repository, enabling reproducible setup of the full pipeline.

The system was deployed and validated as part of project execution. Infrastructure resources were decommissioned after validation to optimize cost usage. All configuration and deployment steps are preserved for reproducibility.

🔐 Security Considerations
No credentials stored in source code
Secrets managed via Jenkins credential store
Input validation before LLM invocation
CI-integrated safeguards (coverage gate)
🎯 Objectives
This project demonstrates:

Practical use of LLMs in developer tooling
Designing API-driven AI microservices
Implementing CI/CD with enforced quality gates
Applying GitOps principles for deployment automation
Managing containerized workloads in Kubernetes
🏁 Outcome
A fully automated system that:

Generates test cases from code using LLM inference
Enforces quality through CI pipelines
Deploys continuously using GitOps principles
This project represents a production-style implementation of an AI-assisted developer tooling system with automated delivery pipelines.

📌 Notes
The deployment pipeline and infrastructure were actively used during development and validation. Resources were later decommissioned to optimize cost usage, while preserving full reproducibility through configuration and documentation.

License
MIT



🔐 AI-Powered KYC Verification System
Full-stack identity verification platform for the BFSI sector — classifies documents, extracts fields via OCR, and detects fraud using Graph Neural Networks. Deployed on AWS (S3 + EC2) with a React frontend, Node.js backend, and a Python-based ML microservice.


📋 Table of Contents
Overview
Architecture
Tech Stack
ML Pipeline
Project Structure
Getting Started
Environment Variables
Deployment
API Reference
Key Engineering Decisions
Known Limitations
Team

Overview
This system automates KYC (Know Your Customer) document verification — a process traditionally handled manually in BFSI institutions. A user uploads an identity document and receives a verification decision backed by ML inference.

Supported documents: Aadhaar Card · PAN Card · Passport

End-to-end flow:

Document classification using a TFLite CNN model
OCR extraction using EasyOCR
Structured parsing via Groq LLM API
Fraud detection using Graph Neural Networks (GNN)
Verdict generation — Approved, Suspicious, or Non-KYC
Result persistence in MongoDB Atlas
Visualization via a React dashboard
Architecture
[Browser] → [Frontend (S3)] → [Backend API (EC2)] → [ML Service (EC2)] → [MongoDB Atlas]
Layer	Service	Hosted On
Frontend	React (Vite)	AWS S3 Static Hosting
Backend API	Node.js + Express	AWS EC2
ML Service	Python Flask	AWS EC2
Database	MongoDB Atlas	Managed Cloud
Tech Stack
Frontend

React (Vite)
React Router
Backend

Node.js + Express
JWT Authentication
Multer (file handling)
MongoDB + Mongoose
ML Microservice

Python + Flask
TFLite (document classification)
PyTorch + PyTorch Geometric (GNN)
EasyOCR
Sentence Transformers
Groq API (LLM parsing)
Infrastructure

AWS EC2 (compute)
AWS S3 (frontend hosting)
PM2 (process management)
MongoDB Atlas
ML Pipeline
Each document flows through five stages:

1. Document Classification
TFLite CNN classifies input into supported document types or Non-KYC.

2. OCR Extraction
EasyOCR extracts raw text for all inputs, enabling fallback handling.

3. Structured Parsing
Groq LLM converts raw OCR output into structured JSON fields.

4. Anomaly Detection
GNN models compare extracted data against known records to compute anomaly scores.

Score > 2.0 → Suspicious
Score ≤ 2.0 → Approved
Non-KYC → Skipped
5. Response Generation
System returns a structured JSON response with classification, extracted data, and fraud status.

Project Structure
project-root/
├── frontend/
├── backend/
├── ml-service/
└── trained_models/
Pre-trained model artifacts are not included in the repository and must be provided separately for execution.

Getting Started
Prerequisites
Node.js v18+
Python 3.12
MongoDB Atlas
Groq API Key
AWS account (for deployment)
Local Setup
Run services in sequence:

ML Service
Backend
Frontend
Each component is independently runnable and communicates via defined APIs.

Environment Variables
Separate .env files are required for each service.

Backend

Database URI
JWT secret
ML service endpoint
Frontend

Backend API base URL
ML Service

Groq API key
Deployment
This system was deployed using:

Two EC2 instances

Backend service
ML microservice
S3 static hosting for frontend

A complete, step-by-step deployment guide is included in this repository, covering:

Infrastructure setup
Service configuration
Environment management
Process orchestration using PM2
The infrastructure was provisioned, validated, and used during the internship demonstration. Resources were decommissioned after the final presentation to optimize cost usage. The repository includes all necessary instructions to reproduce the deployment environment.

API Reference
Auth
POST /api/auth/register
POST /api/auth/login
KYC
POST /api/kyc/verify
GET /api/kyc/history
GET /api/kyc/verifications
ML Service
GET /api/ml/health
POST /api/ml/classify
Key Engineering Decisions
EC2 over Serverless
Avoids memory constraints of Lambda
Eliminates cold-start overhead
Allows full control over ML dependencies
Separate Backend & ML Services
Isolates heavy ML workloads
Improves reliability and scalability
Enables independent upgrades
Heuristic Fallback Layer
OCR-based fallback improves robustness against model misclassification without requiring retraining.

Known Limitations
CPU-only inference (no GPU acceleration)
OCR accuracy degrades on low-quality images
No automated file cleanup for uploads
Single-region deployment
👥 Contributors
Infosys Springboard — BFSI Sector Cloud Architecture Cohort

🏁 Outcome
A production-style KYC verification system integrating:

Multi-stage ML inference
Microservice-based architecture
Cloud deployment on AWS
Real-time fraud detection
This project demonstrates practical implementation of scalable, AI-driven verification systems in a cloud environment.

Built with Node.js · Flask · PyTorch · AWS · MongoDB Atlas


Azure AI Patient Triage System (POC)
A cloud-deployed Flask application on Azure App Service that processes patient symptoms using Azure OpenAI, classifies triage priority, and records each interaction in Azure Table Storage for audit and traceability.

This project demonstrates an end-to-end Azure-based AI workflow: application hosting, LLM integration, and persistent logging.

🧠 Architecture
Flow:

User → Flask App (Azure App Service) → Azure OpenAI → Triage Classification → Azure Table Storage (Audit Log)

Key Characteristics:

Stateless web service with externalized AI inference
Persistent audit logging for every request
Separation of compute, inference, and storage layers
⚙️ Tech Stack
Layer	Technology
Backend	Python 3.11, Flask, Gunicorn
AI/LLM	Azure OpenAI (custom deployment: triage-model)
Compute	Azure App Service (Linux, B1 tier)
Storage	Azure Table Storage
Config	Environment Variables (App Service Configuration)
🚀 Functionality
User submits symptoms via a web interface

Backend sends structured prompt to Azure OpenAI

Model returns triage classification:

Urgent Care
Non-Urgent Visit
Self Care
Result is displayed to the user

Interaction is logged in Azure Table Storage for audit

🔐 Configuration & Security
No secrets are hardcoded in the codebase

All sensitive values are managed via App Service environment variables:

AZURE_OPENAI_ENDPOINT
AZURE_OPENAI_API_KEY
AZURE_OPENAI_DEPLOYMENT
STORAGE_CONNECTION_STRING
Follows basic secure configuration practices for POC-level deployment

🧩 Repository Structure
app.py — Flask application and API logic
requirements.txt — Python dependencies
templates/index.html — User interface
Azure_Triage_Deployment.pdf — Deployment evidence and validation artifacts
📦 Deployment Notes
Application deployed on Azure App Service (Linux runtime)
Azure OpenAI configured with a dedicated model deployment
Table Storage used for structured logging of each request/response pair
Logging and runtime behavior validated through Azure monitoring tools
Azure resources were decommissioned after deployment validation to optimize cost usage. The included deployment document provides timestamped evidence of infrastructure, execution, and logging.

🎯 Objectives
This project was designed to demonstrate:

End-to-end deployment of an AI-powered application on Azure
Integration of LLM inference into a production-style backend
Use of managed cloud services for scalability and separation of concerns
Implementation of persistent audit logging
Debugging and stabilizing a cloud-hosted Python application
🏁 Outcome
A fully functional AI triage system successfully deployed on Azure, with validated request handling, LLM inference, and persistent logging.

This project represents a practical implementation of a cloud-native AI application with real-world deployment considerations.


AI Test Generator
FastAPI service that uses Groq LLM to automatically generate pytest test cases from Python source code, deployed via a full GitOps CI/CD pipeline.

Architecture
┌─────────────────────────────────────────────────────────────────┐
│                        Developer Laptop                          │
│                                                                  │
│   git push                                                       │
│      │                                                           │
│      ▼                                                           │
│  ┌──────────┐    poll    ┌──────────────────────────────┐       │
│  │  GitHub   │ ─────────▶│       Jenkins Pipeline        │       │
│  │ (app repo)│           │                              │       │
│  └──────────┘           │  1. pytest (≥70% cov gate)   │       │
│                          │  2. docker build             │       │
│                          │  3. docker push → ECR        │       │
│                          │  4. update values.yaml       │       │
│                          └──────────────┬───────────────┘       │
│                                         │ git push               │
│                                         ▼                        │
│                          ┌──────────────────────────────┐       │
│                          │   GitHub (gitops repo)        │       │
│                          │   charts/ai-test-generator/   │       │
│                          │   values.yaml  ← image tag    │       │
│                          └──────────────┬───────────────┘       │
│                                         │ auto-sync              │
│                                         ▼                        │
│                          ┌──────────────────────────────┐       │
│                          │          ArgoCD               │       │
│                          │  (watches gitops repo)        │       │
│                          └──────────────┬───────────────┘       │
│                                         │ helm upgrade           │
│                                         ▼                        │
│                          ┌──────────────────────────────┐       │
│                          │      Minikube Cluster         │       │
│                          │  ┌────────────────────────┐  │       │
│                          │  │    Helm Release         │  │       │
│                          │  │   ai-test-generator     │  │       │
│                          │  │   FastAPI pod (ECR img) │  │       │
│                          │  └────────────────────────┘  │       │
│                          └──────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
Tech Stack
FastAPI Python Docker Jenkins ArgoCD Kubernetes Helm AWS ECR Terraform Groq

How it works
Send a Python function to the /generate endpoint and the service forwards it to Groq's llama-3.1-8b-instant model with a structured prompt instructing it to return a complete pytest test suite. The API enforces a rate limit of 5 requests per minute via slowapi and validates that input code is non-empty and under the size limit before hitting the LLM. Every push to main triggers a Jenkins pipeline that runs pytest with a 70% coverage gate, builds a new Docker image tagged BUILD_NUMBER-COMMIT_SHA, pushes it to AWS ECR, and updates the image tag in the GitOps repository — which ArgoCD detects and uses to roll out a new pod on Minikube automatically.

Folder structure
ai-test-generator/
├── app/
│   ├── __init__.py
│   ├── config.py          # env var loading via python-dotenv
│   └── main.py            # FastAPI app, /health and /generate endpoints
├── tests/
│   ├── __init__.py
│   └── test_main.py       # 5 async pytest tests, 87% coverage
├── Terraform/
│   └── main.tf            # ECR repo provisioning (ap-south-1)
├── Dockerfile             # multi-stage build, python:3.11-slim
├── Jenkinsfile            # CI pipeline (pytest → ECR → gitops update)
├── pytest.ini             # asyncio_mode = auto
├── requirements.txt
└── README.md
Local setup
Prerequisites
Python 3.11+
Docker Desktop
A Groq API key
Steps
# 1. Clone the repo
git clone https://github.com/SannidhiSriram-06/ai-test-generator.git
cd ai-test-generator

# 2. Create a virtual environment
python3 -m venv venv
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set up environment variables
echo "GROQ_API_KEY=your_key_here" > .env

# 5. Start the server
uvicorn app.main:app --reload --port 8000
The API is now running at http://localhost:8000.

Usage
# Health check
curl http://localhost:8000/health

# Generate tests
curl -X POST http://localhost:8000/generate \
  -H "Content-Type: application/json" \
  -d '{"code": "def add(a, b):\n    return a + b"}'
Running tests
# Run tests with coverage report
pytest tests/ --cov=app --cov-report=term-missing -v

# Run with the same coverage gate used in CI
pytest tests/ --cov=app --cov-fail-under=70 -v
Expected output: 5 passed, 87% coverage.

CI/CD flow
Every push to main triggers the Jenkins pipeline defined in Jenkinsfile:

Stage	What happens
Checkout	Jenkins pulls the latest commit from GitHub
Install dependencies	pip install into a virtualenv
Run tests	pytest with --cov-fail-under=70 — build fails if coverage drops below threshold
Build & push to ECR	Docker image built, tagged BUILD_NUMBER-COMMIT_SHA, pushed to AWS ECR (ap-south-1)
Update GitOps repo	Jenkins clones ai-test-generator-gitops, updates image.tag in values.yaml, and pushes
ArgoCD sync	ArgoCD detects the values.yaml change and rolls out the new image to Minikube automatically
Secrets (AWS credentials, Groq API key, GitHub PAT) are stored in the Jenkins credential store — never in code.

Screenshots
See project-screenshots.pdf in this repository for full pipeline screenshots including Jenkins build view, ArgoCD sync status, and kubectl pod output.

License
MIT


📚 Bookstore Microservice Architecture on AWS
A cloud architecture case study demonstrating the translation of a traditional Node.js Express application into a serverless AWS deployment using Lambda, API Gateway, and MongoDB Atlas.

🎯 Project Overview
This project demonstrates practical cloud service mapping by taking a basic bookstore REST API and deploying it using AWS managed services. The focus is on understanding how traditional application components map to cloud-native services.

Key Learning: How to translate application requirements (compute, routing, storage, monitoring) into appropriate AWS service selections.

🏗️ Architecture
Traditional Application → Cloud Services Mapping
Application Component	AWS Service	Reason
Express Server (compute)	AWS Lambda	Serverless, auto-scaling, pay-per-request
HTTP Routing	API Gateway	Managed REST API with HTTPS, routing, monitoring
Database	MongoDB Atlas	Free tier managed database, no infrastructure
Static Assets	Amazon S3	Durable object storage (not implemented in this demo)
Logging	CloudWatch	Automatic Lambda log collection
Architecture Diagram
Client Request (HTTPS)
    ↓
API Gateway (REST API)
    ├── GET /books
    └── POST /books
         ↓
    AWS Lambda
    (Node.js 20.x)
         ↓
MongoDB Atlas
(M0 Free Tier)
         ↓
    CloudWatch Logs
🛠️ Tech Stack
Compute: AWS Lambda (Node.js 20.x)
API Management: AWS API Gateway (REST API)
Database: MongoDB Atlas (M0 Free Tier - 512MB)
Monitoring: AWS CloudWatch
Region: us-east-1
📡 API Endpoints
The deployed API supports basic CRUD operations:

Method	Endpoint	Description
GET	/books	List all books
POST	/books	Add a new book
Note: This is a proof-of-concept. A production system would include UPDATE, DELETE, authentication, and input validation.

💰 Cost Analysis
Why This Architecture is Cost-Efficient
Monthly costs for ~100 users:

Lambda: Free tier covers 1M requests/month → $0
API Gateway: Free tier covers 1M API calls/month → $0
MongoDB Atlas: M0 tier is permanently free → $0
CloudWatch: 5GB logs free tier → $0
Total: $0/month for development and low-traffic scenarios.

This demonstrates understanding of AWS Free Tier optimization for student/learning projects.

🚀 Deployment Process
1. MongoDB Atlas Setup
Created M0 free tier cluster (512MB storage)
Configured database user with read/write permissions
Whitelisted IP addresses (0.0.0.0/0 for development)
Retrieved connection string
2. AWS Lambda Configuration
Created function with Node.js 20.x runtime
Configured environment variable: MONGO_URI
Deployed function code with API handlers
Set up execution role with CloudWatch permissions
3. API Gateway Integration
Created REST API with /books resource
Configured GET and POST methods
Enabled Lambda Proxy Integration for request/response handling
Enabled CORS for web access
Deployed to prod stage
4. Testing & Validation
Verified functionality using curl:

# Get all books
curl https://gkpr0sgbr9.execute-api.us-east-1.amazonaws.com/prod/books

# Add a book
curl -X POST https://gkpr0sgbr9.execute-api.us-east-1.amazonaws.com/prod/books \
  -H "Content-Type: application/json" \
  -d '{"title":"Cloud Computing","author":"AWS Expert","price":29.99}'
📸 Implementation Screenshots
All deployment steps are documented in the /screenshots folder:

MongoDB Atlas cluster configuration
Database user setup
Network access whitelist
Lambda function creation and code
Environment variable configuration
API Gateway resource structure
Method integration with Lambda
Deployed API stage with invoke URL
Successful API testing
🎓 Key Learnings
Cloud Service Mapping
Compute: Serverless (Lambda) vs. traditional servers (EC2)
Why Lambda: No server management, automatic scaling, pay-per-execution
Trade-off: Cold starts vs. always-on instances
API Gateway Benefits
HTTPS endpoint without certificate management
Built-in request routing
Integrated with CloudWatch for monitoring
Rate limiting and throttling capabilities
MongoDB Atlas Integration
Managed database service eliminates server maintenance
Connection string-based access
IP whitelisting for security
Free tier suitable for learning/development
Lambda Proxy Integration
API Gateway passes entire request to Lambda
Lambda controls response format
Simplifies integration vs. custom mapping
🔧 Project Structure
bookstore-aws-microservice/
├── README.md                 # This file
├── ARCHITECTURE.md           # Detailed architecture documentation
├── lambda-code/
│   ├── index.mjs            # Lambda function handler
│   └── package.json         # Node.js dependencies
└── screenshots/             # Deployment screenshots
    ├── 01-mongodb-cluster.png
    ├── 02-database-users.png
    ├── 03-network-access.png
    ├── 04-lambda-overview.png
    ├── 05-lambda-code.png
    ├── 06-env-variables.png
    ├── 07-lambda-test.png
    ├── 08-api-gateway-resources.png
    ├── 09-get-method-integration.png
    ├── 10-api-stages.png
    └── 11-post-method-integration.png
⚠️ Limitations & Future Enhancements
Current State: Proof-of-concept demonstrating cloud architecture mapping

Not Implemented (but would be needed for production):

Authentication/Authorization (AWS Cognito or API keys)
Input validation and error handling
Database connection pooling optimization
UPDATE and DELETE endpoints
CI/CD pipeline (AWS CodePipeline)
Infrastructure as Code (CloudFormation/Terraform)
VPC configuration for database security
DynamoDB alternative for full AWS-native stack
This is intentional - the focus is on understanding core cloud service mapping, not building production-grade software.

🎯 Interview Talking Points
If asked about this project, I can discuss:

Why serverless? → Cost efficiency, auto-scaling, no server management for low-traffic apps
Why API Gateway? → Managed HTTPS endpoints, built-in monitoring, integrates with Lambda
Why MongoDB Atlas vs. DynamoDB? → Familiar with MongoDB, free tier sufficient, cross-cloud portability
Trade-offs: Lambda cold starts, vendor lock-in, debugging complexity vs. traditional servers
What I learned: Mapping application components to cloud services, understanding managed service benefits
👨‍💻 Author
Sannidhi Sriram

3rd Year CSE Student @ Lovely Professional University
Minor: Cloud Computing
Certifications: Azure AZ-900, AI-900, Oracle Cloud (Gen AI, Multicloud Architect)
📝 Acknowledgments
This project was created as a learning exercise to understand:

AWS Lambda and serverless computing
API Gateway for REST API management
MongoDB Atlas cloud database hosting
Cloud architecture design principles
Built as part of coursework demonstrating practical cloud deployment skills.

Note: This repository contains deployment documentation and code. AWS resources have been deleted after testing to avoid unnecessary costs. Screenshots demonstrate the working implementation.