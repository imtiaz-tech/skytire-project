'use client';

import { Provider } from 'react-redux';
import { store } from '@/redux/store';
import { useEffect } from 'react';
import { fetchCurrentUser } from '@/redux/slices/authSlice';

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
      <AuthInitializer>{children}</AuthInitializer>
    </Provider>
  );
}
