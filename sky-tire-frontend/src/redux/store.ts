import { configureStore } from '@reduxjs/toolkit';
import tiresReducer from '../features/tires/slice';
import wheelsReducer from '../features/wheels/slice';
import wireWheelsReducer from '../features/wire-wheels/slice';
import accessoriesReducer from '../features/accessories/slice';
import dashboardReducer from '../features/dashboard/slice';
import authReducer from './slices/authSlice';
import usersReducer from './slices/usersSlice';
import brandsReducer from './slices/brandsSlice';
import blogsReducer from './slices/blogsSlice';
import blogCategoriesReducer from './slices/blogCategoriesSlice';
import tireModelsReducer from './slices/tireModelsSlice';


export const store = configureStore({
  reducer: {
    auth: authReducer,
    tires: tiresReducer,
    wheels: wheelsReducer,
    wireWheels: wireWheelsReducer,
    accessories: accessoriesReducer,
    dashboard: dashboardReducer,
    users: usersReducer,
    brands: brandsReducer,
    blogs: blogsReducer,
    blogCategories: blogCategoriesReducer,
    tireModels: tireModelsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
