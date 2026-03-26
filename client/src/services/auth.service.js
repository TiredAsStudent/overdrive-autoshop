import api from './auth.service.api';

const authService = {
  /**
   * Standard Email/Password Login (JWT)
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<Object>} The user data and token
   */
  loginWithEmail: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      // Assuming your backend returns { token: "...", user: { ... } }
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      // Throw the error message from the backend, or a generic one
      throw new Error(error.response?.data?.message || 'Failed to login with email.');
    }
  },

  /**
   * Google OAuth 2.0 Login
   * @param {string} googleCredentialToken - The token received from Google Identity Services
   * @returns {Promise<Object>} The user data and token
   */
  loginWithGoogle: async (googleCredentialToken) => {
    try {
      // Send the Google token to your backend to verify and issue your own JWT
      const response = await api.post('/auth/google', { token: googleCredentialToken });
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to authenticate with Google.');
    }
  },

  /**
   * Logout function to clear session data
   */
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // You can also add logic here to redirect the user to the login page
  },

  /**
   * Check if a user is currently authenticated
   * @returns {boolean}
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};

export default authService;