import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MdAdd, MdEdit, MdDelete, MdClose, MdOutlinePalette } from 'react-icons/md'
import { loadCustomKpis, saveCustomKpis } from '../utils/mockData'

const COLORS = [
  '#FF4D4F', // Red
  '#FF8C00', // Orange
  '#FFC107', // Yellow
  '#39FF6A', // Green
  '#00D9FF', // Blue
  '#a855f7', // Purple
  '#ec4899', // Pink
]

export default function KpiManagement() {
  const [kpis, setKpis] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingKpi, setEditingKpi] = useState(null)
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    baseValue: '',
    trend: '+0%',
    color: COLORS[3]
  })

  useEffect(() => {
    setKpis(loadCustomKpis())
  }, [])

  const handleOpenModal = (kpi = null) => {
    if (kpi) {
      setEditingKpi(kpi)
      setFormData({
        title: kpi.title,
        baseValue: kpi.baseValue,
        trend: kpi.trend,
        color: kpi.color
      })
    } else {
      setEditingKpi(null)
      setFormData({
        title: '',
        baseValue: 100,
        trend: '+5%',
        color: COLORS[3]
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const handleSave = (e) => {
    e.preventDefault()
    let updatedKpis = [...kpis]
    
    if (editingKpi) {
      // Edit
      updatedKpis = updatedKpis.map(k => {
        if (k.id === editingKpi.id) {
          return { ...k, ...formData, baseValue: Number(formData.baseValue) }
        }
        return k
      })
    } else {
      // Create
      const newKpi = {
        id: `kpi_${Date.now()}`,
        ...formData,
        baseValue: Number(formData.baseValue)
      }
      updatedKpis.push(newKpi)
    }
    
    setKpis(updatedKpis)
    saveCustomKpis(updatedKpis)
    setIsModalOpen(false)
  }

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this KPI? It will be removed from your dashboard.')) {
      const updatedKpis = kpis.filter(k => k.id !== id)
      setKpis(updatedKpis)
      saveCustomKpis(updatedKpis)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto" style={{ background: 'linear-gradient(#141B21 1px, transparent 1px), linear-gradient(90deg, #141B21 1px, transparent 1px), #0B0F12', backgroundSize: '40px 40px' }}>
      <div className="max-w-6xl w-full mx-auto px-8 py-10">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">KPI Management</h1>
            <p className="text-[13px] text-htb-muted">Create, edit, and manage custom KPIs for your dashboard.</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-htb-green text-black font-semibold px-4 py-2 rounded-lg hover:bg-[#2ed658] transition-colors"
          >
            <MdAdd size={20} />
            Create KPI
          </button>
        </div>

        {/* KPI Table */}
        <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl overflow-hidden shadow-card">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#182128] border-b border-[#21262d] text-[11px] font-semibold text-htb-muted uppercase tracking-wider">
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4 text-center">Base Value</th>
                <th className="px-6 py-4 text-center">Trend Label</th>
                <th className="px-6 py-4 text-center">Color</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {kpis.map((kpi, index) => (
                <tr key={kpi.id} className={`border-b border-[#21262d] transition-colors hover:bg-white/[0.02] ${index === kpis.length - 1 ? 'border-none' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-white">{kpi.title}</div>
                    <div className="text-[11px] text-htb-muted font-mono mt-1">{kpi.id}</div>
                  </td>
                  <td className="px-6 py-4 text-center text-htb-muted font-mono">{kpi.baseValue.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-[12px] font-semibold" style={{ color: kpi.trend.startsWith('+') ? '#FF4D4F' : '#39FF6A' }}>
                      {kpi.trend}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 rounded-full border-2 border-[#182128]" style={{ backgroundColor: kpi.color }} title={kpi.color} />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-3">
                      <button onClick={() => handleOpenModal(kpi)} className="text-htb-muted hover:text-white transition-colors" title="Edit">
                        <MdEdit size={18} />
                      </button>
                      <button onClick={() => handleDelete(kpi.id)} className="text-htb-muted hover:text-red-500 transition-colors" title="Delete">
                        <MdDelete size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {kpis.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-htb-muted">
                    No KPIs found. Create your first custom KPI!
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
              className="bg-[#0d1117] border border-[#21262d] rounded-2xl p-6 w-full max-w-md shadow-2xl relative"
            >
              <button onClick={handleCloseModal} className="absolute top-4 right-4 text-htb-muted hover:text-white transition-colors">
                <MdClose size={24} />
              </button>
              
              <h2 className="text-xl font-bold text-white mb-6">
                {editingKpi ? 'Edit KPI' : 'Create New KPI'}
              </h2>

              <form onSubmit={handleSave} className="flex flex-col gap-4">
                
                {/* Title */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-htb-muted uppercase tracking-wider">KPI Title</label>
                  <input
                    required
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g. Phishing Attacks"
                    className="bg-[#182128] border border-[#21262d] rounded-lg px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-htb-green transition-colors"
                  />
                </div>

                {/* Base Value */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-htb-muted uppercase tracking-wider">Base Value <span className="text-[10px] text-htb-dim normal-case tracking-normal">(Simulated average)</span></label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={formData.baseValue}
                    onChange={(e) => setFormData({...formData, baseValue: e.target.value})}
                    placeholder="e.g. 500"
                    className="bg-[#182128] border border-[#21262d] rounded-lg px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-htb-green transition-colors"
                  />
                </div>

                {/* Trend */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-htb-muted uppercase tracking-wider">Trend Label</label>
                  <input
                    required
                    type="text"
                    value={formData.trend}
                    onChange={(e) => setFormData({...formData, trend: e.target.value})}
                    placeholder="e.g. +12%"
                    className="bg-[#182128] border border-[#21262d] rounded-lg px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-htb-green transition-colors"
                  />
                </div>

                {/* Color */}
                <div className="flex flex-col gap-1.5">
                  <label className="flex items-center gap-2 text-[12px] font-semibold text-htb-muted uppercase tracking-wider">
                    <MdOutlinePalette size={14} /> Theme Color
                  </label>
                  <div className="flex items-center gap-3 mt-1">
                    {COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({...formData, color})}
                        className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${formData.color === color ? 'border-white scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-4 pt-4 border-t border-[#21262d]">
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
                    {editingKpi ? 'Save Changes' : 'Create KPI'}
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
