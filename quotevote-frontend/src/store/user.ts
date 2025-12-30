import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UserData {
  _id: string
  username: string
  email: string
  name: string
  avatar: any
  admin?: boolean
  [key: string]: any
}

interface UserState {
  data: UserData
  isAuthenticated: boolean
}

const initialState: UserState = {
  data: {
    _id: '',
    username: '',
    email: '',
    name: '',
    avatar: null,
    admin: false,
  },
  isAuthenticated: false,
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    SET_USER_DATA: (state, action: PayloadAction<UserData>) => {
      state.data = action.payload
      state.isAuthenticated = true
    },
    CLEAR_USER_DATA: (state) => {
      state.data = initialState.data
      state.isAuthenticated = false
    },
  },
})

export const { SET_USER_DATA, CLEAR_USER_DATA } = userSlice.actions
export default userSlice.reducer
