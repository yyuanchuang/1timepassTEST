import React, { useState } from 'react';
import { User, UserRole, UserStatus } from '../types';
import { MockService } from '../services/mockDb';
import { Briefcase, KeyRound, HardHat, UserPlus, ArrowLeft, Eye } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form Fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [workstation, setWorkstation] = useState('Y1');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Simulate network delay
      await new Promise(r => setTimeout(r, 600));
      const user = await MockService.login(username, password);
      onLogin(user);
    } catch (err: any) {
      setError(err.message === 'Invalid credentials' ? '帳號或密碼錯誤' : (err.message || '登入失敗'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      await new Promise(r => setTimeout(r, 600));
      const newUser: User = {
        id: username,
        name: fullName,
        password: password,
        workstation: workstation,
        role: UserRole.WORKER, // Default role
        status: UserStatus.PENDING
      };
      await MockService.registerUser(newUser);
      setSuccessMsg('註冊成功！請等待管理員核准。');
      setIsRegistering(false);
      // Clear sensitive fields
      setPassword('');
    } catch (err: any) {
      setError(err.message === 'Username already exists' ? '使用者名稱已存在' : '註冊失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    MockService.login('guest').then(onLogin);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 transition-all">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-brand-100 rounded-full flex items-center justify-center mb-4 text-brand-600">
             <Briefcase className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">WeldTrack Pro</h2>
          <p className="mt-2 text-gray-600">{isRegistering ? '建立新帳號' : '一次合格獎金申請入口'}</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-md text-sm text-center">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 bg-green-50 text-green-700 p-3 rounded-md text-sm text-center">
            {successMsg}
          </div>
        )}

        {isRegistering ? (
          /* REGISTRATION FORM */
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">工作站 (廠區)</label>
              <select
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm rounded-md border bg-white text-gray-900"
                value={workstation}
                onChange={(e) => setWorkstation(e.target.value)}
              >
                <option value="Y1">Y1 (Yard 1)</option>
                <option value="Y2">Y2 (Yard 2)</option>
                <option value="Y3">Y3 (Yard 3)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">全名</label>
              <input
                type="text"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-brand-500 focus:border-brand-500 bg-white text-gray-900"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="例如: 王小明"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">使用者名稱 (工號)</label>
              <input
                type="text"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-brand-500 focus:border-brand-500 bg-white text-gray-900"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">密碼</label>
              <input
                type="password"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-brand-500 focus:border-brand-500 bg-white text-gray-900"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none disabled:opacity-50"
            >
              {loading ? '註冊中...' : '送出註冊'}
            </button>
            <button
              type="button"
              onClick={() => setIsRegistering(false)}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 mt-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> 返回登入
            </button>
          </form>
        ) : (
          /* LOGIN FORM */
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">使用者名稱</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserPlus className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 sm:text-sm bg-white text-gray-900"
                  placeholder="使用者名稱"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">密碼</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 sm:text-sm bg-white text-gray-900"
                  placeholder="密碼"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none disabled:opacity-50 transition-colors"
            >
              {loading ? '驗證中...' : '登入'}
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">或</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsRegistering(true)}
                className="flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                註冊
              </button>
              <button
                type="button"
                onClick={handleGuestLogin}
                className="flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Eye className="h-4 w-4 mr-2" /> 訪客預覽
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;