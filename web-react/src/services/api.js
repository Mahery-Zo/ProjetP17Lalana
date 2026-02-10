import axios from 'axios'

const API_URL = 'http://localhost:8000/api'
const API_NODE_URL = 'http://localhost:5050/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

const users_api = axios.create({
  baseURL: API_NODE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Intercepteur pour ajouter le token
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('token')
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`
//     }
//     return config
//   },
//   (error) => Promise.reject(error)
// )

// // Intercepteur pour gérer les erreurs 401
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       localStorage.removeItem('token')
//       localStorage.removeItem('user')
//       window.location.href = '/login'
//     }
//     return Promise.reject(error)
//   }
// )

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  console.log("REQ:", config.method, config.baseURL + config.url);
  console.log("TOKEN:", token);
  config.headers.Accept = "application/json"; // helpful
  if (token) config.headers.Authorization = `Bearer ${token}`;
  console.log("AUTH HEADER:", config.headers.Authorization);
  return config;
});

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/login', { email, password })
    return response.data
  },

  register: async (name, email, password, password_confirmation) => {
    const response = await api.post('/register', {
      name,
      email,
      password,
      password_confirmation
    })
    return response.data
  },

  logout: async () => {
    await api.post('/logout')
  },

  getUser: async () => {
    const response = await api.get('/user')
    return response.data
  }
}

export const signalementService = {
  getAll: async () => {
    const response = await api.get('/signalements')
    return response.data
  },

  getById: async (id) => {
    const response = await api.get(`/signalements/${id}`)
    return response.data
  },

  create: async (data) => {
    const response = await api.post('/signalements', data)
    return response.data
  },

  getMine: async () => {
    const response = await api.get('/signalements/user/mine')
    return response.data
  },

  updateStatus: async (id, status, date) => {
    const response = await api.put(`/signalements/${id}/status`, { status, date })
    return response.data
  },

  updateDetails: async (id, data) => {
    const response = await api.put(`/signalements/${id}/details`, data)
    return response.data
  },

  getEntreprises: async () => {
    const response = await api.get('/entreprises')
    return response.data
  }
}

export const userService = {
  getBlockedUsers: async () => {
    const response = await api.get('/users/blocked')
    return response.data
  },

  unblockUser: async (id) => {
    const response = await api.post(`/users/${id}/unblock`)
    return response.data
  }
}

export const syncService = {
  syncFirebase: async () => {
    const { data } = await api.post("/sync/firebase");
    return data;
  },
};


export const pushService = {
  pushFirebase: async () => {
    const response = await api.post('/push/firebase')
    return response.data
  }
}

export const pushUserService = {
  pushUserFirebase: async () => {
  const triggerKey = import.meta.env.VITE_NODE_TRIGGER_KEY;

  return axios.post(
    "http://localhost:5050/api/import/users/from-postgres",
    {},
    {
      headers: {
        "X-TRIGGER-KEY": triggerKey,
        Accept: "application/json",
      },
    }
  );
}
}

export const statisticsService = {
  getStats: async () => {
    const response = await api.get('/statistiques')
    return response.data
  }
}






export default api
