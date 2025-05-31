export interface Assistant {
  id: string;
  name: string;
  vector_store_id?: string;
  vector_store_name?: string;
  instructions?: string;
  created_at: string;
}