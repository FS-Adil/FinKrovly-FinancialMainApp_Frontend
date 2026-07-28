import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { SecurityUtils } from '../../utils/security';
import { XSSProtection } from '../../utils/xssProtection';

/**
 * Форма входа в систему
 * 
 * Безопасность:
 * - Все поля проходят санитизацию
 * - Пароль валидируется по сложности
 * - Ошибки не раскрывают детали (например, "пользователь не найден")
 */
const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  /**
   * Валидация формы перед отправкой
   */
  const validateForm = () => {
    const newErrors = {};

    // Валидация email
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!SecurityUtils.validateEmail(email)) {
      newErrors.email = 'Invalid email format';
    }

    // Валидация пароля
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Обработка отправки формы
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validateForm()) return;

    const result = await login(email, password);
    
    if (result.success) {
      // Перенаправляем на главную после успешного входа
      navigate('/');
    } else {
      setServerError(result.error);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Sign In</h2>
        <p className="subtitle">Enter your credentials to continue</p>

        {/* Ошибка от сервера */}
        {serverError && (
          <div className="error-banner">
            {XSSProtection.escapeHTML(serverError)}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Поле Email */}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={loading}
              autoComplete="email"
              className={errors.email ? 'error' : ''}
            />
            {errors.email && (
              <span className="field-error">{XSSProtection.escapeHTML(errors.email)}</span>
            )}
          </div>

          {/* Поле Пароль */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={loading}
              autoComplete="current-password"
              className={errors.password ? 'error' : ''}
            />
            {errors.password && (
              <span className="field-error">{XSSProtection.escapeHTML(errors.password)}</span>
            )}
          </div>

          {/* Кнопка отправки */}
          <button 
            type="submit" 
            disabled={loading}
            className="submit-btn"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;