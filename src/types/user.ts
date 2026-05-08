export type UserRole = "CUSTOMER" | "ADMIN";

export type AddressResponse = {
  id: number;
  cep: string;
  street: string;
  number: string;
  complement: string | null;
  city: string;
  state: string;
  createdAt: string;
  updatedAt: string;
};

export type UserResponse = {
  id: number;
  fullName: string;
  email: string;
  cpf: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: UserRole;
  active: boolean;
  address: AddressResponse | null;
  profileCompleteForCheckout: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateUserRequest = {
  fullName: string;
  email: string;
  password: string;
};

export type UpdateMyProfileRequest = {
  fullName?: string | null;
  cpf?: string | null;
  phone?: string | null;
};

export type UpdateAddressRequest = {
  cep: string;
  street: string;
  number: string;
  complement?: string | null;
  city: string;
  state: string;
};

export type UpdateUserRequest = {
  fullName: string;
  email: string;
  cpf: string;
  phone?: string | null;
  address: UpdateAddressRequest;
};

export type CepAddressResponse = {
  cep: string;
  street: string;
  district: string;
  city: string;
  state: string;
};