

import { Session, User } from '@supabase/supabase-js';

export type Language = 'en' | 'az' | 'tr';

export interface Translations {
  [key: string]: string;
}

export interface AppPermission {
  id: string;
  role_id: string;
  page_name: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_navigate: boolean;
  can_export: boolean;
}

export type Permission = AppPermission;

export interface Role {
  id: string;
  name: string;
  description?: string;
  is_admin: boolean;
  created_at?: string;
  updated_at?: string;
  typesa : number;
  }

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role_id: string;
  is_active: boolean;
  role?: Role;
  last_known_latitude?: number;
  last_known_longitude?: number;
  last_location_updated_at?: string;
}

export interface Notification {
  id: string;
  message: string;
  link?: string;
  created_by?: string;
  created_at: string;
  type?: 'success' | 'error' | 'info' | 'message';
  onClick?: () => void;
  creator?: { full_name: string };
}

export interface UserNotification {
  id: string;
  user_id: string;
  notification_id: string;
  is_read: boolean;
  notification: Notification;
}

// New Interface for Active Visit
export interface ActiveVisit {
    customerId: string;
    customerName: string;
    startTime: number;
    isSaved?: boolean;
    visitId?: string;
}

export interface AppContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  permissions: Record<string, AppPermission>;
  loading: boolean;
  error: string | null;
  logout: () => Promise<void>;
  language: Language;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
  activePage: string;
  navigateTo: (page: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  notifications: Notification[];
  showNotification: (message: string, type?: 'success' | 'error' | 'info' | 'message', options?: { onClick?: () => void; duration?: number, id?: string | number }) => void;
  dismissNotification: (id: string | number) => void;
  userNotifications: UserNotification[];
  unreadCount: number;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  notificationsPanelOpen: boolean;
  setNotificationsPanelOpen: (open: boolean) => void;
  activeReadingNotification: UserNotification | null;
  setActiveReadingNotification: (n: UserNotification | null) => void;
  passwordRecoveryRequired: boolean;
  setPasswordRecoveryRequired: (required: boolean) => void;
  logoUrl: string | null;
  setLogoUrl: (url: string | null) => void;
  refreshSession: () => Promise<void>;
  
  // Active Visit State
  activeVisit: ActiveVisit | null;
  startVisit: (customer: { id: string, name: string }) => void;
  markVisitAsSaved: (visitId: string) => void;
  endVisit: () => void;
}

export interface CustomerProperty {
  id: string;
  name: string;
  created_by?: string;
  created_at?: string;
}

export interface District {
  id: string;
  name: string;
  created_by?: string;
  created_at?: string;
}

export interface Customer {
  id: string;
  customer_code: string;
  name: string;
  phone_number?: string;
  gps_latitude?: number;
  gps_longitude?: number;
  contact_person_name?: string;
  contact_person_phone?: string;
  address?: string;
  notes?: string;
  is_active: boolean;
  customer_property_id?: string;
  district_id?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  
  customer_property?: CustomerProperty;
  district?: District;
  created_by_user?: { full_name: string };
}

export interface Product {
  id: string;
  product_code: string;
  name: string;
  brand?: string;
  price: number;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Seller {
  id: string;
  user_id: string;
  seller_code: string;
  name: string;
  phone_number?: string;
  email: string;
  is_active: boolean;
  role_id?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  user?: UserProfile;
}

export interface Merch {
  id: string;
  user_id: string;
  merch_code: string;
  name: string;
  phone_number?: string;
  email: string;
  is_active: boolean;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  user?: UserProfile;
}

export interface VisitType {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProductGroup {
  id: string;
  name: string;
  description?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RotaGroup {
  id: string;
  name: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface VisitRequest {
  id: string;
  customer_id: string;
  seller_id?: string;
  merch_id?: string;
  visit_type_id: string;
  request_date: string;
  description?: string;
  photo_url?: string;
  status: 'Pending' | 'Completed' | 'Cancelled';
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
  completion_notes?: string;
  completion_photo_before_url?: string;
  completion_photo_after_url?: string;
  completion_latitude?: number;
  completion_longitude?: number;
  admin_rating?: number;

  customer?: Customer;
  seller?: Seller;
  merch?: Merch;
  visit_type?: VisitType;
}

export interface NoVisitReason {
  id: string;
  name: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface VisitProductGroupDetail {
  id: string;
  visit_id: string;
  seller_visit_id?: string;
  merch_visit_id?: string;
  product_group_id: string;
  before_image_url?: string;
  after_image_url?: string;
  notes?: string;
  product_group?: ProductGroup;
}

export interface SellerVisit {
  id: string;
  seller_id: string;
  customer_id: string;
  visit_type_id?: string;
  visit_datetime: string;
  description?: string;
  before_image_urls?: string[];
  after_image_urls?: string[];
  is_visit: boolean;
  no_visit_reason_id?: string;
  no_visit_description?: string;
  duration_minutes?: number;
  created_by?: string;
  created_at?: string;

  customer?: Customer;
  seller?: Seller;
  visit_type?: VisitType;
  no_visit_reason?: NoVisitReason;
  group_details?: VisitProductGroupDetail[];
}

export interface MerchVisit {
  id: string;
  merch_id: string;
  customer_id: string;
  visit_type_id?: string;
  visit_datetime: string;
  description?: string;
  before_image_urls?: string[];
  after_image_urls?: string[];
  is_visit: boolean;
  no_visit_reason_id?: string;
  no_visit_description?: string;
  duration_minutes?: number;
  created_by?: string;
  created_at?: string;

  customer?: Customer;
  merch?: Merch;
  visit_type?: VisitType;
  no_visit_reason?: NoVisitReason;
  group_details?: VisitProductGroupDetail[];
}

export interface FixedAssetBrand {
  id: string;
  name: string;
  price?: number;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FixedAssetDelivery {
  id: string;
  customer_id: string;
  delivery_date: string;
  gps_latitude?: number;
  gps_longitude?: number;
  description?: string;
  created_by?: string;
  created_at?: string;

  customer?: Customer;
}

export interface FixedAssetDeliveryItem {
  id: string;
  delivery_id: string;
  fixed_asset_brand_id: string;
  quantity: number;
  price: number;
  image_urls?: string[];
  created_by?: string;
  created_at?: string;

  brand?: FixedAssetBrand;
}

export interface CompetitorPriceAnalysis {
  id: string;
  customer_id?: string;
  store_name?: string;
  analysis_date: string;
  description?: string;
  created_by?: string;
  created_at?: string;

  customer?: Customer;
  items?: CompetitorPriceAnalysisItem[];
}

export interface CompetitorPriceAnalysisItem {
  id: string;
  analysis_id: string;
  product_id: string;
  competitor_price: number;
  competitor_product_name?: string | null;
  photo_url?: string | null;
  created_by?: string | null;
  created_at?: string;
  product_price?: number; 

  product?: Product;
}

export interface CompetitorPriceAIReport {
    report_product_id: string;
    product_name: string;
    product_code: string;
    our_price: number;
    lowest_competitor_price: number;
    highest_competitor_price: number;
    average_competitor_price: number;
    total_records: number;
}

export interface ProductDisplay {
  id: string;
  customer_id: string;
  product_name: string;
  start_date: string;
  end_date: string;
  photo_urls?: string[];
  created_by?: string;
  created_at?: string;

  customer?: Customer;
}

export interface ProductShelf {
  id: string;
  customer_id: string;
  product_name: string;
  shelf_datetime: string;
  photo_urls?: string[]; // Kept for backward compatibility if needed
  before_image_urls?: string[];
  after_image_urls?: string[];
  created_by?: string;
  created_at?: string;

  customer?: Customer;
}

export interface ProductInsert {
  id: string;
  customer_id: string;
  product_name: string;
  insert_price: number;
  start_date: string;
  end_date: string;
  photo_urls?: string[];
  created_by?: string;
  created_at?: string;
  updated_at?: string;

  customer?: Customer;
}

export interface ProductInsertSubmission {
  id: string;
  insert_id: string;
  user_id: string;
  description?: string;
  photo_urls?: string[];
  created_at: string;
}

export interface ProblemType {
  id: string;
  name: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Problem {
  id: string;
  customer_id: string;
  problem_type_id: string;
  description?: string;
  photo_url?: string;
  status: 'Pending' | 'Resolved' | 'Not Resolved';
  resolution_note?: string;
  created_by?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at?: string;
  updated_at?: string;

  customer?: Customer;
  problem_type?: ProblemType;
  created_by_user?: { full_name: string };
  resolved_by_user?: { full_name: string };
}

export interface TopCustomer {
    customer_id: string;
    customer_name: string;
    request_count: number;
}

export interface SalesRouteReportItem {
    route_date: string;
    seller_id: string;
    seller_name: string;
    customer_id: string;
    customer_name: string;
    district_name?: string;
    is_completed: boolean;
    visit_id?: string;
    visit_time?: string;
    visit_description?: string;
    is_visit_flag?: boolean;
    no_visit_reason_text?: string;
    no_visit_description_text?: string;
    duration_minutes?: number;
    total_count: number;
}

export interface MerchRouteReportItem {
    route_date: string;
    merch_id: string;
    merch_name: string;
    customer_id: string;
    customer_name: string;
    district_name?: string;
    is_completed: boolean;
    visit_id?: string;
    visit_time?: string;
    visit_description?: string;
    is_visit_flag?: boolean;
    no_visit_reason_text?: string;
    no_visit_description_text?: string;
    duration_minutes?: number;
    total_count: number;
}
