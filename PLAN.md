# Task Scheduler Fullstack Application

this directory will be the root folder for a monorepo project with specification:

- backend:
  - nestJS for main restAPI endpoint
    - project structure following: github.com/royib/clean-architecture-nestJS
  - typescript services to act as a cronjob and pushing data to redis list
  - typescript services to act as a consumer and consume data from redis list
- frontend:
  - nextJS typescript
  - tailwindcss
  - redux (persisted in localStorage)
- database: postgreSQL
- cache & pub/sub: redis
- tools:
  - docker-compose
  - dbmate

# MVP

## Phase 1: prototyping main functional

### creating the dummy

first, create a basic dummy webhook service with following feature:

- all request body should be log in console
- create a increment variable everytime the service have a request
- every 7 & 11 consecutive request, the service will return an error response
- the service should return a response in random latency between 100-500 ms to simulate process time
- the service will be dockerize and registered as service in docker-compose

### Base user journey

the user journey will be as followed:

- user create a `task` with data such as:

  - task name
  - task schedule (cron-like format)
  - webhook URL (will be using dummy restAPI discord webhook)
  - JSON payload
  - max_retry
  - task status (ready, running, failed) (default: ready)
  - timestamp (updated_at & created_at)

- data created will be stored in postgreSQL table called `tasks` with a unique UUID

### task scheduling engine (publisher)

first, create an infinite loop running service running that check `task` table from database.

check the `task` schedule with `cronmatch`. if schedule not match with current time, then sleep the service for 5s before continue the loop.

if `task` with schedule matches. LPUSH new data to REDIS list with format

```
LPUSH task_list <task-uuid>:<retry-count>
```

the retry-count should be started from 0.

also, set the `task` status to running.

### task scheduling engine (listener)

create an infinite loop running service that check list `task_list` from redis, if not found, sleep the service for 10s before continue the loop.

if `task_list` is not empty, do:

```
BRPOP task_list
```

the data returned should be look like this

```
<task-uuid>:<retry-count>
```

from this data, the service should do:

- make start_time variable
- make an entry to `task_logs` table with following content:
  - id
  - task_id
  - execution_time (default: null)
  - status (running, finish, failed) (default: running)
  - retry_count (default: 0)
  - message (default: null)
  - created_at timestamp
- get `task` data from database base on `task-uuid`
- do HTTP POST request to `webhook URL` with `JSON payload` body
- count execution time from start_time

if the request return a success response. update the `task_logs` data created before to:

- execution_time -> execution time
- status -> finish
- message: -> response from the post request

also set the `task` status field to **"ready"** again

if the request return a failed response, the service should check <retry-count> from redis data.

the service should do:

- if it less than `max_retry` from `task`:

  - update the task_logs:
    - execution_time -> execution time
    - status -> failed
    - retry_count -> <retry-count> from redis data
    - message: -> response from the post request
  - increment the <retry-count> and run `LPUSH task_list <task-uuid>:<retry-count>`

- if it more/equal than `max_retry` from `task`:

  - update the task_logs:
    - execution_time -> execution time
    - status -> failed
    - retry_count -> <retry-count> from redis data
    - message: -> response from the post request
  - update the `task` status to **"failed"**
