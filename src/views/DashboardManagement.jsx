import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MdAdd, MdEdit, MdDelete, MdClose, MdDashboard } from 'react-icons/md'
import { loadDashboards, saveDashboards, loadCustomKpis } from '../utils/mockData'

export default function DashboardManagement({ setActive }) {
  const [dashboards, setDashboards] = useState([])
  const [availableKpis, setAvailableKpis] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDash, setEditingDash] = useState(null)
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    selectedKpis: []
  })

  useEffect(() => {
    setDashboards(loadDashboards())
    setAvailableKpis(loadCustomKpis())
  }, [])

  const handleOpenModal = (dash = null) => {
    if (dash) {
      setEditingDash(dash)
      setFormData({
        name: dash.name,
        selectedKpis: dash.selectedKpis || []
      })
    } else {
      setEditingDash(null)
      setFormData({
        name: '',
        selectedKpis: []
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => setIsModalOpen(false)

  const handleToggleKpi = (kpiId) => {
    setFormData(prev => {
      const selected = prev.selectedKpis.includes(kpiId)
        ? prev.selectedKpis.filter(id => id !== kpiId)
        : [...prev.selectedKpis, kpiId]
      return { ...prev, selectedKpis: selected }
    })
  }

  const handleSave = (e) => {
    e.preventDefault()
    let updated = [...dashboards]
    
    if (editingDash) {
      updated = updated.map(d => d.id === editingDash.id ? { ...d, ...formData } : d)
    } else {
      updated.push({
        id: `dash_${Date.now()}`,
        ...formData
      })
    }
    
    setDashboards(updated)
    saveDashboards(updated)
    window.dispatchEvent(new Event('dashboards_updated'))
    setIsModalOpen(false)
  }

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this dashboard?')) {
      const updated = dashboards.filter(d => d.id !== id)
      setDashboards(updated)
      saveDashboards(updated)
      window.dispatchEvent(new Event('dashboards_updated'))
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto" style={{ background: 'linear-gradient(#141B21 1px, transparent 1px), linear-gradient(90deg, #141B21 1px, transparent 1px), #0B0F12', backgroundSize: '40px 40px' }}>
      <div className="max-w-6xl w-full mx-auto px-8 py-10">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Dashboard Management</h1>
            <p className="text-[13px] text-htb-muted">Create and configure custom dashboard views.</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-htb-green text-black font-semibold px-4 py-2 rounded-lg hover:bg-[#2ed658] transition-colors"
          >
            <MdAdd size={20} />
            Create Dashboard
          </button>
        </div>

        {/* Dashboard Table */}
        <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl overflow-hidden shadow-card">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#182128] border-b border-[#21262d] text-[11px] font-semibold text-htb-muted uppercase tracking-wider">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4 text-center">KPI Count</th>
                <th className="px-6 py-4 text-center">ID</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {dashboards.map((dash, index) => (
                <tr key={dash.id} className={`border-b border-[#21262d] transition-colors hover:bg-white/[0.02] ${index === dashboards.length - 1 ? 'border-none' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#21262d] flex items-center justify-center text-htb-muted">
                        <MdDashboard size={16} />
                      </div>
                      <span className="font-semibold text-white">{dash.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-htb-muted">
                    {dash.selectedKpis?.length || 0} selected
                  </td>
                  <td className="px-6 py-4 text-center text-[12px] text-htb-muted font-mono">
                    {dash.id}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-3">
                      <button onClick={() => setActive(`custom_dashboard_${dash.id}`)} className="text-htb-muted hover:text-htb-green transition-colors text-[13px] font-medium mr-2" title="View Dashboard">
                        View
                      </button>
                      <button onClick={() => handleOpenModal(dash)} className="text-htb-muted hover:text-white transition-colors" title="Edit">
                        <MdEdit size={18} />
                      </button>
                      <button onClick={() => handleDelete(dash.id)} className="text-htb-muted hover:text-red-500 transition-colors" title="Delete">
                        <MdDelete size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {dashboards.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-htb-muted">
                    No custom dashboards yet. Click "Create Dashboard" to get started!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0d1117] border border-[#21262d] rounded-2xl p-6 w-full max-w-lg shadow-2xl relative flex flex-col max-h-[85vh]"
            >
              <button onClick={handleCloseModal} className="absolute top-4 right-4 text-htb-muted hover:text-white transition-colors">
                <MdClose size={24} />
              </button>
              
              <h2 className="text-xl font-bold text-white mb-6 flex-shrink-0">
                {editingDash ? 'Edit Dashboard' : 'Create New Dashboard'}
              </h2>

              <form onSubmit={handleSave} className="flex flex-col gap-5 flex-1 min-h-0">
                
                {/* Name */}
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <label className="text-[12px] font-semibold text-htb-muted uppercase tracking-wider">Dashboard Name</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Executive Overview"
                    className="bg-[#182128] border border-[#21262d] rounded-lg px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-htb-green transition-colors"
                  />
                </div>

                {/* KPI Selector */}
                <div className="flex flex-col gap-2 flex-1 min-h-0">
                  <label className="text-[12px] font-semibold text-htb-muted uppercase tracking-wider">
                    Select KPIs ({formData.selectedKpis.length})
                  </label>
                  <div className="bg-[#182128] border border-[#21262d] rounded-lg p-2 overflow-y-auto flex-1">
                    <div className="grid grid-cols-2 gap-2">
                      {availableKpis.map(kpi => {
                        const isSelected = formData.selectedKpis.includes(kpi.id)
                        return (
                          <label
                            key={kpi.id}
                            className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors border ${isSelected ? 'bg-[#21262d] border-htb-green/30' : 'bg-transparent border-transparent hover:bg-white/[0.03]'}`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleKpi(kpi.id)}
                              className="w-4 h-4 rounded accent-htb-green"
                            />
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: kpi.color }} />
                              <span className="text-[13px] text-white font-medium truncate">{kpi.title}</span>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                    {availableKpis.length === 0 && (
                      <div className="text-center p-4 text-[13px] text-htb-muted">
                        No KPIs available.
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-[#21262d] flex-shrink-0">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 py-2.5 rounded-lg font-semibold text-htb-muted bg-[#182128] hover:text-white hover:bg-[#21262d] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-lg font-semibold text-black bg-htb-green hover:bg-[#2ed658] transition-colors shadow-[0_0_15px_rgba(57,255,106,0.3)]"
                  >
                    {editingDash ? 'Save Changes' : 'Create Dashboard'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
