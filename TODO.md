# Project TODO List

This document outlines the actionable items derived from the `PLAN.md` for the Task Scheduler Full-Stack Application.

## 1. Project Setup

-   [x] Initialize monorepo structure.
-   [x] Set up Backend (NestJS) project.
-   [x] Set up CLI (Commander/BullMQ) project.
-   [x] Set up Frontend (Next.js, TypeScript, Tailwind CSS, Redux) project.
-   [x] Configure PostgreSQL database.
-   [x] Configure Redis for caching and pub/sub.
-   [x] Implement shared `.env` file loading mechanism.
-   [x] Set up Docker Compose for local development and deployment.
-   [x] Integrate DBMate for database migrations.

## 2. Phase 1: Prototyping Main Functionality

### 2.1. Dummy Webhook API Path in Backend

-   [x] Create a new NestJS module/controller for the dummy webhook API.
-   [x] Implement logging of all request bodies to the console.
-   [x] Implement an incrementing variable to track request count.
-   [x] Add logic to return an error response on the 7th and 11th consecutive requests.
-   [x] Introduce random latency (100-500ms) for API responses.
-   [x] Dockerize the dummy webhook service.
-   [x] Register the dummy webhook service in `docker-compose.yml`.

### 2.2. Base User Journey & Task Management

-   [x] Define the `tasks` table schema in PostgreSQL:
    -   `id` (UUID, primary key)
    -   `task_name` (string)
    -   `task_schedule` (string, cron format)
    -   `webhook_url` (string)
    -   `json_payload` (JSONB)
    -   `max_retry` (integer)
    -   `task_status` (enum: `ready`, `running`, `failed`)
    -   `created_at` (timestamp)
    -   `updated_at` (timestamp)
-   [x] Implement DBMate migration to create the `tasks` table.
-   [x] Implement CRUD (Create, Read, Update, Delete) operations for tasks in the NestJS backend.

### 2.3. CLI Publisher Worker

-   [ ] Create a new CLI command for the publisher worker.
-   [ ] Implement a periodic check (e.g., using a cron library or `setInterval`) of the `tasks` table.
-   [ ] Identify tasks with `task_status = 'ready'` and a `task_schedule` that matches the current time.
-   [ ] Integrate BullMQ to add identified tasks as jobs to a queue.
    -   Ensure jobs include necessary task details (e.g., `task-uuid`, initial `retry-count`).
-   [ ] Update the `task_status` to `'running'` for tasks added to the queue.

### 2.4. CLI Listener Worker

-   [ ] Create a new CLI command for the listener worker.
-   [ ] Configure BullMQ worker to listen for jobs from the queue.
-   [ ] For each job received, perform the following:
    -   [ ] Record `start_time`.
    -   [ ] Define the `task_logs` table schema:
        -   `id` (UUID, primary key)
        -   `task_id` (UUID, foreign key to `tasks` table)
        -   `execution_time` (integer, in ms)
        -   `status` (enum: `running`, `finish`, `failed`)
        -   `retry_count` (integer)
        -   `message` (text)
        -   `created_at` (timestamp)
    -   [ ] Implement DBMate migration to create the `task_logs` table.
    -   [ ] Create an initial entry in the `task_logs` table with `status = 'running'`.
    -   [ ] Retrieve full `task` data from the database using `task-uuid`.
    -   [ ] Execute HTTP POST request to `webhook_url` with `json_payload`.
    -   [ ] Calculate `execution_time`.

#### 2.4.1. Successful Execution Handling

-   [ ] If the HTTP POST request is successful:
    -   [ ] Update the corresponding `task_logs` entry:
        -   Set `execution_time` to calculated value.
        -   Set `status` to `'finish'`.
        -   Set `message` to the response from the webhook.
    -   [ ] Update the `task_status` of the parent `task` to `'ready'`.

#### 2.4.2. Failed Execution Handling

-   [ ] If the HTTP POST request fails:
    -   [ ] Check the current `retry-count` against `max_retry` from the `task`.
    -   [ ] **If `retry-count < max_retry`:**
        -   [ ] Update the `task_logs` entry:
            -   Set `execution_time` to calculated value.
            -   Set `status` to `'failed'`.
            -   Set `retry_count` to the current retry count.
            -   Set `message` to the error response.
        -   [ ] Increment `retry-count`.
        -   [ ] Re-add the task to the BullMQ queue with the incremented `retry-count`.
    -   [ ] **If `retry-count >= max_retry`:**
        -   [ ] Update the `task_logs` entry:
            -   Set `execution_time` to calculated value.
            -   Set `status` to `'failed'`.
            -   Set `retry_count` to the current retry count.
            -   Set `message` to the final error response.
        -   [ ] Update the `task_status` of the parent `task` to `'failed'`.