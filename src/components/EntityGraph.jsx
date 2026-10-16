import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdPerson, MdComputer, MdPublic, MdLanguage, MdWarning, MdGavel } from 'react-icons/md';

// Map node types to icons and colors
const TYPE_CONFIG = {
  user: { icon: MdPerson, color: '#3b82f6', bg: 'bg-blue-500/20' }, // Blue
  endpoint: { icon: MdComputer, color: '#8b5cf6', bg: 'bg-purple-500/20' }, // Purple
  ip: { icon: MdPublic, color: '#f59e0b', bg: 'bg-amber-500/20' }, // Amber
  domain: { icon: MdLanguage, color: '#f59e0b', bg: 'bg-amber-500/20' }, // Amber
  alert: { icon: MdWarning, color: '#ef4444', bg: 'bg-red-500/20' }, // Red
  incident: { icon: MdGavel, color: '#10b981', bg: 'bg-green-500/20' } // Green
};

// Static positions for the mock nodes
const POSITIONS = {
  'n1': { x: 150, y: 200 }, // User
  'n8': { x: 300, y: 300 }, // Endpoint 2
  'n5': { x: 300, y: 100 }, // Alert 1
  'n2': { x: 500, y: 80 },  // Server
  'n6': { x: 500, y: 320 }, // Alert 2
  'n3': { x: 700, y: 320 }, // IP
  'n4': { x: 850, y: 250 }, // Domain
  'n7': { x: 750, y: 120 }  // Incident
};

export default function EntityGraph({ graphData, onNodeSelect, selectedNodeId }) {
  if (!graphData || !graphData.nodes || !graphData.links) return null;

  // Render SVG paths with a curve
  const renderLinks = () => {
    return graphData.links.map((link, idx) => {
      const source = POSITIONS[link.source];
      const target = POSITIONS[link.target];
      if (!source || !target) return null;

      // Calculate control points for a smooth cubic bezier curve
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      
      const p1x = source.x + dx * 0.25;
      const p1y = source.y + dy * 0.1;
      const p2x = source.x + dx * 0.75;
      const p2y = source.y + dy * 0.9;
      
      const d = `M ${source.x} ${source.y} C ${p1x} ${p1y}, ${p2x} ${p2y}, ${target.x} ${target.y}`;
      
      const isHighlighted = selectedNodeId && (selectedNodeId === link.source || selectedNodeId === link.target);
      const color = isHighlighted ? '#3b82f6' : '#374151';
      const strokeWidth = isHighlighted ? 2.5 : 1.5;

      return (
        <g key={`link-${idx}`}>
          <motion.path
            d={d}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1, delay: idx * 0.1 }}
          />
          {/* Label positioned halfway */}
          <motion.text
            x={source.x + dx * 0.5}
            y={source.y + dy * 0.5 - 10}
            fill="#9ca3af"
            fontSize="10"
            textAnchor="middle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 + (idx * 0.1) }}
          >
            {link.label}
          </motion.text>
        </g>
      );
    });
  };

  return (
    <div className="relative w-full h-[450px] bg-[#0d1117] border border-[#1f2937] rounded-xl overflow-hidden" 
         style={{
           backgroundImage: 'radial-gradient(#1f2937 1px, transparent 1px)',
           backgroundSize: '30px 30px'
         }}
         onClick={() => onNodeSelect(null)} // Click background to deselect
    >
      <svg width="100%" height="100%" className="absolute inset-0 z-0">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        {renderLinks()}
      </svg>

      {/* Render Nodes as HTML overlay to easily attach click handlers and tooltips */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {graphData.nodes.map((node, idx) => {
          const pos = POSITIONS[node.id];
          if (!pos) return null;
          
          const config = TYPE_CONFIG[node.type] || TYPE_CONFIG.endpoint;
          const Icon = config.icon;
          const isSelected = selectedNodeId === node.id;
          const scale = isSelected ? 1.2 : 1;

          return (
            <motion.div
              key={node.id}
              className={`absolute flex flex-col items-center justify-center cursor-pointer pointer-events-auto`}
              style={{ left: pos.x - 24, top: pos.y - 24, width: 48, height: 48 }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale, opacity: 1 }}
              whileHover={{ scale: 1.15 }}
              transition={{ type: 'spring', delay: idx * 0.05 }}
              onClick={(e) => {
                e.stopPropagation();
                onNodeSelect(node);
              }}
            >
              <div 
                className={`w-12 h-12 rounded-full flex items-center justify-center ${config.bg} border-2 shadow-lg transition-colors`}
                style={{ 
                  borderColor: isSelected ? '#ffffff' : config.color,
                  boxShadow: isSelected ? `0 0 15px ${config.color}` : 'none'
                }}
              >
                <Icon size={24} style={{ color: config.color }} />
              </div>
              <div className="mt-2 text-center">
                <div className="text-[11px] font-bold text-white whitespace-nowrap bg-[#0d1117]/80 px-1.5 py-0.5 rounded">{node.label}</div>
                <div className="text-[9px] uppercase text-[#6b7280]">{node.type}</div>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex gap-4 bg-[#111827]/80 backdrop-blur-sm border border-[#1f2937] p-2 rounded-lg">
        {Object.entries(TYPE_CONFIG).map(([type, cfg]) => {
          const LegIcon = cfg.icon;
          return (
            <div key={type} className="flex items-center gap-1.5">
              <LegIcon size={14} style={{ color: cfg.color }} />
              <span className="text-[10px] text-[#9ca3af] uppercase">{type}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
