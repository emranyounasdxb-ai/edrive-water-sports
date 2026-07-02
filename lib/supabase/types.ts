export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type VehicleType = Database['public']['Enums']['vehicle_type'];
export type BookingStatus = Database['public']['Enums']['booking_status'];
export type DiscountType = Database['public']['Enums']['discount_type'];
export type StaffRole = 'admin' | 'manager' | 'booking_agent';

type Relationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

export type Database = {
  public: {
    Tables: {
      roles: {
        Row: {
          id: string;
          slug: StaffRole;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: StaffRole;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: StaffRole;
          name?: string;
          description?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          role_id: string;
          full_name: string;
          email: string;
          phone: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role_id: string;
          full_name: string;
          email: string;
          phone?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role_id?: string;
          full_name?: string;
          email?: string;
          phone?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: Relationship[];
      };
      vehicles: {
        Row: {
          id: string;
          name: string;
          slug: string;
          type: VehicleType;
          description: string | null;
          rental_price_aed_per_hour: number;
          sale_price_aed: number | null;
          location: string;
          capacity: number;
          is_available: boolean;
          is_visible_public: boolean;
          is_archived: boolean;
          primary_image_url: string | null;
          sort_order: number;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          type: VehicleType;
          description?: string | null;
          rental_price_aed_per_hour: number;
          sale_price_aed?: number | null;
          location?: string;
          capacity?: number;
          is_available?: boolean;
          is_visible_public?: boolean;
          is_archived?: boolean;
          primary_image_url?: string | null;
          sort_order?: number;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          type?: VehicleType;
          description?: string | null;
          rental_price_aed_per_hour?: number;
          sale_price_aed?: number | null;
          location?: string;
          capacity?: number;
          is_available?: boolean;
          is_visible_public?: boolean;
          is_archived?: boolean;
          primary_image_url?: string | null;
          sort_order?: number;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: Relationship[];
      };
      vehicle_images: {
        Row: {
          id: string;
          vehicle_id: string;
          image_url: string;
          alt_text: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          vehicle_id: string;
          image_url: string;
          alt_text?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          vehicle_id?: string;
          image_url?: string;
          alt_text?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: Relationship[];
      };
      customers: {
        Row: {
          id: string;
          full_name: string;
          phone: string;
          whatsapp: string | null;
          email: string | null;
          country: string | null;
          normalized_email: string | null;
          normalized_phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          phone: string;
          whatsapp?: string | null;
          email?: string | null;
          country?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone?: string;
          whatsapp?: string | null;
          email?: string | null;
          country?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      coupons: {
        Row: {
          id: string;
          code: string;
          discount_type: DiscountType;
          discount_value: number;
          expires_at: string | null;
          max_usage: number | null;
          used_count: number;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          discount_type: DiscountType;
          discount_value: number;
          expires_at?: string | null;
          max_usage?: number | null;
          used_count?: number;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          discount_type?: DiscountType;
          discount_value?: number;
          expires_at?: string | null;
          max_usage?: number | null;
          used_count?: number;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: Relationship[];
      };
      bookings: {
        Row: {
          id: string;
          booking_number: string;
          customer_id: string;
          vehicle_id: string;
          coupon_id: string | null;
          start_at: string;
          end_at: string;
          duration_minutes: number;
          status: BookingStatus;
          gross_amount_aed: number;
          discount_amount_aed: number;
          net_amount_aed: number;
          special_notes: string | null;
          assigned_staff_id: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_number?: string;
          customer_id: string;
          vehicle_id: string;
          coupon_id?: string | null;
          start_at: string;
          end_at: string;
          duration_minutes: number;
          status?: BookingStatus;
          gross_amount_aed?: number;
          discount_amount_aed?: number;
          net_amount_aed?: number;
          special_notes?: string | null;
          assigned_staff_id?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          booking_number?: string;
          customer_id?: string;
          vehicle_id?: string;
          coupon_id?: string | null;
          start_at?: string;
          end_at?: string;
          duration_minutes?: number;
          status?: BookingStatus;
          gross_amount_aed?: number;
          discount_amount_aed?: number;
          net_amount_aed?: number;
          special_notes?: string | null;
          assigned_staff_id?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: Relationship[];
      };
      payments: {
        Row: {
          id: string;
          booking_id: string;
          amount_aed: number;
          payment_method: string | null;
          payment_status: 'unpaid' | 'authorized' | 'paid' | 'failed' | 'refunded';
          provider_reference: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          amount_aed: number;
          payment_method?: string | null;
          payment_status?: 'unpaid' | 'authorized' | 'paid' | 'failed' | 'refunded';
          provider_reference?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          amount_aed?: number;
          payment_method?: string | null;
          payment_status?: 'unpaid' | 'authorized' | 'paid' | 'failed' | 'refunded';
          provider_reference?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: Relationship[];
      };
      logs: {
        Row: {
          id: string;
          actor_user_id: string | null;
          action: string;
          entity_table: string;
          entity_id: string | null;
          before_data: Json | null;
          after_data: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_user_id?: string | null;
          action: string;
          entity_table: string;
          entity_id?: string | null;
          before_data?: Json | null;
          after_data?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_user_id?: string | null;
          action?: string;
          entity_table?: string;
          entity_id?: string | null;
          before_data?: Json | null;
          after_data?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: Relationship[];
      };
    };
    Views: {
      report_booking_summary: {
        Row: {
          booking_day: string | null;
          total_bookings: number | null;
          cancelled_bookings: number | null;
          completed_bookings: number | null;
          estimated_revenue_aed: number | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Functions: {
      create_public_booking: {
        Args: {
          p_full_name: string;
          p_phone: string;
          p_whatsapp: string | null;
          p_email: string | null;
          p_country: string | null;
          p_vehicle_id: string;
          p_start_at: string;
          p_duration_minutes: number;
          p_special_notes: string | null;
          p_coupon_code?: string | null;
        };
        Returns: {
          booking_id: string;
          booking_number: string;
          status: BookingStatus;
          gross_amount_aed: number;
          discount_amount_aed: number;
          net_amount_aed: number;
        }[];
      };
      current_staff_role: {
        Args: Record<PropertyKey, never>;
        Returns: string | null;
      };
      has_staff_role: {
        Args: { allowed_roles: string[] };
        Returns: boolean;
      };
      is_staff: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      vehicle_type: 'jet_ski' | 'jet_car';
      booking_status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
      discount_type: 'percentage' | 'fixed';
    };
    CompositeTypes: Record<PropertyKey, never>;
  };
};
