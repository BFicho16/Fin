export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      guest_onboarding_sessions: {
        Row: {
          created_at: string | null
          dietary_preferences: Json | null
          email: string | null
          expires_at: string | null
          health_metrics: Json | null
          last_accessed: string | null
          migrated: boolean | null
          migrated_to_user_id: string | null
          profile: Json | null
          routines: Json | null
          session_id: string
          sleep_routine: Json | null
        }
        Insert: {
          created_at?: string | null
          dietary_preferences?: Json | null
          email?: string | null
          expires_at?: string | null
          health_metrics?: Json | null
          last_accessed?: string | null
          migrated?: boolean | null
          migrated_to_user_id?: string | null
          profile?: Json | null
          routines?: Json | null
          session_id?: string
          sleep_routine?: Json | null
        }
        Update: {
          created_at?: string | null
          dietary_preferences?: Json | null
          email?: string | null
          expires_at?: string | null
          health_metrics?: Json | null
          last_accessed?: string | null
          migrated?: boolean | null
          migrated_to_user_id?: string | null
          profile?: Json | null
          routines?: Json | null
          session_id?: string
          sleep_routine?: Json | null
        }
        Relationships: []
      }
      mastra_ai_spans: {
        Row: {
          attributes: Json | null
          createdAt: string
          createdAtZ: string | null
          endedAt: string | null
          endedAtZ: string | null
          error: Json | null
          input: Json | null
          isEvent: boolean
          links: Json | null
          metadata: Json | null
          name: string
          output: Json | null
          parentSpanId: string | null
          scope: Json | null
          spanId: string
          spanType: string
          startedAt: string
          startedAtZ: string | null
          traceId: string
          updatedAt: string | null
          updatedAtZ: string | null
        }
        Insert: {
          attributes?: Json | null
          createdAt: string
          createdAtZ?: string | null
          endedAt?: string | null
          endedAtZ?: string | null
          error?: Json | null
          input?: Json | null
          isEvent: boolean
          links?: Json | null
          metadata?: Json | null
          name: string
          output?: Json | null
          parentSpanId?: string | null
          scope?: Json | null
          spanId: string
          spanType: string
          startedAt: string
          startedAtZ?: string | null
          traceId: string
          updatedAt?: string | null
          updatedAtZ?: string | null
        }
        Update: {
          attributes?: Json | null
          createdAt?: string
          createdAtZ?: string | null
          endedAt?: string | null
          endedAtZ?: string | null
          error?: Json | null
          input?: Json | null
          isEvent?: boolean
          links?: Json | null
          metadata?: Json | null
          name?: string
          output?: Json | null
          parentSpanId?: string | null
          scope?: Json | null
          spanId?: string
          spanType?: string
          startedAt?: string
          startedAtZ?: string | null
          traceId?: string
          updatedAt?: string | null
          updatedAtZ?: string | null
        }
        Relationships: []
      }
      mastra_evals: {
        Row: {
          agent_name: string
          created_at: string
          created_atZ: string | null
          createdAt: string | null
          createdAtZ: string | null
          global_run_id: string
          input: string
          instructions: string
          metric_name: string
          output: string
          result: Json
          run_id: string
          test_info: Json | null
        }
        Insert: {
          agent_name: string
          created_at: string
          created_atZ?: string | null
          createdAt?: string | null
          createdAtZ?: string | null
          global_run_id: string
          input: string
          instructions: string
          metric_name: string
          output: string
          result: Json
          run_id: string
          test_info?: Json | null
        }
        Update: {
          agent_name?: string
          created_at?: string
          created_atZ?: string | null
          createdAt?: string | null
          createdAtZ?: string | null
          global_run_id?: string
          input?: string
          instructions?: string
          metric_name?: string
          output?: string
          result?: Json
          run_id?: string
          test_info?: Json | null
        }
        Relationships: []
      }
      mastra_messages: {
        Row: {
          content: string
          createdAt: string
          createdAtZ: string | null
          id: string
          resourceId: string | null
          role: string
          thread_id: string
          type: string
        }
        Insert: {
          content: string
          createdAt: string
          createdAtZ?: string | null
          id: string
          resourceId?: string | null
          role: string
          thread_id: string
          type: string
        }
        Update: {
          content?: string
          createdAt?: string
          createdAtZ?: string | null
          id?: string
          resourceId?: string | null
          role?: string
          thread_id?: string
          type?: string
        }
        Relationships: []
      }
      mastra_resources: {
        Row: {
          createdAt: string
          createdAtZ: string | null
          id: string
          metadata: Json | null
          updatedAt: string
          updatedAtZ: string | null
          workingMemory: string | null
        }
        Insert: {
          createdAt: string
          createdAtZ?: string | null
          id: string
          metadata?: Json | null
          updatedAt: string
          updatedAtZ?: string | null
          workingMemory?: string | null
        }
        Update: {
          createdAt?: string
          createdAtZ?: string | null
          id?: string
          metadata?: Json | null
          updatedAt?: string
          updatedAtZ?: string | null
          workingMemory?: string | null
        }
        Relationships: []
      }
      mastra_scorers: {
        Row: {
          additionalContext: Json | null
          analyzePrompt: string | null
          analyzeStepResult: Json | null
          createdAt: string
          createdAtZ: string | null
          entity: Json | null
          entityId: string | null
          entityType: string | null
          extractPrompt: string | null
          extractStepResult: Json | null
          generateReasonPrompt: string | null
          generateScorePrompt: string | null
          id: string
          input: Json
          metadata: Json | null
          output: Json
          preprocessPrompt: string | null
          preprocessStepResult: Json | null
          reason: string | null
          reasonPrompt: string | null
          resourceId: string | null
          runId: string
          runtimeContext: Json | null
          score: number
          scorer: Json
          scorerId: string
          source: string
          spanId: string | null
          threadId: string | null
          traceId: string | null
          updatedAt: string
          updatedAtZ: string | null
        }
        Insert: {
          additionalContext?: Json | null
          analyzePrompt?: string | null
          analyzeStepResult?: Json | null
          createdAt: string
          createdAtZ?: string | null
          entity?: Json | null
          entityId?: string | null
          entityType?: string | null
          extractPrompt?: string | null
          extractStepResult?: Json | null
          generateReasonPrompt?: string | null
          generateScorePrompt?: string | null
          id: string
          input: Json
          metadata?: Json | null
          output: Json
          preprocessPrompt?: string | null
          preprocessStepResult?: Json | null
          reason?: string | null
          reasonPrompt?: string | null
          resourceId?: string | null
          runId: string
          runtimeContext?: Json | null
          score: number
          scorer: Json
          scorerId: string
          source: string
          spanId?: string | null
          threadId?: string | null
          traceId?: string | null
          updatedAt: string
          updatedAtZ?: string | null
        }
        Update: {
          additionalContext?: Json | null
          analyzePrompt?: string | null
          analyzeStepResult?: Json | null
          createdAt?: string
          createdAtZ?: string | null
          entity?: Json | null
          entityId?: string | null
          entityType?: string | null
          extractPrompt?: string | null
          extractStepResult?: Json | null
          generateReasonPrompt?: string | null
          generateScorePrompt?: string | null
          id?: string
          input?: Json
          metadata?: Json | null
          output?: Json
          preprocessPrompt?: string | null
          preprocessStepResult?: Json | null
          reason?: string | null
          reasonPrompt?: string | null
          resourceId?: string | null
          runId?: string
          runtimeContext?: Json | null
          score?: number
          scorer?: Json
          scorerId?: string
          source?: string
          spanId?: string | null
          threadId?: string | null
          traceId?: string | null
          updatedAt?: string
          updatedAtZ?: string | null
        }
        Relationships: []
      }
      mastra_threads: {
        Row: {
          createdAt: string
          createdAtZ: string | null
          id: string
          metadata: string | null
          resourceId: string
          title: string
          updatedAt: string
          updatedAtZ: string | null
        }
        Insert: {
          createdAt: string
          createdAtZ?: string | null
          id: string
          metadata?: string | null
          resourceId: string
          title: string
          updatedAt: string
          updatedAtZ?: string | null
        }
        Update: {
          createdAt?: string
          createdAtZ?: string | null
          id?: string
          metadata?: string | null
          resourceId?: string
          title?: string
          updatedAt?: string
          updatedAtZ?: string | null
        }
        Relationships: []
      }
      mastra_traces: {
        Row: {
          attributes: Json | null
          createdAt: string
          createdAtZ: string | null
          endTime: number
          events: Json | null
          id: string
          kind: number
          links: Json | null
          name: string
          other: string | null
          parentSpanId: string | null
          scope: string
          startTime: number
          status: Json | null
          traceId: string
        }
        Insert: {
          attributes?: Json | null
          createdAt: string
          createdAtZ?: string | null
          endTime: number
          events?: Json | null
          id: string
          kind: number
          links?: Json | null
          name: string
          other?: string | null
          parentSpanId?: string | null
          scope: string
          startTime: number
          status?: Json | null
          traceId: string
        }
        Update: {
          attributes?: Json | null
          createdAt?: string
          createdAtZ?: string | null
          endTime?: number
          events?: Json | null
          id?: string
          kind?: number
          links?: Json | null
          name?: string
          other?: string | null
          parentSpanId?: string | null
          scope?: string
          startTime?: number
          status?: Json | null
          traceId?: string
        }
        Relationships: []
      }
      mastra_workflow_snapshot: {
        Row: {
          createdAt: string
          createdAtZ: string | null
          resourceId: string | null
          run_id: string
          snapshot: string
          updatedAt: string
          updatedAtZ: string | null
          workflow_name: string
        }
        Insert: {
          createdAt: string
          createdAtZ?: string | null
          resourceId?: string | null
          run_id: string
          snapshot: string
          updatedAt: string
          updatedAtZ?: string | null
          workflow_name: string
        }
        Update: {
          createdAt?: string
          createdAtZ?: string | null
          resourceId?: string | null
          run_id?: string
          snapshot?: string
          updatedAt?: string
          updatedAtZ?: string | null
          workflow_name?: string
        }
        Relationships: []
      }
      memory_messages_768: {
        Row: {
          embedding: string | null
          id: number
          metadata: Json | null
          vector_id: string
        }
        Insert: {
          embedding?: string | null
          id?: number
          metadata?: Json | null
          vector_id: string
        }
        Update: {
          embedding?: string | null
          id?: number
          metadata?: Json | null
          vector_id?: string
        }
        Relationships: []
      }
      user_routines: {
        Row: {
          content: string
          created_at: string
          deleted_at: string | null
          id: string
          status: string
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          content: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          status?: string
          updated_at?: string
          user_id: string
          version: number
        }
        Update: {
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string
          stripe_subscription_id: string | null
          status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'
          plan_type: 'monthly' | 'weekly'
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_customer_id: string
          stripe_subscription_id?: string | null
          status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'
          plan_type: 'monthly' | 'weekly'
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string | null
          status?: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'
          plan_type?: 'monthly' | 'weekly'
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_age: { Args: { birth_date: string }; Returns: number }
      get_current_age: { Args: { birth_date: string }; Returns: number }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
