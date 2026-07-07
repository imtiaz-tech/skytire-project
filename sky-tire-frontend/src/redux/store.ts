import { configureStore } from '@reduxjs/toolkit';
import tiresReducer from './slices/tiresSlice';
import wheelsReducer from './slices/wheelsSlice';
import wireWheelsReducer from '../features/wire-wheels/slice';
import boltOnWireWheelsReducer from '../features/bolt-on-wire-wheels/slice';
import accessoriesReducer from '../features/accessories/slice';
import dashboardReducer from '../features/dashboard/slice';
import authReducer from './slices/authSlice';
import usersReducer from './slices/usersSlice';
import brandsReducer from './slices/brandsSlice';
import blogsReducer from './slices/blogsSlice';
import blogCategoriesReducer from './slices/blogCategoriesSlice';
import tireModelsReducer from './slices/tireModelsSlice';
import tireSizesReducer from './slices/tireSizesSlice';
import inventorySourcesReducer from './slices/inventorySourcesSlice';
import shippingReducer from '../features/shipping/slice';
import accessoryCategoriesReducer from '../features/accessory-categories/slice';
import couponsReducer from '../features/coupons/slice';
import promoBarsReducer from '../features/promo-bars/slice';
import rotatorReducer from '../features/rotator/slice';
import bannerReducer from '../features/banner/slice';
import priceMatchQueriesReducer from '../features/price-match-queries/slice';
import emailTemplatesReducer from '../features/email-templates/slice';


export const store = configureStore({
  reducer: {
    auth: authReducer,
    tires: tiresReducer,
    wheels: wheelsReducer,
    wireWheels: wireWheelsReducer,
    boltOnWireWheels: boltOnWireWheelsReducer,
    accessories: accessoriesReducer,
    dashboard: dashboardReducer,
    users: usersReducer,
    brands: brandsReducer,
    blogs: blogsReducer,
    blogCategories: blogCategoriesReducer,
    tireModels: tireModelsReducer,
    tireSizes: tireSizesReducer,
    inventorySources: inventorySourcesReducer,
    shipping: shippingReducer,
    accessoryCategories: accessoryCategoriesReducer,
    coupons: couponsReducer,
    promoBars: promoBarsReducer,
    rotator: rotatorReducer,
    banner: bannerReducer,
    priceMatchQueries: priceMatchQueriesReducer,
    emailTemplates: emailTemplatesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
