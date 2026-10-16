import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MdClose } from 'react-icons/md'

export default function DetailsModal({ isOpen, onClose, data, title = "Row Details" }) {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
          >
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-modal rounded-[16px] w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]"
              style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.1)' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-white/[0.02]">
                <h3 className="text-white font-bold text-[16px]">{title}</h3>
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-white transition-colors p-1"
                >
                  <MdClose size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto">
                {data ? (
                  <pre className="bg-black/40 border border-white/[0.08] rounded-xl p-4 text-[13px] font-mono text-htb-green overflow-x-auto">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                ) : (
                  <div className="text-slate-400 text-center py-4">No data available</div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
