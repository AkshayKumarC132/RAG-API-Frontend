export interface OpenAIKey {
  id: string;
  api_key: string;
  masked_key: string;
  name?: string;
  is_valid: boolean;
  created_at: string;
}

export interface CreateOpenAIKeyRequest {
  api_key: string;
  name?: string;
}
