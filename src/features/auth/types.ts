export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "super_admin";
};

export type SignInCredentials = {
  email: string;
  password: string;
  remember: boolean;
};

export type SignInResponse = {
  user: AdminUser;
};
