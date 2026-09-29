export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          area: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          area: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          area?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      weekly_reports: {
        Row: {
          id: string;
          user_id: string;
          start_date: string;
          end_date: string;
          presentation_date: string | null;
          highlight: string | null;
          status: "draft" | "ready" | "generated" | "presented" | "archived";
          template_version: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          start_date: string;
          end_date: string;
          presentation_date: string;
          highlight?: string | null;
          status?: "draft" | "ready" | "generated" | "presented" | "archived";
          template_version?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          start_date?: string;
          end_date?: string;
          presentation_date?: string | null;
          highlight?: string | null;
          status?: "draft" | "ready" | "generated" | "presented" | "archived";
          template_version?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      deliveries: {
        Row: {
          id: string;
          weekly_report_id: string;
          title: string;
          description: string;
          status: "delivered" | "in_progress" | "waiting_third_party" | "blocked";
          icon_key: string;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          weekly_report_id: string;
          title: string;
          description: string;
          status: "delivered" | "in_progress" | "waiting_third_party" | "blocked";
          icon_key: string;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          status?: "delivered" | "in_progress" | "waiting_third_party" | "blocked";
          icon_key?: string;
          position?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      incidents: {
        Row: { id: string; weekly_report_id: string; affected_system: string; symptom: string; cause: string | null; action_taken: string; support_people: string | null; status: "resolved" | "in_progress" | "waiting_third_party" | "blocked"; resolved_at: string | null; icon_key: string; position: number; created_at: string; updated_at: string; };
        Insert: { id?: string; weekly_report_id: string; affected_system: string; symptom: string; cause?: string | null; action_taken: string; support_people?: string | null; status: "resolved" | "in_progress" | "waiting_third_party" | "blocked"; resolved_at?: string | null; icon_key: string; position?: number; created_at?: string; updated_at?: string; };
        Update: { affected_system?: string; symptom?: string; cause?: string | null; action_taken?: string; support_people?: string | null; status?: "resolved" | "in_progress" | "waiting_third_party" | "blocked"; resolved_at?: string | null; icon_key?: string; position?: number; updated_at?: string; };
        Relationships: [];
      };
      demands: { Row: { id: string; weekly_report_id: string; title: string; requester_name: string; requester_area: string; involved_areas: string[]; objective: string; status_text: string | null; current_phase: "request_received" | "feasibility_requirements" | "development" | "validation"; icon_key: string; position: number; created_at: string; updated_at: string; }; Insert: { weekly_report_id: string; title: string; requester_name: string; requester_area: string; involved_areas: string[]; objective: string; status_text?: string | null; current_phase: "request_received" | "feasibility_requirements" | "development" | "validation"; icon_key?: string; position?: number; }; Update: { title?: string; requester_name?: string; requester_area?: string; involved_areas?: string[]; objective?: string; status_text?: string | null; current_phase?: "request_received" | "feasibility_requirements" | "development" | "validation"; }; Relationships: []; };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
