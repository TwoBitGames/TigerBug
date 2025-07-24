export interface User {
    id: number;
    username: string;
    email: string;
    is_admin: boolean;
    is_verified?: boolean;
    oauth_provider?: string;
    oauth_id?: string;
    created_at: string;
    is_project_member?: boolean;
}

export interface Project {
    id: number;
    name: string;
    description: string;
    created_at: string;
}

export interface Attachment {
    id: number;
    related_type: 'post' | 'comment';
    related_id: number;
    file_path: string;
    original_filename: string;
    uploaded_at: string;
}

export interface Post {
    id: number;
    project_id: number;
    author_id: number;
    title: string;
    description: string;
    status: 'Open' | 'In Progress' | 'Closed';
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    issue_type: 'Bug' | 'Feature';
    assignee_id?: number;
    story_points?: number;
    time_estimate?: number;
    due_date?: string;
    labels?: string[];
    is_private: boolean;
    created_at: string;
    updated_at: string;
    author?: User;
    assignee?: User;
    Project?: Project;
    upvotes?: number;
    vote_count?: number;
    user_voted?: boolean;
    attachments?: Attachment[];
    can_edit?: boolean | 'limited';
    can_delete?: boolean;
    can_change_status?: boolean;
    can_edit_manager_fields?: boolean;
}

export interface Comment {
    id: number;
    post_id: number;
    author_id: number;
    message: string;
    created_at: string;
    author?: User;
    attachments?: Attachment[];
    can_edit?: boolean;
    can_delete?: boolean;
}

export interface LoginCredentials {
    identifier: string;
    password: string;
}

export interface RegisterData {
    username: string;
    email: string;
    password: string;
}

export interface UpdateProfileData {
    username: string;
}

export interface CreateProjectData {
    name: string;
    description: string;
}

export interface CreatePostData {
    title: string;
    description: string;
    is_private?: boolean;
    priority?: 'Low' | 'Medium' | 'High' | 'Critical';
    issue_type?: 'Bug' | 'Feature';
    assignee_id?: number;
    story_points?: number;
    time_estimate?: number;
    due_date?: string;
    labels?: string[];
}

export interface UpdatePostData {
    title?: string;
    description?: string;
    status?: 'Open' | 'In Progress' | 'Closed';
    priority?: 'Low' | 'Medium' | 'High' | 'Critical';
    issue_type?: 'Bug' | 'Feature';
    assignee_id?: number;
    story_points?: number;
    time_estimate?: number;
    due_date?: string;
    labels?: string[];
    is_private?: boolean;
}

export interface CreateCommentData {
    message: string;
}

export interface AddMemberData {
    user_id: number;
}

export interface ProjectMembership {
    id: number;
    user_id: number;
    project_id: number;
    user: User;
}

export interface SMTPConfig {
    id: number;
    host: string;
    port: number;
    username: string;
    use_tls: boolean;
    from_address: string;
    created_at?: string;
    updated_at?: string;
}

export interface UpdateSMTPConfigData {
    host: string;
    port: number;
    username: string;
    password?: string;
    use_tls: boolean;
    from_address: string;
}

export interface VerifyEmailData {
    email: string;
    code: string;
}

export interface ResendVerificationData {
    email: string;
}

export interface BrandingConfig {
    id: number;
    app_name: string;
    logo_url: string | null;
    tagline: string | null;
    social_links: {
        github?: string;
        youtube?: string;
        steam?: string;
        twitter?: string;
        linkedin?: string;
        facebook?: string;
        instagram?: string;
        discord?: string;
    } | null;
    client_url: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface UpdateBrandingConfigData {
    app_name: string;
    logo_url?: string | null;
    tagline?: string | null;
    social_links?: {
        github?: string;
        youtube?: string;
        steam?: string;
        twitter?: string;
        linkedin?: string;
        facebook?: string;
        instagram?: string;
        discord?: string;
    } | null;
    client_url?: string | null;
}