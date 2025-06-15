export interface OpenAIKey {
  id: string;
  api_key: string;
  masked_key: string;
  name?: string;
  is_valid: boolean;
  is_active: boolean;
  provider: string;
}

export interface CreateOpenAIKeyRequest {
  api_key?: string;
  name?: string;
  provider: string;
  is_active?: boolean;
}
