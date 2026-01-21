import { useEffect } from 'react'

function Particles() {
  useEffect(() => {
    const container = document.getElementById('particles')
    if (!container || container.children.length > 0) return

    const particleCount = 30
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div')
      particle.className = 'particle'
      particle.style.left = Math.random() * 100 + '%'
      particle.style.top = Math.random() * 100 + '%'
      const duration = 15 + Math.random() * 25
      particle.style.animationDuration = duration + 's'
      particle.style.animationDelay = Math.random() * 10 + 's'
      const drift = (Math.random() - 0.5) * 100
      particle.style.setProperty('--particle-drift', drift + 'px')
      const size = 1 + Math.random() * 2
      particle.style.width = size + 'px'
      particle.style.height = size + 'px'
      container.appendChild(particle)
    }
  }, [])

  return <div className="particles" id="particles" />
}

export function AnimatedBackground() {
  return (
    <>
      <div className="gradient-backdrop" />
      <div className="grid-overlay" />
      <Particles />
      <div className="scanline" />
      <div className="corner-accent top-left" />
      <div className="corner-accent bottom-right" />
    </>
  )
}
