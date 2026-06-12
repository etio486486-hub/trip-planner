export interface Trip {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  creator_id: string;
  created_at?: string;
}

export interface TripMember {
  id: string;
  trip_id: string;
  user_id: string;
  display_name: string | null;
  created_at?: string;
}

export interface DailyPlan {
  id: string;
  trip_id: string;
  day_number: number;
  created_at?: string;
}

export interface Place {
  id: string;
  daily_plan_id: string;
  name: string;
  google_place_id: string | null;
  latitude: number;
  longitude: number;
  visit_order: number;
  memo: string | null;
  created_at?: string;
}

export interface ChecklistItem {
  id: string;
  trip_id: string;
  category: string;
  title: string;
  is_checked: boolean;
  sort_order: number;
  created_by: string | null;
  created_at?: string;
}

export interface Expense {
  id: string;
  trip_id: string;
  title: string;
  amount: number;
  currency: string;
  category: string;
  expense_date: string;
  paid_by_user_id: string | null;
  paid_by_name: string | null;
  memo: string | null;
  created_at?: string;
}

export interface Database {
  public: {
    Tables: {
      trips: {
        Row: Trip;
        Insert: {
          id?: string;
          title: string;
          start_date: string;
          end_date: string;
          creator_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          start_date?: string;
          end_date?: string;
          creator_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      trip_members: {
        Row: TripMember;
        Insert: {
          id?: string;
          trip_id: string;
          user_id: string;
          display_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          user_id?: string;
          display_name?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      daily_plans: {
        Row: DailyPlan;
        Insert: {
          id?: string;
          trip_id: string;
          day_number: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          day_number?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      places: {
        Row: Place;
        Insert: {
          id?: string;
          daily_plan_id: string;
          name: string;
          google_place_id?: string | null;
          latitude: number;
          longitude: number;
          visit_order?: number;
          memo?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          daily_plan_id?: string;
          name?: string;
          google_place_id?: string | null;
          latitude?: number;
          longitude?: number;
          visit_order?: number;
          memo?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      checklist_items: {
        Row: ChecklistItem;
        Insert: {
          id?: string;
          trip_id: string;
          category?: string;
          title: string;
          is_checked?: boolean;
          sort_order?: number;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          category?: string;
          title?: string;
          is_checked?: boolean;
          sort_order?: number;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      expenses: {
        Row: Expense;
        Insert: {
          id?: string;
          trip_id: string;
          title: string;
          amount: number;
          currency?: string;
          category?: string;
          expense_date?: string;
          paid_by_user_id?: string | null;
          paid_by_name?: string | null;
          memo?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          title?: string;
          amount?: number;
          currency?: string;
          category?: string;
          expense_date?: string;
          paid_by_user_id?: string | null;
          paid_by_name?: string | null;
          memo?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type PlaceInput = {
  name: string;
  google_place_id?: string | null;
  latitude: number;
  longitude: number;
  memo?: string | null;
};

export type PresenceUser = {
  user_id: string;
  display_name: string;
  online_at: string;
};
