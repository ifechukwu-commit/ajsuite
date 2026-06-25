// Only these 2 emails can see the super_admin dashboard. They are admin-only —
// they do not get a lawyer dashboard or workspace of their own.
export const ADMIN_EMAILS = [
  'ajsuitesupport@gmail.com',
  'ahia4.agent@gmail.com',
]

// These 3 used to be admins. They are now permanent free-forever lawyer
// accounts with full access (plan stays solo/chamber, never expires).
export const FREE_FOREVER_EMAILS = [
  'ajcasemanager46@gmail.com',
  'ifechukwudarlington.dev@gmail.com',
  'chiwetaluifechukwu@gmail.com',
]

export const SUPPORT_EMAIL = 'ajsuitesupport@gmail.com'

export const TRIAL_DAYS = 30
export const SUBSCRIPTION_PRICE_KOBO = 850000 // ₦8,500/month
export const STORAGE_CAP_BYTES_UNPAID = 150 * 1024 * 1024 // 150MB
