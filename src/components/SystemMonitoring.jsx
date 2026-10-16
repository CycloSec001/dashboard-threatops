import React, { useState, useEffect } from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import { FiCpu, FiHardDrive, FiActivity, FiServer } from 'react-icons/fi';

const generateSparklineData = (min, max, count) => {
  return Array.from({ length: count }, (_, i) => ({
    time: i,
    value: Math.floor(Math.random() * (max - min + 1)) + min
  }));
};

const MonitoringCard = ({ title, icon, value, subValue, color, data, id }) => {
  return (
    <div className="kpi-glass-card flex flex-col p-4 rounded-[12px] border border-white/[0.08] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-0.5 z-10 opacity-80" style={{ backgroundColor: color }} />
      <div className="flex justify-between items-start mb-2 z-10 relative">
        <div className="flex items-center gap-2 text-white">
          <div style={{ color }}>{icon}</div>
          <span className="font-semibold text-[13px] text-slate-200">{title}</span>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold leading-none mb-1 whitespace-nowrap" style={{ color }}>{value}</div>
          <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">{subValue}</div>
        </div>
      </div>
      <div className="h-16 w-full mt-1 z-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`color-${id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <YAxis domain={[0, 100]} hide />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              strokeWidth={2} 
              fillOpacity={1}
              fill={`url(#color-${id})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default function SystemMonitoring({ config = {} }) {
  const [dataPoints, setDataPoints] = useState({
    cpu: generateSparklineData(20, 60, 20),
    mem: generateSparklineData(40, 80, 20),
    disk: generateSparklineData(5, 15, 20),
    net: generateSparklineData(10, 90, 20),
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setDataPoints(prev => {
        const nextVal = (min, max, prevVal) => {
          let delta = (Math.random() - 0.5) * 15;
          let val = prevVal + delta;
          return Math.max(min, Math.min(max, val));
        };

        const updateArr = (arr, min, max) => {
          const newArr = [...arr.slice(1)];
          const lastVal = arr[arr.length - 1].value;
          newArr.push({ time: Date.now(), value: nextVal(min, max, lastVal) });
          return newArr;
        };

        return {
          cpu: updateArr(prev.cpu, 10, 90),
          mem: updateArr(prev.mem, 40, 85),
          disk: updateArr(prev.disk, 0, 30),
          net: updateArr(prev.net, 5, 95),
        };
      });
    }, 1500);
    
    return () => clearInterval(interval);
  }, []);

  const currentCpu = Math.round(dataPoints.cpu[dataPoints.cpu.length - 1].value);
  const currentMem = Math.round(dataPoints.mem[dataPoints.mem.length - 1].value);
  const currentDisk = Math.round(dataPoints.disk[dataPoints.disk.length - 1].value);
  const currentNet = Math.round(dataPoints.net[dataPoints.net.length - 1].value);

  const defaults = {
    cpu: { title: "CPU Usage", icon: <FiCpu size={18} />, subValue: "4.20 GHz", color: "#39FF6A", value: `${currentCpu}%` },
    mem: { title: "Memory Usage", icon: <FiServer size={18} />, subValue: `${(currentMem * 32 / 100).toFixed(1)} GB / 32 GB`, color: "#06b6d4", value: `${currentMem}%` },
    disk: { title: "Disk Usage", icon: <FiHardDrive size={18} />, subValue: "C: NVMe SSD", color: "#a855f7", value: `${currentDisk}%` },
    net: { title: "Network Usage", icon: <FiActivity size={18} />, subValue: "Ethernet", color: "#ec4899", value: `${currentNet} Mbps` },
  };

  const getProp = (key, prop) => (config[key] && config[key][prop] !== undefined) ? config[key][prop] : defaults[key][prop];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      <MonitoringCard 
        id="cpu"
        title={getProp("cpu", "title")} 
        icon={getProp("cpu", "icon")} 
        value={getProp("cpu", "value")} 
        subValue={getProp("cpu", "subValue")}
        color={getProp("cpu", "color")} 
        data={dataPoints.cpu}
      />
      <MonitoringCard 
        id="mem"
        title={getProp("mem", "title")} 
        icon={getProp("mem", "icon")} 
        value={getProp("mem", "value")} 
        subValue={getProp("mem", "subValue")}
        color={getProp("mem", "color")} 
        data={dataPoints.mem}
      />
      <MonitoringCard 
        id="disk"
        title={getProp("disk", "title")} 
        icon={getProp("disk", "icon")} 
        value={getProp("disk", "value")} 
        subValue={getProp("disk", "subValue")}
        color={getProp("disk", "color")} 
        data={dataPoints.disk}
      />
      <MonitoringCard 
        id="net"
        title={getProp("net", "title")} 
        icon={getProp("net", "icon")} 
        value={getProp("net", "value")} 
        subValue={getProp("net", "subValue")}
        color={getProp("net", "color")} 
        data={dataPoints.net}
      />
    </div>
  );
}
