-- migrate:up
CREATE TYPE task_status_enum AS ENUM ('ready', 'running', 'failed');
CREATE TYPE task_log_status_enum AS ENUM ('running', 'finish', 'failed');

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_name VARCHAR(255) NOT NULL,
    task_schedule VARCHAR(255) NOT NULL,
    webhook_url TEXT NOT NULL,
    json_payload JSONB NOT NULL,
    max_retry INTEGER NOT NULL,
    task_status task_status_enum NOT NULL DEFAULT 'ready',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE task_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    execution_time INTEGER,
    status task_log_status_enum NOT NULL DEFAULT 'running',
    retry_count INTEGER NOT NULL DEFAULT 0,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- migrate:down
DROP TABLE task_logs;
DROP TABLE tasks;
DROP TYPE task_log_status_enum;
DROP TYPE task_status_enum;