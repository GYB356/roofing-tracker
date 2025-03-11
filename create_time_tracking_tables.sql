-- TimeTrackingSettings table
CREATE TABLE time_tracking_settings (
    user_id VARCHAR(36) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    default_billable_rate DECIMAL(10, 2) NOT NULL DEFAULT 0,
    rounding_interval INTEGER NOT NULL DEFAULT 15,
    auto_stop_timer_after_inactivity INTEGER NOT NULL DEFAULT 30,
    reminder_interval INTEGER NOT NULL DEFAULT 0,
    working_hours JSONB NOT NULL DEFAULT '{
        "0": {"start": "09:00", "end": "17:00", "isWorkDay": false},
        "1": {"start": "09:00", "end": "17:00", "isWorkDay": true},
        "2": {"start": "09:00", "end": "17:00", "isWorkDay": true},
        "3": {"start": "09:00", "end": "17:00", "isWorkDay": true},
        "4": {"start": "09:00", "end": "17:00", "isWorkDay": true},
        "5": {"start": "09:00", "end": "17:00", "isWorkDay": true},
        "6": {"start": "09:00", "end": "17:00", "isWorkDay": false}
    }',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- BillableRate table
CREATE TABLE billable_rates (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) REFERENCES projects(id) ON DELETE CASCADE,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
    task_type_id VARCHAR(36) REFERENCES task_types(id) ON DELETE CASCADE,
    hourly_rate DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    effective_from TIMESTAMP WITH TIME ZONE NOT NULL,
    effective_to TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT check_at_least_one_id CHECK (
        (project_id IS NOT NULL) OR
        (user_id IS NOT NULL) OR
        (task_type_id IS NOT NULL)
    )
);

-- Create indexes for billable rates lookups
CREATE INDEX idx_billable_rates_project ON billable_rates(project_id);
CREATE INDEX idx_billable_rates_user ON billable_rates(user_id);
CREATE INDEX idx_billable_rates_task_type ON billable_rates(task_type_id);
CREATE INDEX idx_billable_rates_dates ON billable_rates(effective_from, effective_to);

-- TimeEntry table
CREATE TABLE time_entries (
    id VARCHAR(36) PRIMARY KEY,
    task_id VARCHAR(36) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    project_id VARCHAR(36) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration INTEGER, -- in seconds
    billable BOOLEAN NOT NULL DEFAULT TRUE,
    invoice_id VARCHAR(36) REFERENCES invoices(id) ON DELETE SET NULL,
    billable_rate DECIMAL(10, 2),
    tags TEXT[] DEFAULT '{}',
    source VARCHAR(10) NOT NULL CHECK (source IN ('timer', 'manual')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT check_duration_or_end_time CHECK (
        (end_time IS NULL AND duration IS NULL) OR -- running timer
        (end_time IS NOT NULL AND duration IS NOT NULL) -- completed entry
    )
);

-- Create indexes for time entries queries
CREATE INDEX idx_time_entries_user ON time_entries(user_id);
CREATE INDEX idx_time_entries_project ON time_entries(project_id);
CREATE INDEX idx_time_entries_task ON time_entries(task_id);
CREATE INDEX idx_time_entries_dates ON time_entries(start_time, end_time);
CREATE INDEX idx_time_entries_invoice ON time_entries(invoice_id);
CREATE INDEX idx_time_entries_active_timer ON time_entries(user_id, end_time) 
    WHERE end_time IS NULL;
CREATE INDEX idx_time_entries_tags ON time_entries USING GIN(tags);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_time_tracking_settings_timestamp
BEFORE UPDATE ON time_tracking_settings
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_billable_rates_timestamp
BEFORE UPDATE ON billable_rates
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_time_entries_timestamp
BEFORE UPDATE ON time_entries
FOR EACH ROW EXECUTE FUNCTION update_timestamp(); 