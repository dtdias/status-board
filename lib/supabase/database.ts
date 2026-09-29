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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
