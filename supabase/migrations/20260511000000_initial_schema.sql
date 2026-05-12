-- =================================================================
-- Migration: 0001_initial_schema
-- =================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- =================================================================
-- work_areas
-- =================================================================
CREATE TABLE work_areas (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL,
  color_hex     text,
  display_order integer     NOT NULL,
  deleted_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_work_areas_display_order
  ON work_areas (display_order);


-- =================================================================
-- work_area_mode_views
-- =================================================================
CREATE TABLE work_area_mode_views (
  id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  work_area_id  uuid    NOT NULL REFERENCES work_areas (id) ON DELETE CASCADE,
  mode_code     text    NOT NULL,
  label         text    NOT NULL,
  time_range    text,
  display_order integer NOT NULL,
  CONSTRAINT uq_work_area_mode_views UNIQUE (work_area_id, mode_code)
);

CREATE INDEX idx_work_area_mode_views_work_area
  ON work_area_mode_views (work_area_id, display_order);


-- =================================================================
-- work_area_shifts
-- =================================================================
CREATE TABLE work_area_shifts (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  work_area_id  uuid        NOT NULL REFERENCES work_areas (id) ON DELETE CASCADE,
  code          text        NOT NULL,
  label         text        NOT NULL,
  time_range    text        NOT NULL DEFAULT '',
  display_order integer     NOT NULL,
  deleted_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Partial unique: code must be unique per work area among non-deleted shifts only
CREATE UNIQUE INDEX uq_work_area_shifts_code
  ON work_area_shifts (work_area_id, code)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_work_area_shifts_work_area
  ON work_area_shifts (work_area_id, display_order);


-- =================================================================
-- status_configs
-- Must be created before employee_daily_statuses (FK target)
-- =================================================================
CREATE TABLE status_configs (
  id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  code          text    NOT NULL,
  label         text    NOT NULL,
  color_hex     text,
  unavailable   boolean NOT NULL DEFAULT false,
  protected     boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL,
  CONSTRAINT uq_status_configs_code UNIQUE (code)
);


-- =================================================================
-- employees
-- =================================================================
CREATE TABLE employees (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_code     text        UNIQUE,
  full_name         text        NOT NULL,
  home_work_area_id uuid        REFERENCES work_areas (id) ON DELETE SET NULL,
  active            boolean     NOT NULL DEFAULT true,
  gender            text        CHECK (gender IN ('M', 'F')),
  level             integer     CHECK (level BETWEEN 1 AND 3),
  temporary         boolean     NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_employees_home_work_area
  ON employees (home_work_area_id);

CREATE INDEX idx_employees_active
  ON employees (active);


-- =================================================================
-- employee_qualified_work_areas
-- =================================================================
CREATE TABLE employee_qualified_work_areas (
  employee_id  uuid NOT NULL REFERENCES employees  (id) ON DELETE CASCADE,
  work_area_id uuid NOT NULL REFERENCES work_areas (id) ON DELETE CASCADE,
  PRIMARY KEY (employee_id, work_area_id)
);

CREATE INDEX idx_eqwa_work_area
  ON employee_qualified_work_areas (work_area_id);


-- =================================================================
-- stations
-- =================================================================
CREATE TABLE stations (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  work_area_id        uuid        NOT NULL REFERENCES work_areas (id) ON DELETE CASCADE,
  name                text        NOT NULL,
  required_headcount  integer     NOT NULL DEFAULT 1 CHECK (required_headcount > 0),
  display_order       integer     NOT NULL,
  mode_code           text,
  group_name          text,
  gender_restriction  text        CHECK (gender_restriction IN ('M', 'F')),
  default_employee_id uuid        REFERENCES employees (id) ON DELETE SET NULL,
  protected           boolean     NOT NULL DEFAULT false,
  deleted_at          timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_stations_work_area
  ON stations (work_area_id, display_order);

CREATE INDEX idx_stations_default_employee
  ON stations (default_employee_id);


-- =================================================================
-- employee_daily_statuses
-- =================================================================
CREATE TABLE employee_daily_statuses (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid        NOT NULL REFERENCES employees     (id)   ON DELETE CASCADE,
  work_date   date        NOT NULL,
  status      text        NOT NULL REFERENCES status_configs (code)
                            ON UPDATE CASCADE
                            ON DELETE RESTRICT,
  reason      text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_employee_daily_status UNIQUE (employee_id, work_date)
);

CREATE INDEX idx_employee_daily_statuses_work_date
  ON employee_daily_statuses (work_date);

CREATE INDEX idx_employee_daily_statuses_employee
  ON employee_daily_statuses (employee_id);


-- =================================================================
-- station_assignments
-- =================================================================
CREATE TABLE station_assignments (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid        NOT NULL REFERENCES employees        (id) ON DELETE CASCADE,
  station_id  uuid        NOT NULL REFERENCES stations         (id) ON DELETE CASCADE,
  shift_id    uuid        NOT NULL REFERENCES work_area_shifts (id) ON DELETE CASCADE,
  work_date   date        NOT NULL,
  mode_code   text        NOT NULL DEFAULT 'normal',
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_station_assignment
    UNIQUE (employee_id, station_id, shift_id, work_date, mode_code)
);

CREATE INDEX idx_station_assignments_work_date
  ON station_assignments (work_date);

CREATE INDEX idx_station_assignments_station_date
  ON station_assignments (station_id, work_date);

CREATE INDEX idx_station_assignments_employee_date
  ON station_assignments (employee_id, work_date);


-- =================================================================
-- settings  (single-row — CHECK enforces only id = 1 is valid)
-- =================================================================
CREATE TABLE settings (
  id           integer     PRIMARY KEY CHECK (id = 1),
  announcement text        NOT NULL DEFAULT '',
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Required structural initialization — not seed data.
-- Without this row, UPDATE settings SET ... WHERE id = 1 silently affects 0 rows.
INSERT INTO settings (id, announcement) VALUES (1, '');
