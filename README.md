# 3-tier-bank-app

Here is a comprehensive **`README.md`** template tailored for your complete **3-Tier Banking Application & Monitoring/Logging Stack**.

You can copy and paste this directly into your repository.

---

```markdown
# 🏦 3-Tier Banking Application & Observability Stack

A production-grade demonstration of a microservice-oriented 3-Tier Banking Application bundled with a full Observability & Centralized Logging Stack using Docker Compose.

---

## 🏗️ Architecture Overview

```text
               +-------------------------------------------------+
               |                   USER / BROWSER                |
               +-----------------------+-------------------------+
                                       |
                                       | Port 8080
                                       v
               +-----------------------+-------------------------+
               |          PRESENTATION TIER (Frontend)           |
               |             Nginx + Static Web UI               |
               +-----------------------+-------------------------+
                                       |
                                       | Internal Proxy (/api)
                                       v
               +-----------------------+-------------------------+
               |            APPLICATION TIER (Backend)           |
               |            Node.js / Express REST API           |
               +-----------------------+-------------------------+
                                       |
                                       | PostgreSQL Client (pg)
                                       v
               +-----------------------+-------------------------+
               |             DATABASE TIER (Data)                |
               |             PostgreSQL Database                 |
               +-------------------------------------------------+

================================================================================

                           OBSERVABILITY LAYER
                           
    +------------------+      +-------------------+      +-------------------+
    |  Node Exporter   |      |     cAdvisor      |      |     Promtail      |
    |  (Host Metrics)  |      | (Container Stats) |      |  (Docker Logs)    |
    +--------+---------+      +---------+---------+      +---------+---------+
             |                          |                          |
             | Scrape (:9100)           | Scrape (:8080)           | Push (:3100)
             v                          v                          v
    +--------+--------------------------+---------+      +---------+---------+
    |               Prometheus                    |      |       Loki        |
    |          (Metrics Aggregator)               |      |  (Log Aggregator) |
    +--------------------+------------------------+      +---------+---------+
                         |                                         |
                         +--------------------+--------------------+
                                              |
                                              v
                                   +----------+----------+
                                   |       Grafana       |
                                   |    (Visualizer)     |
                                   +---------------------+

```

---

## 🛠️ Stack Components

### Application Services

* **Frontend:** Nginx serving HTML5/JS dashboard and acting as reverse proxy (`:8080`)
* **Backend:** Node.js/Express handling banking logic & transactions (`:5000`)
* **Database:** PostgreSQL 15 storing persistent transactional data (`:5432`)

### Monitoring & Logging Services

* **Prometheus:** Metrics time-series database (`:9090`)
* **Grafana:** Dashboards for metrics & log analysis (`:3000`)
* **Node Exporter:** Machine hardware & OS metrics (`:9100`)
* **cAdvisor:** Resource usage & performance metrics of running containers (`:8080`)
* **Grafana Loki:** High-performance log aggregation system (`:3100`)
* **Promtail:** Agent shipping local container logs to Loki

---

## 📁 Repository Structure

```text
.
├── docker-compose.yml           # Unified orchestration file
├── README.md                    # System documentation
├── backend/                     # Application Tier
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
├── db/                          # Database Tier Initializer
│   └── init.sql
├── frontend/                    # Presentation Tier
│   ├── Dockerfile
│   ├── index.html
│   └── nginx.conf
├── prometheus/                  # Metrics configuration
│   └── prometheus.yml
└── promtail/                    # Log scraper configuration
    └── promtail-config.yml

```

---

## 🚀 Quick Start Guide

### Prerequisites

* [Docker Engine](https://docs.docker.com/get-docker/) (v20.10+)
* [Docker Compose](https://docs.docker.com/compose/install/) (v2.0+)

### Deployment Steps

1. **Clone the repository:**
```bash
git clone [https://github.com/your-username/3tier-bank-monitoring-stack.git](https://github.com/your-username/3tier-bank-monitoring-stack.git)
cd 3tier-bank-monitoring-stack

```


2. **Launch all services:**
```bash
docker compose up -d --build

```


3. **Verify container health:**
```bash
docker compose ps

```



---

## 🌐 Endpoints & Access Points

| Service | Endpoint | Credentials | Purpose |
| --- | --- | --- | --- |
| **Banking Web UI** | `http://localhost:8080` | N/A | Interactive banking dashboard |
| **Backend API** | `http://localhost:8080/api/accounts` | N/A | REST API endpoint |
| **Grafana** | `http://localhost:3000` | `admin` / `admin` | Visualizing metrics & logs |
| **Prometheus UI** | `http://localhost:9090` | N/A | Querying raw metrics |
| **cAdvisor UI** | `http://localhost:8080/containers/` | N/A | Real-time container metrics |

---

## 📊 Grafana Setup Instructions

1. Log into Grafana at `http://localhost:3000`.
2. Navigate to **Connections** > **Data Sources**.
3. **Add Prometheus:**
* URL: `http://prometheus:9090`
* Click **Save & Test**.


4. **Add Loki:**
* URL: `http://loki:3100`
* Click **Save & Test**.


5. **Import Recommended Dashboards:**
* Go to **Dashboards** > **New** > **Import**.
* Import **`1860`** (Node Exporter Full) for host hardware metrics.
* Import **`14282`** (cAdvisor) for Docker container resource usage.



---

## ⚠️ Real-Time Troubleshooting & Issue Resolutions

### Scenario 1: `Conflict. The container name "/node_exporter" is already in use`

* **Root Cause:** A container with the name `node_exporter` already exists on the Docker host, created outside the current Docker Compose lifecycle.
* **Resolution:**
```bash
# Force remove the existing container causing the collision
docker rm -f node_exporter

# Restart the stack
docker compose up -d

```



---

### Scenario 2: Backend crashes with `UnhandledPromiseRejection / ECONNREFUSED` on DB connection

* **Root Cause:** The `backend` container started faster than PostgreSQL finished running internal initialization routines.
* **Resolution:**
1. Ensure `docker-compose.yml` uses `depends_on` with `condition: service_healthy`.
2. Verify the `db` service health check configuration:
```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U bankuser -d bankdb"]
  interval: 5s
  timeout: 5s
  retries: 5

```





---

### Scenario 3: Promtail fails to collect container logs / Permission Denied on `/var/run/docker.sock`

* **Root Cause:** Promtail cannot access the host Docker daemon socket due to insufficient permission flags or missing socket volume mounts.
* **Resolution:**
Confirm socket mounting and read-only flags inside `docker-compose.yml`:
```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock:ro
  - /var/lib/docker/containers:/var/lib/docker/containers:ro

```



---

### Scenario 4: CORS Errors on Web Frontend when connecting to API

* **Root Cause:** Direct client-side JavaScript calls to port `5000` bypassing Nginx reverse proxy policies.
* **Resolution:**
Do not expose port `5000` to the host. Route all `/api` requests through Nginx proxy pass in `nginx.conf`:
```nginx
location /api/ {
    proxy_pass http://backend:5000;
}

```



---

## 🧹 Cleanup Instructions

To tear down all containers, networks, and persistent data volumes:

```bash
docker compose down -v --remove-orphans

```

```

```
