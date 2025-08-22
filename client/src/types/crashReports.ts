export interface CrashReport {
  id: number;
  project_id: number;
  crash_data: string;
  stack_trace?: string;
  error_message?: string;
  application_version?: string;
  operating_system?: string;
  script_line?: string;
  user_story?: string;
  ip_address: string;
  user_agent?: string;
  status: 'New' | 'Reviewing' | 'Converted' | 'Ignored';
  converted_to_issue_id?: number;
  reviewed_by?: number;
  reviewed_at?: string;
  notes?: string;
  crash_frequency: number;
  created_at: string;
  updated_at: string;
  reviewer?: {
    id: number;
    username: string;
    email: string;
  };
  convertedIssue?: {
    id: number;
    title: string;
    status: string;
    description?: string;
  };
}

export interface CrashReportFilters {
  status?: string;
  search?: string;
  sort?: string;
  order?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export interface ConvertToIssueData {
  title?: string;
  description?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  issue_type?: 'Bug' | 'Feature';
  is_private?: boolean;
}
