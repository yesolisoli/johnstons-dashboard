import type {
  Employee,
  EmployeeDailyStatus,
  ShiftInfo,
  Station,
  StationAssignment,
  WorkArea,
} from "./types";

export const mockWorkDate = "2026-04-16";

export const mockShifts: ShiftInfo[] = [
  { code: "shift_1", label: "1st Shift", time_range: "5:00-7:30" },
  { code: "shift_2", label: "2nd Shift", time_range: "7:45-9:30" },
  { code: "shift_3", label: "3rd Shift", time_range: "10:00-12:00" },
];

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
    mode_views: [
      { mode_code: "hog_break", label: "Hog Break", time_range: "05:00 - 09:00" },
      { mode_code: "after_hog_break", label: "After Hog Break", time_range: "09:30 - 10:00" },
    ],
  },
  {
    id: "wa_packaging",
    name: "Packaging",
    color_hex: "#cc3232",
    display_order: 5,
    mode_views: [
      { mode_code: "hog_break", label: "Hog Break", time_range: "05:00 - 09:00" },
      { mode_code: "after_hog_break", label: "After Hog Break", time_range: "09:30 - 10:00" },
    ],
  },
];

export const mockStations: Station[] = [
  // Loading Dock
  { id: "st_forklift", work_area_id: "wa_loading", name: "Operate Forklift", required_headcount: 1, display_order: 1 },
  { id: "st_loading_support", work_area_id: "wa_loading", name: "Dock Support", required_headcount: 2, display_order: 2 },
  // Small Pro
  { id: "st_sorting", work_area_id: "wa_small", name: "Sorting", required_headcount: 2, display_order: 1 },
  { id: "st_trim", work_area_id: "wa_small", name: "Trim / Pack", required_headcount: 2, display_order: 2 },
  // Processing Floor
  { id: "st_proc_lead", work_area_id: "wa_processing", name: "Lead Hand", required_headcount: 1, display_order: 1 },
  { id: "st_proc_line", work_area_id: "wa_processing", name: "Line Worker", required_headcount: 3, display_order: 2 },
  // Meat Cutting
  { id: "st_cutting", work_area_id: "wa_meat", name: "Cutting Table", required_headcount: 2, display_order: 1 },
  { id: "st_boning", work_area_id: "wa_meat", name: "Boning", required_headcount: 2, display_order: 2 },
  // Packaging
  { id: "st_supervisor", work_area_id: "wa_packaging", name: "Supervisor", required_headcount: 1, display_order: 1 },
  { id: "st_lead", work_area_id: "wa_packaging", name: "Main Room - Lead Hand", required_headcount: 1, display_order: 2 },
  { id: "st_feed", work_area_id: "wa_packaging", name: "Feed Line", required_headcount: 1, display_order: 3 },
  { id: "st_end", work_area_id: "wa_packaging", name: "End of Line", required_headcount: 2, display_order: 4 },
];

export const mockEmployees: Employee[] = [
  { id: "emp_1", employee_code: "E001", full_name: "Margareta", default_department: "Packaging", active: true },
  { id: "emp_2", employee_code: "E002", full_name: "Oana", default_department: "Packaging", active: true },
  { id: "emp_3", employee_code: "E003", full_name: "Josh Miller", default_department: "Meat Cutting", active: true },
  { id: "emp_4", employee_code: "E004", full_name: "Harpreet", default_department: "Meat Cutting", active: true },
  { id: "emp_5", employee_code: "E005", full_name: "Daniel", default_department: "Loading Dock", active: true },
  { id: "emp_6", employee_code: "E006", full_name: "Mina", default_department: "Small Pro", active: true },
  { id: "emp_7", employee_code: "E007", full_name: "Alex", default_department: "Meat Cutting", active: true },
  { id: "emp_8", employee_code: "E008", full_name: "Ryan Cooper", default_department: "Loading Dock", active: true },
  { id: "emp_9", employee_code: "E009", full_name: "Alberto", default_department: "Packaging", active: true },
  { id: "emp_10", employee_code: "E010", full_name: "Anthony", default_department: "Packaging", active: true },
  { id: "emp_11", employee_code: "E011", full_name: "Sandra Kowalski", default_department: "Processing Floor", active: true },
  { id: "emp_12", employee_code: "E012", full_name: "James Nguyen", default_department: "Meat Cutting", active: true },
  { id: "emp_13", employee_code: "E013", full_name: "Priya Sharma", default_department: "Packaging", active: true },
  { id: "emp_14", employee_code: "E014", full_name: "Carlos Reyes", default_department: "Loading Dock", active: true },
  { id: "emp_15", employee_code: "E015", full_name: "Elena Vasquez", default_department: "Small Pro", active: true },
  { id: "emp_16", employee_code: "E016", full_name: "Tommy Larsen", default_department: "Meat Cutting", active: true },
  { id: "emp_17", employee_code: "E017", full_name: "Fatima Al-Hassan", default_department: "Processing Floor", active: true },
  { id: "emp_18", employee_code: "E018", full_name: "David Park", default_department: "Packaging", active: true },
  { id: "emp_19", employee_code: "E019", full_name: "Nina Petrov", default_department: "Small Pro", active: true },
  { id: "emp_20", employee_code: "E020", full_name: "Marcus Williams", default_department: "Loading Dock", active: true },
];

export const mockEmployeeStatuses: EmployeeDailyStatus[] = [
  { id: "status_1", employee_id: "emp_1", work_date: mockWorkDate, shift_code: "shift_1", mode_code: "normal", status: "available", reason: null },
  { id: "status_2", employee_id: "emp_2", work_date: mockWorkDate, shift_code: "shift_1", mode_code: "normal", status: "available", reason: null },
  { id: "status_3", employee_id: "emp_3", work_date: mockWorkDate, shift_code: "shift_1", mode_code: "normal", status: "available", reason: null },
  { id: "status_4", employee_id: "emp_4", work_date: mockWorkDate, shift_code: "shift_1", mode_code: "normal", status: "vacation", reason: "Family event" },
  { id: "status_5", employee_id: "emp_5", work_date: mockWorkDate, shift_code: "shift_1", mode_code: "normal", status: "available", reason: null },
  { id: "status_6", employee_id: "emp_6", work_date: mockWorkDate, shift_code: "shift_1", mode_code: "normal", status: "available", reason: null },
  { id: "status_7", employee_id: "emp_7", work_date: mockWorkDate, shift_code: "shift_1", mode_code: "normal", status: "sick", reason: "Not feeling well" },
];

export const mockAssignments: StationAssignment[] = [
  // Loading Dock - shift 1
  { id: "a1", employee_id: "emp_5", station_id: "st_forklift", work_date: mockWorkDate, shift_code: "shift_1", mode_code: "normal" },
  { id: "a2", employee_id: "emp_8", station_id: "st_loading_support", work_date: mockWorkDate, shift_code: "shift_1", mode_code: "normal" },
  // Loading Dock - shift 2
  { id: "a3", employee_id: "emp_5", station_id: "st_forklift", work_date: mockWorkDate, shift_code: "shift_2", mode_code: "normal" },
  // Packaging - hog_break - shift 1
  { id: "a4", employee_id: "emp_1", station_id: "st_supervisor", work_date: mockWorkDate, shift_code: "shift_1", mode_code: "hog_break" },
  { id: "a5", employee_id: "emp_2", station_id: "st_lead", work_date: mockWorkDate, shift_code: "shift_1", mode_code: "hog_break" },
  { id: "a6", employee_id: "emp_9", station_id: "st_lead", work_date: mockWorkDate, shift_code: "shift_1", mode_code: "hog_break" },
  // Packaging - after_hog_break - shift 1
  { id: "a7", employee_id: "emp_1", station_id: "st_supervisor", work_date: mockWorkDate, shift_code: "shift_1", mode_code: "after_hog_break" },
  { id: "a8", employee_id: "emp_10", station_id: "st_lead", work_date: mockWorkDate, shift_code: "shift_2", mode_code: "after_hog_break" },
  // Small Pro
  { id: "a9", employee_id: "emp_6", station_id: "st_sorting", work_date: mockWorkDate, shift_code: "shift_1", mode_code: "normal" },
  // Meat Cutting - hog_break
  { id: "a10", employee_id: "emp_7", station_id: "st_cutting", work_date: mockWorkDate, shift_code: "shift_1", mode_code: "hog_break" },
  { id: "a11", employee_id: "emp_4", station_id: "st_cutting", work_date: mockWorkDate, shift_code: "shift_2", mode_code: "hog_break" },
  { id: "a12", employee_id: "emp_3", station_id: "st_boning", work_date: mockWorkDate, shift_code: "shift_1", mode_code: "hog_break" },
  // Meat Cutting - after_hog_break
  { id: "a13", employee_id: "emp_7", station_id: "st_boning", work_date: mockWorkDate, shift_code: "shift_1", mode_code: "after_hog_break" },
  { id: "a14", employee_id: "emp_4", station_id: "st_boning", work_date: mockWorkDate, shift_code: "shift_2", mode_code: "after_hog_break" },
  { id: "a15", employee_id: "emp_3", station_id: "st_cutting", work_date: mockWorkDate, shift_code: "shift_2", mode_code: "after_hog_break" },
];
