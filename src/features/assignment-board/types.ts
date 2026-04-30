export type ShiftCode = string;

export type ModeCode =
  | "normal"
  | "hog_break"
  | "after_hog_break"
  | "break_1"
  | "lunch"
  | "break_2";

export type EmployeeStatus = string;

export type ShiftInfo = {
  code: ShiftCode;
  label: string;
  time_range: string;
};

export type WorkAreaModeView = {
  mode_code: ModeCode;
  label: string;
  time_range?: string;
};

export type Employee = {
  id: string;
  employee_code: string | null;
  full_name: string;
  default_department: string | null;
  active: boolean;
};

export type WorkArea = {
  id: string;
  name: string;
  color_hex: string | null;
  display_order: number;
  mode_views?: WorkAreaModeView[];
};

export type Station = {
  id: string;
  work_area_id: string;
  name: string;
  required_headcount: number;
  display_order: number;
  mode_code?: ModeCode;
  protected?: boolean;
};

export type EmployeeDailyStatus = {
  id: string;
  employee_id: string;
  work_date: string;
  shift_code: ShiftCode;
  mode_code: ModeCode;
  status: EmployeeStatus;
  reason: string | null;
};

export type StationAssignment = {
  id: string;
  employee_id: string;
  station_id: string;
  work_date: string;
  shift_code: ShiftCode;
  mode_code: ModeCode;
};

export type AssignmentBoardFilters = {
  work_date: string;
  shift_code: ShiftCode;
  mode_code: ModeCode;
};
