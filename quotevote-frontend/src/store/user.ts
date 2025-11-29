/* eslint-disable no-param-reassign */
import { createSlice, PayloadAction, Dispatch } from '@reduxjs/toolkit'
import axios, { AxiosResponse } from 'axios'
import { jwtDecode } from 'jwt-decode'
import { getBaseServerUrl } from '@/lib/utils/getServerUrl'
import {
  UserState,
  UserLoginSuccessPayload,
  UserLoginFailurePayload,
  DecodedToken,
} from '@/types/store'

const initialState: UserState = {
  loading: false,
  loginError: null,
  data: {},
  isLoggedIn: false,
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    USER_LOGIN_REQUEST: (state) => {
      state.loading = true
    },
    USER_LOGIN_SUCCESS: (state, action: PayloadAction<UserLoginSuccessPayload>) => {
      const { data, loading, loginError } = action.payload
      state.data = data
      state.loading = loading
      state.loginError = loginError
      state.isLoggedIn = true
    },
    USER_LOGIN_FAILURE: (state, action: PayloadAction<UserLoginFailurePayload>) => {
      const { loginError, loading } = action.payload
      state.loading = loading
      state.loginError = loginError
    },
    USER_LOGOUT: (state) => {
      state.loading = false
      state.isLoggedIn = false
      state.data = {}
    },
    USER_TOKEN_VALIDATION: (state) => {
      state.loading = true
    },
    USER_TOKEN_VALIDATED: (state) => {
      state.loading = false
    },
    USER_UPDATE_AVATAR: (state, action: PayloadAction<string>) => {
      state.data.avatar = action.payload
    },
    SET_USER_DATA: (state, action: PayloadAction<UserState['data']>) => {
      state.data = action.payload
    },
    UPDATE_FOLLOWING: (state, action: PayloadAction<string>) => {
      state.data._followingId = action.payload /* eslint-disable-line no-underscore-dangle */
    },
  },
})

// Do not export the actions.
// Create functions, then export them
const { actions } = userSlice



// Private function(s) for actions
const getToken = async (
  username: string,
  password: string,
): Promise<AxiosResponse<{ token: string; user: UserState['data'] }> | { error: unknown }> => {
  try {
    return await axios.post(
      `${getBaseServerUrl()}/login`,
      {
        username,
        password,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
  } catch (err) {
    return { error: err }
  }
}

// Public functions that dispatch multiple actions
export const userLogin = async (
  username: string,
  password: string,
  dispatch: Dispatch,
  history: { push: (path: string) => void },
  redirectPath: string | null = null,
): Promise<void> => {
  dispatch(actions.USER_LOGIN_REQUEST())
  dispatch(actions.USER_LOGIN_FAILURE({ loginError: null, loading: true }))
  const result = await getToken(username, password)
  if ('error' in result) {
    const err = result.error as { response?: { data?: { message?: string } } }
    const errorMessage = err.response?.data?.message ?? 'Connection refuse'
    dispatch(
      actions.USER_LOGIN_FAILURE({ loginError: errorMessage, loading: false }),
    )
  } else {
    const { token, user } = result.data
    localStorage.setItem('token', token)
    dispatch(
      actions.USER_LOGIN_SUCCESS({
        data: user,
        loading: false,
        loginError: null,
      }),
    )
    // Validate and redirect to prevent open redirect vulnerabilities
    // Only allow safe relative paths: single slash start, no hostname, safe characters
    let targetPath = '/search'
    if (redirectPath && typeof redirectPath === 'string') {
      // Regex allows: /, alphanumeric, -, _, ?, =, &, #, and % (for encoding)
      const SAFE_PATH_REGEX = /^\/[a-zA-Z0-9/_?=&#%-]*$/
      if (SAFE_PATH_REGEX.test(redirectPath)) {
        targetPath = redirectPath
      }
    }
    history.push(targetPath)
  }
}

export function tokenValidator(dispatch: Dispatch): boolean {
  dispatch(actions.USER_TOKEN_VALIDATION())
  const storedToken = localStorage.getItem('token')

  if (!storedToken) {
    dispatch(actions.USER_LOGOUT())
    return false
  }

  try {
    const decoded = jwtDecode<DecodedToken>(storedToken)
    const currentTime = Date.now() / 1000

    // Check if token is expired
    if (decoded.exp && decoded.exp < currentTime) {
      localStorage.removeItem('token')
      dispatch(actions.USER_LOGOUT())
      return false
    }

    dispatch(actions.USER_TOKEN_VALIDATED())
    return true
  } catch (err) {
    // If token is invalid or can't be decoded
    localStorage.removeItem('token')
    dispatch(actions.USER_LOGOUT())
    return false
  }
}

export function clearToken(dispatch: Dispatch): void {
  dispatch(actions.USER_LOGOUT())
  localStorage.removeItem('token')
}

export function updateAvatar(dispatch: Dispatch, avatar: string): void {
  dispatch(actions.USER_UPDATE_AVATAR(avatar))
}

export function updateFollowing(dispatch: Dispatch, following: string): void {
  dispatch(actions.UPDATE_FOLLOWING(following))
}

export const {
  USER_LOGIN_FAILURE,
  USER_LOGIN_REQUEST,
  USER_LOGIN_SUCCESS,
  SET_USER_DATA,
  USER_TOKEN_VALIDATED,
  USER_TOKEN_VALIDATION,
  USER_UPDATE_AVATAR,
  UPDATE_FOLLOWING,
} = userSlice.actions

export default userSlice.reducer
