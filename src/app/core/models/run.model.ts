export interface Run {
  id: string;
  thread_id: string;
  assistant_id: string;
  status: 'queued' | 'in_progress' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
}