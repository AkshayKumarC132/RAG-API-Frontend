export interface Document {
  id: string;
  title: string;
  vector_store_id?: string;
  vector_store?: string;
  vector_store_name?: string;
  uploaded_at: string;
  status?: string;
}

export interface DocumentStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message?: string;
}