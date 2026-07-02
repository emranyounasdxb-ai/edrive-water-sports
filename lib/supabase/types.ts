export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type VehicleType = 'jet_ski' | 'jet_car';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type DiscountType = 'percentage' | 'fixed';
export type StaffRole = 'admin' | 'manager' | 'booking_agent';

export type Database = {
  public: {
    Tables: {
      vehicles: {
        Row: {
          id: string;
          name: string;
          slug: string;
          type: VehicleType;
          rental_price_aed_per_hour: number;
          sale_price_aed: number | null;
          location: string;
          is_available: boolean;
          is_visible_public: boolean;
          primary_image_url: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['vehicles']['Row']> & {
          name: string;
          slug: string;
          type: VehicleType;
          rental_price_aed_per_hour: number;
          location: string;
        };
        Update: Partial<Database['public']['Tables']['vehicles']['Row']>;
      };
      bookings: {
        Row: {
          id: string;
          booking_number: string;
          customer_id: string;
          vehicle_id: string;
          start_at: string;
          end_at: string;
          duration_minutes: number;
          status: BookingStatus;
          gross_amount_aed: number;
          discount_amount_aed: number;
          net_amount_aed: number;
          special_notes: string | null;
          created_at: string;
        };
        Insert: never;
        Update: Partial<Database['public']['Tables']['bookings']['Row']>;
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
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['coupons']['Row']> & {
          code: string;
          discount_type: DiscountType;
          discount_value: number;
        };
        Update: Partial<Database['public']['Tables']['coupons']['Row']>;
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
          p_coupon_code: string | null;
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
    };
  };
};
