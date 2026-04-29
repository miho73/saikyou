import {createSlice, type PayloadAction} from "@reduxjs/toolkit";

interface SharedMemoryType {
  target_time: string;
  arm: boolean;
}

const initialState: SharedMemoryType = {
  target_time: "",
  arm: false
}

const sharedMemorySlice = createSlice({
  name: 'targetTime',
  initialState,
  reducers: {
    updateTargetTime: (state: SharedMemoryType, action: PayloadAction<string>) => {
      state.target_time = action.payload;
    },
    updateArmState: (state: SharedMemoryType, action: PayloadAction<boolean>) => {
      state.arm = action.payload;
    },
    reset(state: SharedMemoryType) {
      state.target_time = initialState.target_time;
    }
  }
});

export const sharedMemoryAction = sharedMemorySlice.actions;
export default sharedMemorySlice.reducer;
