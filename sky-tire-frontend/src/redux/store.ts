import { configureStore } from '@reduxjs/toolkit';
import tiresReducer from '../features/tires/slice';
import wheelsReducer from '../features/wheels/slice';
import wireWheelsReducer from '../features/wire-wheels/slice';
import accessoriesReducer from '../features/accessories/slice';
import dashboardReducer from '../features/dashboard/slice';
import authReducer from './slices/authSlice';
import usersReducer from './slices/usersSlice';


export const store = configureStore({
  reducer: {
    auth: authReducer,
    tires: tiresReducer,
    wheels: wheelsReducer,
    wireWheels: wireWheelsReducer,
    accessories: accessoriesReducer,
    dashboard: dashboardReducer,
    users: usersReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
