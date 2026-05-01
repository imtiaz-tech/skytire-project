'use client';

import { Provider } from 'react-redux';
import { store } from '@/redux/store';
import { useEffect } from 'react';
import { fetchCurrentUser } from '@/redux/slices/authSlice';
import { FingerprintProvider } from '@fingerprint/react';

import { Toaster } from 'react-hot-toast';

function AuthInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // On app load, check if there's an active session
    store.dispatch(fetchCurrentUser());
  }, []);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <FingerprintProvider 
        apiKey="Oh7lxknTJAhkPo6JXyr4"
        scriptUrlPattern="/fpjs/v<version>/<apiKey>/loader_v<loaderVersion>.js"
        endpoint="/fpjs/api"
        region="us"
      >
        <AuthInitializer>{children}</AuthInitializer>
        <Toaster 
          position="top-center" 
          reverseOrder={false}
          toastOptions={{
            duration: 4000,
            style: {
              cursor: 'pointer',
            },
          }}
        />
      </FingerprintProvider>
    </Provider>
  );
}
