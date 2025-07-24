import { get, post, put, del, uploadFiles } from '../lib/request';
import type {
  User,
  Project,
  Post,
  Comment,
  LoginCredentials,
  RegisterData,
  VerifyEmailData,
  ResendVerificationData,
  CreateProjectData,
  CreatePostData,
  UpdatePostData,
  CreateCommentData,
  AddMemberData,
  ProjectMembership,
  SMTPConfig,
  UpdateSMTPConfigData,
  BrandingConfig,
  UpdateBrandingConfigData,
} from '../types';

export const authApi = {
  login: (credentials: LoginCredentials) => 
    post<{ token: string; user: User }>('/auth/login', credentials),
  
  register: (data: RegisterData) => 
    post<{ token: string; user: User; requiresVerification?: boolean }>('/auth/register', data),
  
  verifyEmail: (data: VerifyEmailData) =>
    post<{ token: string; user: User }>('/auth/verify-email', data),
  
  resendVerificationCode: (data: ResendVerificationData) =>
    post<{ message: string }>('/auth/resend-verification', data),
  
  getProfile: () => 
    get<{ user: User }>('/auth/profile').then(response => response.user),

  checkOnboardingStatus: () =>
    get<{ needsOnboarding: boolean; userCount: number }>('/auth/onboarding-status'),

  setupFirstAdmin: (data: RegisterData) =>
    post<{ token: string; user: User }>('/auth/setup-first-admin', data),
};

export const projectsApi = {
  getAll: () => 
    get<{ projects: Project[] }>('/projects').then(response => response.projects),
  
  getById: (id: number) => 
    get<{ project: Project }>(`/projects/${id}`).then(response => response.project),
  
  create: (data: CreateProjectData) => 
    post<{ project: Project }>('/projects', data).then(response => response.project),
  
  update: (id: number, data: Partial<CreateProjectData>) => 
    put<{ project: Project }>(`/projects/${id}`, data).then(response => response.project),
  
  addMember: (projectId: number, data: AddMemberData) => 
    post(`/projects/${projectId}/members`, data),
  
  removeMember: (projectId: number, userId: number) => 
    del(`/projects/${projectId}/members/${userId}`),
};

export const postsApi = {
  getAll: (projectId: number) => 
    get<{ posts: Post[] }>(`/projects/${projectId}/posts`).then(response => response.posts),
  
  getById: (projectId: number, postId: number) => 
    get<{ post: Post }>(`/projects/${projectId}/posts/${postId}`).then(response => response.post),
  
  create: (projectId: number, data: CreatePostData) => 
    post<{ post: Post }>(`/projects/${projectId}/posts`, data).then(response => response.post),
  
  update: (projectId: number, postId: number, data: UpdatePostData) => 
    put<{ post: Post }>(`/projects/${projectId}/posts/${postId}`, data).then(response => response.post),
  
  delete: (projectId: number, postId: number) => 
    del(`/projects/${projectId}/posts/${postId}`),
  
  toggleVote: (projectId: number, postId: number) => 
    post(`/projects/${projectId}/posts/${postId}/vote`),
};

export const commentsApi = {
  getAll: (projectId: number, postId: number) => 
    get<{ comments: Comment[] }>(`/projects/${projectId}/posts/${postId}/comments`).then(response => response.comments),
  
  create: (projectId: number, postId: number, data: CreateCommentData) => 
    post<{ comment: Comment }>(`/projects/${projectId}/posts/${postId}/comments`, data).then(response => response.comment),
  
  update: (projectId: number, postId: number, commentId: number, data: CreateCommentData) => 
    put<{ comment: Comment }>(`/projects/${projectId}/posts/${postId}/comments/${commentId}`, data).then(response => response.comment),
  
  delete: (projectId: number, postId: number, commentId: number) => 
    del(`/projects/${projectId}/posts/${postId}/comments/${commentId}`),
};

export const attachmentsApi = {
  upload: (files: File[], relatedType: 'post' | 'comment', relatedId: number) => 
    uploadFiles(`/attachments/${relatedType}/${relatedId}`, files),
  
  delete: (id: number) => 
    del(`/attachments/${id}`),
  
  download: (id: number) => {
    const url = `/api/attachments/${id}`;
    window.open(url, '_blank');
  },
};

export const adminApi = {
  getUsers: () => 
    get<{ users: User[] }>('/admin/users').then(response => response.users),
  
  updateUserRole: (userId: number, isAdmin: boolean) => 
    put(`/admin/users/${userId}/role`, { is_admin: isAdmin }),

  getProjectMembers: (projectId: number) => 
    get<{ project: Project; members: ProjectMembership[] }>(`/admin/projects/${projectId}/members`),
  
  addProjectMember: (projectId: number, data: AddMemberData) => 
    post(`/admin/projects/${projectId}/members`, data),
  
  updateProjectMemberRole: (projectId: number, userId: number, role: 'Reporter' | 'Manager' | 'Administrator') => 
    put(`/admin/projects/${projectId}/members/${userId}/role`, { role }),
  
  removeProjectMember: (projectId: number, userId: number) => 
    del(`/admin/projects/${projectId}/members/${userId}`),

  getSMTPConfig: () => 
    get<{ smtpConfig: SMTPConfig }>('/admin/smtp-config').then(response => response.smtpConfig),
  
  updateSMTPConfig: (data: UpdateSMTPConfigData) => 
    put<{ smtpConfig: SMTPConfig }>('/admin/smtp-config', data).then(response => response.smtpConfig),
  
  testSMTPConfig: (testEmail: string) => 
    post('/admin/smtp-config/test', { test_email: testEmail }),

  getBrandingConfig: () => 
    get<{ brandingConfig: BrandingConfig }>('/admin/branding-config').then(response => response.brandingConfig),
  
  updateBrandingConfig: (data: UpdateBrandingConfigData) => 
    put<{ brandingConfig: BrandingConfig }>('/admin/branding-config', data).then(response => response.brandingConfig),
};

export const publicApi = {
  getBrandingConfig: () => 
    get<{ brandingConfig: BrandingConfig }>('/branding-config').then(response => response.brandingConfig),
};
