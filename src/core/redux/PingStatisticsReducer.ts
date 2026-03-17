import {createSlice, type PayloadAction} from "@reduxjs/toolkit";

interface PingStatisticsType {
  mean: number;
  stddev: number;
  z: number;
}

const initialState: PingStatisticsType = {
  mean: 0,
  stddev: 0,
  z: 2.06
}

const pingStatisticsSlice = createSlice({
  name: 'pingStatistics',
  initialState,
  reducers: {
    update: (state: PingStatisticsType, action: PayloadAction<{
      mean: number;
      stddev: number;
    }>) => {
      state.mean = action.payload.mean;
      state.stddev = action.payload.stddev;
    },

    setZ(state: PingStatisticsType, action: PayloadAction<number>) {
      state.z = action.payload;
    }
  }
});

export const pingStatisticsAction = pingStatisticsSlice.actions;
export default pingStatisticsSlice.reducer;
