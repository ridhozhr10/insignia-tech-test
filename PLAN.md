# Task Scheduler Full-Stack Application

This document outlines the plan for a full-stack task scheduler application.

## Project Specifications

This project will be a monorepo with the following specifications:

- **Backend**:
  - **NestJS** for the main REST API endpoint.
- **CLI**:
  - A **Commander-based CLI application** for managing task schedules using **BullMQ**.
  - Jobs added to BullMQ should include **retry attempts**.
- **Frontend**:
  - **vite/react** with **TypeScript**.
  - **Tailwind CSS** for styling.
  - **Redux** for state management, persisted in `localStorage`.
- **Database**: **PostgreSQL**.
- **Cache & Pub/Sub**: **Redis**.
- **Tools**:
  - A **shared `.env` file** in the root project directory and shared packages to load it.
  - **Docker Compose** for deployment.
  - **DBMate** for database migrations.

# MVP

## Phase 1: Prototyping Main Functionality

### Dummy Webhook API Path in Backend

First, we will create a basic dummy webhook API path with the following features:

- All request bodies will be **logged to the console**.
- An **incrementing variable** will track the number of requests received.
- The service will return an **error response** on the 7th and 11th consecutive requests.
- The service will have a **random latency** between 100-500 ms to simulate processing time.
- The service will be **containerized using Docker** and registered as a service in Docker Compose.

### Base User Journey

The user journey is as follows:

1.  The user creates a `task` with the following data:
    - `task_name`: The name of the task.
    - `task_schedule`: A cron-like format for the schedule.
    - `webhook_url`: The URL of the webhook (we will use a dummy Discord webhook for testing).
    - `json_payload`: The JSON payload to be sent to the webhook.
    - `max_retry`: The maximum number of times to retry the task.
    - `task_status`: The status of the task (`ready`, `running`, `failed`). Defaults to `ready`.
    - `created_at` and `updated_at` timestamps.
2.  The created task data will be stored in a **PostgreSQL table** named `tasks` with a unique UUID.
3.  CRUD operations for tasks will be implemented in the backend.

### CLI Publisher Worker

This CLI tool will periodically check the `tasks` table. If a new task with a `ready` status and a matched `task_schedule` is found, the CLI will add a job to **BullMQ** and set the task status to `running`.

### CLI Listener Worker

This CLI tool will act as a worker, listening to **BullMQ** and performing the following actions:

- From the task data, the worker will:
  1.  Record the `start_time`.
  2.  Create an entry in the `task_logs` table with the following content:
      - `id`
      - `task_id`
      - `execution_time` (default: `null`)
      - `status` (`running`, `finish`, `failed`, default: `running`)
      - `retry_count` (default: 0)
      - `message` (default: `null`)
      - `created_at` timestamp
  3.  Get the `task` data from the database based on the `task-uuid`.
  4.  Make an **HTTP POST request** to the `webhook_url` with the `json_payload` as the body.
  5.  Calculate the `execution_time` from the `start_time`.

#### Successful Execution

If the request returns a **success response**, the service will update the `task_logs` data as follows:

- `execution_time`: The calculated execution time.
- `status`: `finish`.
- `message`: The response from the POST request.

The service will also set the `task` status field back to **"ready"**.

#### Failed Execution

If the request returns a **failed response**, the service will attempt to retry the task based on `max_retry` from the task.

- If the `<retry-count>` is **less than** `max_retry` from the `task`:
  - Update the `task_logs` as follows:
    - `execution_time`: The calculated execution time.
    - `status`: `failed`.
    - `retry_count`: The `<retry-count>` from the Redis data.
    - `message`: The response from the POST request.
  - Increment the `<retry-count>` and run `LPUSH task_list <task-uuid>:<retry-count>`.
- If the `<retry-count>` is **greater than or equal to** `max_retry` from the `task`:
  - Update the `task_logs` as follows:
    - `execution_time`: The calculated execution time.
    - `status`: `failed`.
    - `retry_count`: The `<retry-count>` from the Redis data.
    - `message`: The response from the POST request.
  - Update the `task` status to **"failed"**.
