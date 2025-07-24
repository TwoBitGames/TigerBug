export interface User {
    id: number;
    email: string;
    is_admin: boolean;
    oauth_provider?: string;
    oauth_id?: string;
    created_at: string;
}

export interface Project {
    id: number;
    name: string;
    description: string;
    created_at: string;
}

export interface Post {
    id: number;
    project_id: number;
    author_id: number;
    title: string;
    description: string;
    status: 'Offen' | 'In Arbeit' | 'Geschlossen';
    is_private: boolean;
    created_at: string;
    updated_at: string;
    author?: User;
    upvotes?: number;
    vote_count?: number;
    user_voted?: boolean;
}

export interface Comment {
    id: number;
    post_id: number;
    author_id: number;
    message: string;
    created_at: string;
    author?: User;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
}

export interface CreateProjectData {
    name: string;
    description: string;
}

export interface CreatePostData {
    title: string;
    description: string;
    is_private?: boolean;
}

export interface UpdatePostData {
    title?: string;
    description?: string;
    status?: 'Offen' | 'In Arbeit' | 'Geschlossen';
    is_private?: boolean;
}

export interface CreateCommentData {
    message: string;
}

export interface AddMemberData {
    user_id: number;
    role: 'Reporter' | 'Manager' | 'Administrator';
}

export interface ProjectMembership {
    id: number;
    user_id: number;
    project_id: number;
    role: 'Reporter' | 'Manager' | 'Administrator';
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