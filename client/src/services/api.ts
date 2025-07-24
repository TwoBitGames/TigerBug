import { get, post, put, del, uploadFiles } from '../lib/request';
import type {
  User,
  Project,
  Post,
  Comment,
  LoginCredentials,
  RegisterData,
  CreateProjectData,
  CreatePostData,
  UpdatePostData,
  CreateCommentData,
  AddMemberData,
} from '../types';

export const authApi = {
  login: (credentials: LoginCredentials) => 
    post<{ token: string; user: User }>('/auth/login', credentials),
  
  register: (data: RegisterData) => 
    post<{ token: string; user: User }>('/auth/register', data),
  
  getProfile: () => 
    get<{ user: User }>('/auth/profile').then(response => response.user),
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
    uploadFiles('/attachments', files, { related_type: relatedType, related_id: relatedId }),
};
