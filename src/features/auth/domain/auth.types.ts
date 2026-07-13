export type RegisterRole = 'musician' | 'audience';

export interface RegisterPayload {
  name:     string;
  email:    string;
  password: string;
  role:     RegisterRole;
  cpf?:     string;
  phone?:   string;
}

// Espelha RegisterOutput do backend (snake_case) — DTO de wire, não precisa camelCase
export interface RegisterResponse {
  access_token:  string;
  refresh_token: string;
  expires_in:    number;
  token_type:    string;
  role:          RegisterRole;
  profile_id:    string;
}

export interface LoginPayload {
  email:    string;
  password: string;
}

// Espelha LoginOutput do backend
export interface LoginResponse {
  access_token:  string;
  refresh_token: string;
  expires_in:    number;
  token_type:    string;
  role:          RegisterRole;
  profile_id:    string;
}

export interface SocialSignupPayload {
  role:   RegisterRole;
  cpf?:   string;
  phone?: string;
}

// Espelha SocialSignupOutput do backend
export interface SocialSignupResponse {
  role:       RegisterRole;
  profile_id: string;
}
