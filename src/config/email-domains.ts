/**
 * Email Domain Configuration
 *
 * Defines allowed email domains for WestMatch registration.
 * Currently restricted to WIUT students only.
 */

/**
 * Allowed email domains for registration
 *
 * Only users with these email domains can sign up.
 * Add more domains here to expand to other universities.
 *
 * @example
 * // To add multiple universities:
 * export const ALLOWED_EMAIL_DOMAINS = [
 *   "@students.wiut.uz",
 *   "@students.inha.uz",
 *   "@student.tuit.uz",
 * ] as const;
 */
export const ALLOWED_EMAIL_DOMAINS = ["@students.wiut.uz"] as const;
