import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { queryClient } from './lib/queryClient';
import router from './routes';

function App() {
  return (
    <GoogleOAuthProvider clientId="149927371809-rad3p8b4in4vjp42rkf09h0dj6l5ojmn.apps.googleusercontent.com">
    <HelmetProvider>
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
    </HelmetProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
