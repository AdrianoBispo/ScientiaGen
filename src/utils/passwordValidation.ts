// Common passwords blacklist (top leaked/obvious passwords)
const COMMON_PASSWORDS: Set<string> = new Set([
  '12345678', '123456789', '1234567890', '12345678910',
  'password', 'password1', 'password123',
  'qwerty123', 'qwertyuiop', 'qwerty12345',
  'abcdefgh', 'abcd1234', 'abc12345',
  'admin123', 'admin1234', 'administrator',
  'letmein12', 'welcome1', 'welcome123',
  'iloveyou', 'sunshine1', 'princess1',
  'football1', 'baseball1', 'dragon12',
  'master123', 'monkey123', 'shadow12',
  'login123', 'trustno1', 'superman1',
  '11111111', '22222222', '33333333', '44444444',
  '55555555', '66666666', '77777777', '88888888', '99999999', '00000000',
  'aabbccdd', 'abcabcab', 'asdasdasd',
  'changeme', 'passw0rd', 'p@ssw0rd', 'p@ssword',
  'senha123', 'senha1234', 'mudar123',
  '12341234', '12121212', '87654321',
  'q1w2e3r4', 'qwer1234', 'zxcvbnm1',
  'aa123456', 'abc123456', '1q2w3e4r',
  'computer', 'internet', 'samsung1',
  'whatever', 'starwars', 'batman12',
]);

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: PasswordStrength;
}

export type PasswordStrength = 'empty' | 'weak' | 'fair' | 'good' | 'strong';

export interface PasswordStrengthInfo {
  strength: PasswordStrength;
  score: number; // 0-100
  label: string;
  color: string;
}

/**
 * Validates a password against all rules.
 * - Min 8 characters, max 128
 * - No spaces allowed
 * - All Unicode characters allowed (except spaces)
 * - Checked against common passwords blacklist
 * - No truncation
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`A senha deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres.`);
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    errors.push(`A senha deve ter no máximo ${MAX_PASSWORD_LENGTH} caracteres.`);
  }

  if (/\s/.test(password)) {
    errors.push('A senha não pode conter espaços.');
  }

  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.push('Esta senha é muito comum e insegura. Escolha outra.');
  }

  const strength = getPasswordStrength(password);

  return {
    isValid: errors.length === 0,
    errors,
    strength: strength.strength,
  };
}

/**
 * Calculates real-time password strength.
 */
export function getPasswordStrength(password: string): PasswordStrengthInfo {
  if (!password || password.length === 0) {
    return { strength: 'empty', score: 0, label: '', color: 'bg-gray-200 dark:bg-slate-600' };
  }

  let score = 0;

  // Length scoring (up to 30 points)
  if (password.length >= 8) score += 10;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;

  // Character variety (up to 40 points)
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 10;
  if (/[^a-zA-Z0-9]/.test(password)) score += 10;

  // Unique characters ratio (up to 20 points)
  const uniqueChars = new Set(password).size;
  const uniqueRatio = uniqueChars / password.length;
  if (uniqueRatio > 0.7) score += 20;
  else if (uniqueRatio > 0.5) score += 10;

  // Penalty for common passwords
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    score = Math.min(score, 10);
  }

  // Penalty for repeated characters (e.g., "aaaa")
  const repeatedPattern = /(.)\1{3,}/;
  if (repeatedPattern.test(password)) {
    score = Math.max(0, score - 15);
  }

  // Penalty for sequential patterns
  const sequential = /(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i;
  if (sequential.test(password)) {
    score = Math.max(0, score - 10);
  }

  // Ensure max 100
  score = Math.min(100, score);

  if (score <= 20) {
    return { strength: 'weak', score, label: 'Fraca', color: 'bg-red-500' };
  } else if (score <= 45) {
    return { strength: 'fair', score, label: 'Razoável', color: 'bg-orange-500' };
  } else if (score <= 70) {
    return { strength: 'good', score, label: 'Boa', color: 'bg-yellow-500' };
  } else {
    return { strength: 'strong', score, label: 'Forte', color: 'bg-green-500' };
  }
}

/**
 * Validates email format.
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates the display name.
 */
export function validateName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return 'O nome é obrigatório.';
  }
  if (trimmed.length < 2) {
    return 'O nome deve ter no mínimo 2 caracteres.';
  }
  if (trimmed.length > 100) {
    return 'O nome deve ter no máximo 100 caracteres.';
  }
  return null;
}
