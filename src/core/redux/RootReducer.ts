import {combineReducers} from "redux";
import {configureStore} from "@reduxjs/toolkit";

import PingStatisticsReducer from "./PingStatisticsReducer"
import SharedMemoryReducer from "./SharedMemoryReducer";

const rootReducer = combineReducers({
  PingStatisticsReducer,
  SharedMemoryReducer
});

const store = configureStore({
  reducer: rootReducer,
  devTools: true
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
