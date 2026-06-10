import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'https://myguest-production-9e8f.up.railway.app'

export const loginRequest = async (login, password) => {
  const response = await axios.post(`${API_URL}/auth/login`, {
    login,
    password
  })
  return response.data
}

export const getMeRequest = async (token) => {
  const response = await axios.get(`${API_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  return response.data
}