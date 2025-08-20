import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { setAuthToken } from '../lib/request';

export const OAuthCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useAuth();

  useEffect(() => {
    const handleOAuthCallback = () => {
      const token = searchParams.get('token');
      const userId = searchParams.get('user_id');
      const username = searchParams.get('username');
      const email = searchParams.get('email');
      const isAdmin = searchParams.get('is_admin') === 'true';
      const isVerified = searchParams.get('is_verified') === 'true';
      const profilePicture = searchParams.get('profile_picture');
      const oauthProvider = searchParams.get('oauth_provider');
      const returnUrl = searchParams.get('returnUrl') || '/';
      const error = searchParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        navigate('/login?error=' + encodeURIComponent(error));
        return;
      }

      if (token && userId && username && email) {
        localStorage.setItem('auth_token', token);
        setAuthToken(token);

        const userData = {
          id: parseInt(userId),
          username,
          email,
          is_admin: isAdmin,
          is_verified: isVerified,
          profile_picture: profilePicture || null,
          oauth_provider: oauthProvider || undefined,
          created_at: new Date().toISOString()
        };
        
        setUser(userData);

        navigate(returnUrl);
      } else {
        console.error('Missing OAuth callback data');
        navigate('/login?error=oauth_callback_failed');
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate, setUser]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
};
