import React, { useState, useMemo } from 'react';
import { X, Eye, EyeOff, Mail, Lock, User, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  validatePassword,
  validateEmail,
  validateName,
  getPasswordStrength,
  type PasswordStrengthInfo,
} from '../../../utils/passwordValidation';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export function RegisterModal({ isOpen, onClose, onSwitchToLogin }: RegisterModalProps) {
  const { registerWithEmail, loginWithGoogle } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; password?: string[] }>({});

  const passwordStrength: PasswordStrengthInfo = useMemo(() => getPasswordStrength(password), [password]);

  if (!isOpen) return null;

  function resetForm() {
    setName('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setError('');
    setFieldErrors({});
    setLoading(false);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const errors: { name?: string; email?: string; password?: string[] } = {};

    // Validate name
    const nameError = validateName(name);
    if (nameError) errors.name = nameError;

    // Validate email
    if (!email.trim()) {
      errors.email = 'O e-mail é obrigatório.';
    } else if (!validateEmail(email.trim())) {
      errors.email = 'Informe um e-mail válido.';
    }

    // Validate password
    const passwordResult = validatePassword(password);
    if (!passwordResult.isValid) {
      errors.password = passwordResult.errors;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      await registerWithEmail(email.trim(), password, name.trim());
      handleClose();
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') {
        setError('Este e-mail já está cadastrado. Tente fazer login.');
      } else if (code === 'auth/email-exists-in-google-provider') {
        setError('Este e-mail já está vinculado a uma conta Google. Faça login com o Google.');
      } else if (code === 'auth/invalid-email') {
        setError('E-mail inválido.');
      } else if (code === 'auth/weak-password') {
        setError('A senha é muito fraca. Escolha uma senha mais segura.');
      } else {
        setError('Erro ao criar conta. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      handleClose();
    } catch {
      setError('Erro ao fazer login com Google.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                resetForm();
                onSwitchToLogin();
              }}
              className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-600 dark:hover:text-gray-200 transition cursor-pointer"
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Criar conta</h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 ml-10">
            Preencha os dados abaixo para se cadastrar.
          </p>

          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-600 dark:hover:text-gray-200 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="px-8 pb-4">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Name */}
          <div className="mb-4">
            <label htmlFor="register-name" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
              Nome
            </label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
              <input
                id="register-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors((f) => ({ ...f, name: undefined }));
                }}
                placeholder="Seu nome"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-gray-50 dark:bg-slate-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                  fieldErrors.name ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-slate-600'
                }`}
                autoComplete="name"
                disabled={loading}
              />
            </div>
            {fieldErrors.name && (
              <p className="mt-1 text-xs text-red-500 dark:text-red-400">{fieldErrors.name}</p>
            )}
          </div>

          {/* Email */}
          <div className="mb-4">
            <label htmlFor="register-email" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
              E-mail
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
              <input
                id="register-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((f) => ({ ...f, email: undefined }));
                }}
                placeholder="seu@email.com"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-gray-50 dark:bg-slate-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                  fieldErrors.email ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-slate-600'
                }`}
                autoComplete="email"
                disabled={loading}
              />
            </div>
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-red-500 dark:text-red-400">{fieldErrors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="mb-2">
            <label htmlFor="register-password" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
              Senha
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((f) => ({ ...f, password: undefined }));
                }}
                placeholder="Mínimo 8 caracteres"
                className={`w-full pl-10 pr-12 py-2.5 rounded-xl border bg-gray-50 dark:bg-slate-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                  fieldErrors.password ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-slate-600'
                }`}
                autoComplete="new-password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.password && (
              <div className="mt-1">
                {fieldErrors.password.map((err, i) => (
                  <p key={i} className="text-xs text-red-500 dark:text-red-400">{err}</p>
                ))}
              </div>
            )}
          </div>

          {/* Password Strength Meter */}
          {password.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`}
                    style={{ width: `${passwordStrength.score}%` }}
                  />
                </div>
                <span className={`text-xs font-medium min-w-15 text-right ${
                  passwordStrength.strength === 'weak' ? 'text-red-500' :
                  passwordStrength.strength === 'fair' ? 'text-orange-500' :
                  passwordStrength.strength === 'good' ? 'text-yellow-600 dark:text-yellow-400' :
                  passwordStrength.strength === 'strong' ? 'text-green-500' :
                  'text-gray-400'
                }`}>
                  {passwordStrength.label}
                </span>
              </div>
            </div>
          )}

          {password.length === 0 && <div className="mb-5" />}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium transition flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Criando conta...
              </>
            ) : (
              'Criar conta'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="px-8 flex items-center gap-4 my-2">
          <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
          <span className="text-xs text-gray-400 dark:text-slate-500 uppercase font-medium">ou</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
        </div>

        {/* Google Login */}
        <div className="px-8 pb-4 pt-2">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 transition font-medium cursor-pointer disabled:cursor-not-allowed"
          >
            <GoogleIcon />
            Login com Google
          </button>
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 pt-2 text-center">
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Já tem uma conta?{' '}
            <button
              type="button"
              onClick={() => {
                resetForm();
                onSwitchToLogin();
              }}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
            >
              Entrar
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
