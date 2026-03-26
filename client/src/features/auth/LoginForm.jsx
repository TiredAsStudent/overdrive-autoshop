import React, { useState } from 'react';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'; 
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Buttons';
import authService from '../../services/auth.service';

const LoginForm = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { id, value } = e.target;
    // This ensures state updates correctly
    setCredentials((prev) => ({ ...prev, [id]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await authService.loginWithEmail(credentials.email, credentials.password);
      // Success! Logic for redirecting goes here
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-5">
      
      {/* Error Message Alert */}
      {error && (
        <div className="flex items-center gap-2 p-3 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg animate-in fade-in slide-in-from-top-1 duration-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="email"
          label="Email Address"
          type="email"
          placeholder="name@overdrive.com"
          value={credentials.email}
          onChange={handleChange}
          required
          disabled={loading}
          error={!!error}
          // Forces text to be visible (dark) on the white background
          className="text-gray-900" 
        />
        
        <div className="relative flex flex-col">
          <Input
            id="password"
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={credentials.password}
            onChange={handleChange}
            required
            disabled={loading}
            error={!!error}
            // pr-12 ensures text doesn't hide behind the eye icon
            className="text-gray-900 pr-12" 
          />
          
          {/* Password Toggle Button */}
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            // Adjusted 'top' to align perfectly with your Input label height
            className="absolute right-3 top-[34px] p-1 text-gray-400 hover:text-gray-600 transition-colors z-10"
            tabIndex="-1" // Prevents tabbing to the eye icon
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <Button 
          type="submit" 
          loading={loading} // Uses the built-in loading logic from your updated Button component
          variant="primary"
          className="w-full"
        >
          {loading ? 'AUTHENTICATING...' : 'SIGN IN'}
        </Button>
      </form>
    </div>
  );
};

export default LoginForm;