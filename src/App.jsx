import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import router from './routes';

function App() {
  return (
    <GoogleOAuthProvider clientId="407408718192.apps.googleusercontent.com">
    <HelmetProvider>
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '14px',
          },
        }}
      />
    </AuthProvider>
    </HelmetProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
