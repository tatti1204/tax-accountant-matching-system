-- Performance indexes for tax matching service

-- Users table indexes
CREATE INDEX IF NOT EXISTS "users_email_active_idx" ON "users"("email", "is_active");
CREATE INDEX IF NOT EXISTS "users_role_active_idx" ON "users"("role", "is_active");
CREATE INDEX IF NOT EXISTS "users_last_login_idx" ON "users"("last_login_at");

-- User profiles table indexes  
CREATE INDEX IF NOT EXISTS "user_profiles_prefecture_idx" ON "user_profiles"("prefecture");
CREATE INDEX IF NOT EXISTS "user_profiles_city_idx" ON "user_profiles"("city");
CREATE INDEX IF NOT EXISTS "user_profiles_business_type_idx" ON "user_profiles"("business_type");
CREATE INDEX IF NOT EXISTS "user_profiles_revenue_idx" ON "user_profiles"("annual_revenue");

-- Tax accountants table indexes
CREATE INDEX IF NOT EXISTS "tax_accountants_accepting_clients_idx" ON "tax_accountants"("is_accepting_clients");
CREATE INDEX IF NOT EXISTS "tax_accountants_rating_idx" ON "tax_accountants"("average_rating" DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS "tax_accountants_experience_idx" ON "tax_accountants"("years_of_experience" DESC);
CREATE INDEX IF NOT EXISTS "tax_accountants_reviews_idx" ON "tax_accountants"("total_reviews" DESC);
CREATE INDEX IF NOT EXISTS "tax_accountants_rating_reviews_idx" ON "tax_accountants"("average_rating" DESC, "total_reviews" DESC);
CREATE INDEX IF NOT EXISTS "tax_accountants_license_idx" ON "tax_accountants"("license_number");

-- Specialties table indexes
CREATE INDEX IF NOT EXISTS "specialties_category_active_idx" ON "specialties"("category", "is_active");
CREATE INDEX IF NOT EXISTS "specialties_name_active_idx" ON "specialties"("name", "is_active");

-- Tax accountant specialties table indexes (compound for joins)
CREATE INDEX IF NOT EXISTS "tax_accountant_specialties_ta_idx" ON "tax_accountant_specialties"("tax_accountant_id");
CREATE INDEX IF NOT EXISTS "tax_accountant_specialties_specialty_idx" ON "tax_accountant_specialties"("specialty_id");
CREATE INDEX IF NOT EXISTS "tax_accountant_specialties_experience_idx" ON "tax_accountant_specialties"("tax_accountant_id", "years_of_experience" DESC);

-- Pricing plans table indexes
CREATE INDEX IF NOT EXISTS "pricing_plans_active_display_idx" ON "pricing_plans"("is_active", "display_order");
CREATE INDEX IF NOT EXISTS "pricing_plans_price_idx" ON "pricing_plans"("base_price");
CREATE INDEX IF NOT EXISTS "pricing_plans_ta_active_idx" ON "pricing_plans"("tax_accountant_id", "is_active");

-- AI diagnosis questions table indexes
CREATE INDEX IF NOT EXISTS "ai_diagnosis_questions_active_order_idx" ON "ai_diagnosis_questions"("is_active", "order_index");
CREATE INDEX IF NOT EXISTS "ai_diagnosis_questions_category_idx" ON "ai_diagnosis_questions"("category", "is_active");

-- AI diagnosis results table indexes
CREATE INDEX IF NOT EXISTS "ai_diagnosis_results_user_created_idx" ON "ai_diagnosis_results"("user_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "ai_diagnosis_results_completed_idx" ON "ai_diagnosis_results"("completed_at" DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS "ai_diagnosis_results_user_completed_idx" ON "ai_diagnosis_results"("user_id", "completed_at" DESC NULLS LAST);

-- Matching results table indexes
CREATE INDEX IF NOT EXISTS "matching_results_diagnosis_rank_idx" ON "matching_results"("diagnosis_result_id", "rank");
CREATE INDEX IF NOT EXISTS "matching_results_ta_score_idx" ON "matching_results"("tax_accountant_id", "matching_score" DESC);
CREATE INDEX IF NOT EXISTS "matching_results_score_idx" ON "matching_results"("matching_score" DESC);
CREATE INDEX IF NOT EXISTS "matching_results_created_idx" ON "matching_results"("created_at" DESC);

-- Consultations table indexes
CREATE INDEX IF NOT EXISTS "consultations_user_status_idx" ON "consultations"("user_id", "status");
CREATE INDEX IF NOT EXISTS "consultations_ta_status_idx" ON "consultations"("tax_accountant_id", "status");
CREATE INDEX IF NOT EXISTS "consultations_status_created_idx" ON "consultations"("status", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "consultations_user_created_idx" ON "consultations"("user_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "consultations_ta_created_idx" ON "consultations"("tax_accountant_id", "created_at" DESC);

-- Messages table indexes
CREATE INDEX IF NOT EXISTS "messages_consultation_created_idx" ON "messages"("consultation_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "messages_sender_created_idx" ON "messages"("sender_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "messages_receiver_status_idx" ON "messages"("receiver_id", "status");
CREATE INDEX IF NOT EXISTS "messages_status_created_idx" ON "messages"("status", "created_at" DESC);

-- Reviews table indexes
CREATE INDEX IF NOT EXISTS "reviews_ta_visible_created_idx" ON "reviews"("tax_accountant_id", "is_visible", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "reviews_user_created_idx" ON "reviews"("user_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "reviews_rating_idx" ON "reviews"("rating" DESC);
CREATE INDEX IF NOT EXISTS "reviews_verified_visible_idx" ON "reviews"("is_verified", "is_visible");

-- Contracts table indexes
CREATE INDEX IF NOT EXISTS "contracts_user_status_idx" ON "contracts"("user_id", "status");
CREATE INDEX IF NOT EXISTS "contracts_ta_status_idx" ON "contracts"("tax_accountant_id", "status");
CREATE INDEX IF NOT EXISTS "contracts_status_start_idx" ON "contracts"("status", "start_date" DESC);
CREATE INDEX IF NOT EXISTS "contracts_end_date_idx" ON "contracts"("end_date" NULLS LAST);

-- Billing records table indexes
CREATE INDEX IF NOT EXISTS "billing_records_ta_status_idx" ON "billing_records"("tax_accountant_id", "status");
CREATE INDEX IF NOT EXISTS "billing_records_status_due_idx" ON "billing_records"("status", "due_date");
CREATE INDEX IF NOT EXISTS "billing_records_created_idx" ON "billing_records"("created_at" DESC);

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS "notifications_user_read_created_idx" ON "notifications"("user_id", "is_read", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "notifications_type_created_idx" ON "notifications"("type", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "notifications_unread_idx" ON "notifications"("user_id") WHERE "is_read" = false;

-- Full-text search indexes (for PostgreSQL)
-- These will help with search functionality

-- Tax accountant search
CREATE INDEX IF NOT EXISTS "tax_accountants_search_idx" ON "tax_accountants" 
  USING gin(to_tsvector('english', COALESCE(office_name, '') || ' ' || COALESCE(bio, '')));

-- User profile search
CREATE INDEX IF NOT EXISTS "user_profiles_search_idx" ON "user_profiles" 
  USING gin(to_tsvector('english', 
    COALESCE(first_name, '') || ' ' || 
    COALESCE(last_name, '') || ' ' || 
    COALESCE(company_name, '') || ' ' ||
    COALESCE(business_type, '')
  ));

-- Specialty search
CREATE INDEX IF NOT EXISTS "specialties_search_idx" ON "specialties" 
  USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Composite indexes for common query patterns

-- For tax accountant listing with filters
CREATE INDEX IF NOT EXISTS "tax_accountants_list_idx" ON "tax_accountants"(
  "is_accepting_clients", 
  "average_rating" DESC NULLS LAST, 
  "years_of_experience" DESC
) WHERE "is_accepting_clients" = true;

-- For user consultations list
CREATE INDEX IF NOT EXISTS "consultations_user_list_idx" ON "consultations"(
  "user_id", 
  "status",
  "created_at" DESC
);

-- For tax accountant consultations list  
CREATE INDEX IF NOT EXISTS "consultations_ta_list_idx" ON "consultations"(
  "tax_accountant_id",
  "status", 
  "created_at" DESC
);

-- For matching results with score filtering
CREATE INDEX IF NOT EXISTS "matching_results_quality_idx" ON "matching_results"(
  "diagnosis_result_id",
  "matching_score" DESC,
  "rank"
) WHERE "matching_score" >= 70.0;

-- Performance statistics
-- These comments help track what indexes are optimizing

-- Expected query patterns optimized:
-- 1. Tax accountant search by location, rating, specialties
-- 2. User consultation history
-- 3. Message threading and unread counts  
-- 4. Matching results ranking
-- 5. Review aggregation by tax accountant
-- 6. Notification feed for users
-- 7. Full-text search across profiles and specialties