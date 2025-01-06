export interface TimelineEvent {
  id: number;
  incident: number;
  event_type: string;
  description: string;
  operator?: {
    id: number;
    name: string;
  };
  temperature?: number;
  created_at: string;
  metadata?: {
    comment?: string;
    action_taken?: boolean;
    is_read?: boolean;
    action?: string;
    new_level?: number;
  };
}

export interface Notification {
  id: number;
  operator_name: string;
  message: string;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'DELIVERED' | 'READ';
  sent_at: string;
  read_at: string | null;
  created_at: string;
}

export interface Incident {
  id: number;
  device: {
    id: number;
    name: string;
    location: string;
  };
  status: string;
  status_display: string;
  description: string;
  start_time: string;
  end_time: string | null;
  alert_count: number;
  current_escalation_level: number;
  timeline_events: TimelineEvent[];
  notifications: Notification[];
  can_acknowledge: boolean;
  device_name: string;
  device_location: string;
} 