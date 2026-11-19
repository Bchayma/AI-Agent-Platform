import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import NewTask from './pages/NewTask'
import TaskHistory from './pages/TaskHistory'
import TaskDetail from './pages/TaskDetail'
import Agents from './pages/Agents'
import Documents from './pages/Documents'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/"          element={<Dashboard />} />
          <Route path="/new"       element={<NewTask />} />
          <Route path="/history"   element={<TaskHistory />} />
          <Route path="/task/:id"  element={<TaskDetail />} />
          <Route path="/agents"    element={<Agents />} />
          <Route path="/documents" element={<Documents />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
