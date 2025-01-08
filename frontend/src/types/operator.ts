export interface Operator {
  id: number;
  name: string;
  user_email: string;
  telegram_id?: string;
  is_active: boolean;
  priority: number;
  priority_display: string;
  created_at: string;
  updated_at: string;
  notification_preferences?: {
    email_enabled: boolean;
    telegram_enabled: boolean;
    phone_enabled: boolean;
  };
}

export interface OperatorFormData {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  telegram_id?: string;
  is_active: boolean;
  priority: number;
  notification_threshold?: number;
  notification_preferences: {
    email_enabled: boolean;
    telegram_enabled: boolean;
    phone_enabled: boolean;
  };
}

export interface ApiOperatorResponse {
  results?: Operator[];
  data?: Operator[];
} 