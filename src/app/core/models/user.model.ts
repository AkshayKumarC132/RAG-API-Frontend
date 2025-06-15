export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  created_at: Date;
  tenant_id: string;
  tenant_name?: string;
}

export interface UserOperation extends Partial<User> {
  password?: string;
  currentPassword?: string;
  newPassword?: string;
}
