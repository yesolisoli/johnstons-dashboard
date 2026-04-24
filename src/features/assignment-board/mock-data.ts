import type {
  Employee,
  WorkArea,
  Station,
  EmployeeDailyStatus,
  StationAssignment,
} from "./types";

// ===== FILTER (현재 선택 상태) =====

export const mockFilters = {
  work_date: "2026-04-16",
  shift_code: "shift_2",
  mode_code: "after_hog_break",
};

// ===== WORK AREAS =====

export const mockWorkAreas: WorkArea[] = [
  {
    id: "wa_loading",
    name: "Loading Dock",
    color_hex: "#1f8b4c",
    display_order: 1,
  },
  {
    id: "wa_small",
    name: "Small Pro",
    color_hex: "#d89b1d",
    display_order: 2,
  },
  {
    id: "wa_processing",
    name: "Processing Floor",
    color_hex: "#2f66d0",
    display_order: 3,
  },
  {
    id: "wa_meat",
    name: "Meat Cutting",
    color_hex: "#7a4cc2",
    display_order: 4,
  },
  {
    id: "wa_packaging",
    name: "Packaging",
    color_hex: "#cc3232",
    display_order: 5,
  },
];

// ===== STATIONS =====

export const mockStations: Station[] = [
  {
    id: "st_supervisor",
    work_area_id: "wa_packaging",
    name: "Supervisor",
    required_headcount: 1,
    display_order: 1,
  },
  {
    id: "st_lead",
    work_area_id: "wa_packaging",
    name: "Main Room - Lead Hand",
    required_headcount: 1,
    display_order: 2,
  },
  {
    id: "st_feed",
    work_area_id: "wa_packaging",
    name: "Feed Line",
    required_headcount: 1,
    display_order: 3,
  },
  {
    id: "st_end",
    work_area_id: "wa_packaging",
    name: "End of Line",
    required_headcount: 2,
    display_order: 4,
  },
];

// ===== EMPLOYEES =====

export const mockEmployees: Employee[] = [
  {
    id: "emp_1",
    employee_code: "E001",
    full_name: "Margareta",
    default_department: "Packaging",
    active: true,
  },
  {
    id: "emp_2",
    employee_code: "E002",
    full_name: "Oana",
    default_department: "Packaging",
    active: true,
  },
  {
    id: "emp_3",
    employee_code: "E003",
    full_name: "Josh Miller",
    default_department: "Packaging",
    active: true,
  },
  {
    id: "emp_4",
    employee_code: "E004",
    full_name: "Yaw / Harpreet",
    default_department: "Packaging",
    active: true,
  },
];

// ===== DAILY STATUS =====

export const mockEmployeeStatuses: EmployeeDailyStatus[] = [
  {
    id: "status_1",
    employee_id: "emp_1",
    work_date: "2026-04-16",
    shift_code: "shift_2",
    mode_code: "after_hog_break",
    status: "available",
    reason: null,
  },
  {
    id: "status_2",
    employee_id: "emp_2",
    work_date: "2026-04-16",
    shift_code: "shift_2",
    mode_code: "after_hog_break",
    status: "available",
    reason: null,
  },
  {
    id: "status_3",
    employee_id: "emp_3",
    work_date: "2026-04-16",
    shift_code: "shift_2",
    mode_code: "after_hog_break",
    status: "available",
    reason: null,
  },
  {
    id: "status_4",
    employee_id: "emp_4",
    work_date: "2026-04-16",
    shift_code: "shift_2",
    mode_code: "after_hog_break",
    status: "vacation",
    reason: "Family event",
  },
];

// ===== ASSIGNMENTS =====

export const mockAssignments: StationAssignment[] = [
  {
    id: "assign_1",
    employee_id: "emp_1",
    station_id: "st_supervisor",
    work_date: "2026-04-16",
    shift_code: "shift_2",
    mode_code: "after_hog_break",
  },
  {
    id: "assign_2",
    employee_id: "emp_2",
    station_id: "st_lead",
    work_date: "2026-04-16",
    shift_code: "shift_2",
    mode_code: "after_hog_break",
  },
  {
    id: "assign_3",
    employee_id: "emp_3",
    station_id: "st_feed",
    work_date: "2026-04-16",
    shift_code: "shift_2",
    mode_code: "after_hog_break",
  },
];