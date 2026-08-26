export type RegisterRole = 'musician' | 'audience';

// O backend também autentica estabelecimento por POST /auth/login, mas essa
// persona é web-only por decisão de produto — o app não tem navegação para ela.
// O tipo existe para o login tratar o caso explicitamente em vez de cair numa
// rota inexistente. Não usar em RegisterResponse/AddRoleResponse.
export type LoginRole = RegisterRole | 'establishment';

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
  role:          LoginRole;
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

// Multi-role (Bloco 10.5) — POST /auth/add-role: usuário já cadastrado com um
// papel adiciona o outro; cpf/phone obrigatórios só para role=musician.
export interface AddRolePayload {
  role:   RegisterRole;
  cpf?:   string;
  phone?: string;
}

export interface AddRoleResponse {
  role:       RegisterRole;
  profile_id: string;
}
