import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 120000,
})

export const chatApi = (message, collection = null) =>
  api.post('/chat', { message, ...(collection ? { collection } : {}) })
export const analyzeApi = (topic, depth = 'standard', collection = null) =>
  api.post('/analyze', { topic, depth, ...(collection ? { collection } : {}) })
export const summarizeApi = (content, format = 'bullet', collection = null) =>
  api.post('/summarize', { content, format, ...(collection ? { collection } : {}) })
export const reportApi = (topic, include_sections = null, collection = null) =>
  api.post('/report', { topic, include_sections, ...(collection ? { collection } : {}) })
export const uploadDocumentApi = (file, collection = 'default') => {
  const form = new FormData()
  form.append('file', file)
  return api.post(`/documents/upload?collection=${encodeURIComponent(collection)}`, form)
}
export const searchDocumentsApi = (query, collection = 'default', limit = 5) =>
  api.get(`/documents/search?query=${encodeURIComponent(query)}&collection=${encodeURIComponent(collection)}&limit=${limit}`)
export const getTasksApi = (limit = 20) => api.get(`/tasks?limit=${limit}`)
export const getTaskApi  = (id) => api.get(`/tasks/${id}`)
export const getLogsApi  = (limit = 50, task_id = null) =>
  api.get(`/logs?limit=${limit}${task_id ? `&task_id=${task_id}` : ''}`)

export default api
