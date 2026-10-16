import { motion } from 'framer-motion'

export default function FeatureCard({ icon: Icon, title, description, linkText, linkHref = '#' }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.25 }}
      className="relative overflow-hidden flex flex-col rounded-[14px] glass-panel glass-panel-hover p-6"
      style={{
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)
        `,
        backgroundSize: '28px 28px',
      }}
    >
      {/* Subtle corner sparkles */}
      <div className="absolute top-3 right-4 w-1 h-1 rounded-full bg-white/15" />
      <div className="absolute top-6 right-8 w-0.5 h-0.5 rounded-full bg-white/10" />
      <div className="absolute bottom-6 left-5 w-1 h-1 rounded-full bg-white/10" />

      {/* Icon circle */}
      <div className="w-11 h-11 rounded-full bg-white/[0.07] flex items-center justify-center mb-5 flex-shrink-0">
        <Icon className="text-[22px] text-htb-text" />
      </div>

      {/* Content */}
      <h3 className="text-[14px] font-semibold text-htb-text mb-2 leading-snug">
        {title}
      </h3>
      <p className="text-[12.5px] text-htb-muted leading-relaxed flex-grow mb-5">
        {description}
      </p>

      {/* Link */}
      <a
        href={linkHref}
        className="text-htb-green text-[12.5px] font-semibold hover:text-htb-greenlt transition-colors duration-150 mt-auto"
      >
        {linkText}
      </a>
    </motion.article>
  )
}
