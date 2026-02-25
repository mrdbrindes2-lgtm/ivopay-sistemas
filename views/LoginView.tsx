// views/LoginView.tsx
import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import {
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { LogoIcon } from '../components/icons/LogoIcon';
import { UserIcon } from '../components/icons/UserIcon';
import { SavedUser, EquipmentType } from '../types';

interface LoginViewProps {
  showNotification: (message: string, type: 'success' | 'error') => void;
  onLoginSuccess: (email: string, password?: string, rememberMe?: boolean, managementTypes?: EquipmentType[]) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ showNotification, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedUsers, setSavedUsers] = useState<SavedUser[]>([]);
  const [showFullLoginForm, setShowFullLoginForm] = useState(false);
  const [managementTypes, setManagementTypes] = useState<EquipmentType[]>([]);

  useEffect(() => {
    try {
        const usersStr = localStorage.getItem('savedUsers');
        const users: SavedUser[] = usersStr ? JSON.parse(usersStr) : [];
        setSavedUsers(users);

        const savedManagementTypes = localStorage.getItem('managementType');
        if (savedManagementTypes) {
            setManagementTypes(JSON.parse(savedManagementTypes));
        } else {
            // Default to all types if no preference is saved
            setManagementTypes(['mesa', 'jukebox', 'grua']);
        }

        const switchEmail = sessionStorage.getItem('switchAccountEmail');
        if (switchEmail) {
            const user = users.find(u => u.email === switchEmail);
            setEmail(switchEmail);
            if (user?.pass) {
                try {
                    setPassword(atob(user.pass));
                } catch (e) { console.error("Failed to decode password", e); }
            }
            setShowFullLoginForm(true);
            sessionStorage.removeItem('switchAccountEmail');
        } else if (users.length === 0) {
            setShowFullLoginForm(true);
        }
    } catch (error) {
        console.error("Failed to load saved data:", error);
        setShowFullLoginForm(true);
        setManagementTypes(['mesa', 'jukebox', 'grua']); // Set default on error too
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (managementTypes.length === 0) {
        showNotification('Você deve selecionar pelo menos um tipo de equipamento para gerenciar.', 'error');
        return;
    }

    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLoginSuccess(email, password, rememberMe, managementTypes);
    } catch (error) {
      console.error("Login failed:", error);
      let message = 'Ocorreu um erro no login.';
      if (error instanceof Error && 'code' in error) {
          const errorCode = (error as { code: string }).code;
          if (['auth/invalid-credential', 'auth/invalid-login-credentials', 'auth/user-not-found', 'auth/wrong-password'].includes(errorCode)) {
              message = 'E-mail ou senha incorretos.';
          }
      }
      showNotification(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleProfileClick = (user: SavedUser) => {
    setEmail(user.email);
    if (user.pass) {
        try {
            setPassword(atob(user.pass)); // Decode and set password
        } catch (e) {
            console.error("Failed to decode password:", e);
            setPassword('');
        }
    } else {
        setPassword('');
    }
    setShowFullLoginForm(true);
  };
  
  const handleShowOtherAccountForm = () => {
    setEmail('');
    setPassword('');
    setShowFullLoginForm(true);
  };

  const handleBackToProfiles = () => {
    setEmail('');
    setPassword('');
    setShowFullLoginForm(false);
  }

  const handleManagementTypeChange = (type: EquipmentType) => {
    setManagementTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700">
        <div className="text-center mb-8">
          <LogoIcon className="h-24 w-auto" />
        </div>

        {showFullLoginForm ? (
          <>
            <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-2">
              {email ? `Olá de volta!` : 'Acessar Conta'}
            </h2>
            <p className="text-center text-slate-500 dark:text-slate-400 mb-6">
              {email ? 'Digite sua senha para continuar.' : 'Use suas credenciais para acessar.'}
            </p>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  readOnly={!!savedUsers.find(u => u.email === email && !!u.pass)}
                  className={`w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500 ${!!savedUsers.find(u => u.email === email && !!u.pass) ? 'cursor-not-allowed bg-slate-200 dark:bg-slate-600' : ''}`}
                  placeholder="seu@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus={!!email}
                  className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500"
                  placeholder="••••••••"
                />
              </div>
              <div className="pt-2">
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-3">O que você gerencia?</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className="flex items-center gap-2 p-3 rounded-lg bg-slate-100 dark:bg-slate-700/50 border-2 border-transparent has-[:checked]:border-lime-500 has-[:checked]:bg-lime-500/10 transition-colors">
                         <input
                            type="checkbox"
                            checked={managementTypes.includes('mesa')}
                            onChange={() => handleManagementTypeChange('mesa')}
                            className="h-5 w-5 rounded border-slate-400 dark:border-slate-500 text-lime-600 bg-transparent focus:ring-lime-500 focus:ring-offset-0"
                        />
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-200">Mesas</span>
                    </label>
                     <label className="flex items-center gap-2 p-3 rounded-lg bg-slate-100 dark:bg-slate-700/50 border-2 border-transparent has-[:checked]:border-lime-500 has-[:checked]:bg-lime-500/10 transition-colors">
                         <input
                            type="checkbox"
                            checked={managementTypes.includes('jukebox')}
                            onChange={() => handleManagementTypeChange('jukebox')}
                            className="h-5 w-5 rounded border-slate-400 dark:border-slate-500 text-lime-600 bg-transparent focus:ring-lime-500 focus:ring-offset-0"
                        />
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-200">Jukebox</span>
                    </label>
                     <label className="flex items-center gap-2 p-3 rounded-lg bg-slate-100 dark:bg-slate-700/50 border-2 border-transparent has-[:checked]:border-lime-500 has-[:checked]:bg-lime-500/10 transition-colors">
                         <input
                            type="checkbox"
                            checked={managementTypes.includes('grua')}
                            onChange={() => handleManagementTypeChange('grua')}
                            className="h-5 w-5 rounded border-slate-400 dark:border-slate-500 text-lime-600 bg-transparent focus:ring-lime-500 focus:ring-offset-0"
                        />
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-200">Gruas</span>
                    </label>
                </div>
              </div>
              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-lime-600 bg-slate-100 dark:bg-slate-900 focus:ring-lime-500"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900 dark:text-slate-300">
                    Lembrar senha
                  </label>
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-lime-500 text-white font-bold py-3 px-6 rounded-md hover:bg-lime-600 disabled:bg-slate-500 transition-colors"
              >
                {isSubmitting ? 'Aguarde...' : 'Entrar'}
              </button>
            </form>
             {savedUsers.length > 0 && (
                <button onClick={handleBackToProfiles} className="w-full text-center text-sm text-slate-500 dark:text-slate-400 mt-6 hover:text-lime-500">
                    &larr; Voltar para seleção de contas
                </button>
            )}
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-6">Selecione uma conta</h2>
            <ul className="space-y-3 mb-6">
              {savedUsers.map(user => (
                <li key={user.email}>
                  <button onClick={() => handleProfileClick(user)} className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    <UserIcon className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{user.email}</span>
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={handleShowOtherAccountForm}
              className="w-full bg-slate-500 text-white font-bold py-3 px-6 rounded-md hover:bg-slate-400 transition-colors"
            >
              Usar outra conta
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginView;