export interface OpenAIKey {
  id: string;
  key: string;
  masked_key: string;
  name?: string;
  is_valid: boolean;
  created_at: string;
}