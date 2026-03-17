import { combineReducers } from "redux";
import {configureStore} from "@reduxjs/toolkit";

import PingStatisticsReducer from "./PingStatisticsReducer"

const rootReducer = combineReducers({
  PingStatisticsReducer,
});

const store = configureStore({
  reducer: rootReducer,
  devTools: true
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
