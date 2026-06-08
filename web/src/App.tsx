import { useState, useEffect, useCallback } from 'react'
import { api, useWebSocket } from './api/client'
import type { Project, ProjectDetail, Iteration, Stats, TechDebt, CrossDep, OrgStandard, Decision, Agent } from './types'

// ============================================================================
// HOOKS
// ============================================================================
function useStats() {
  const [stats, setStats] = useState<Stats>({ totalProjects: 0, totalAgents: 0, blockedAgents: 0, pendingDecisions: 0, totalTechDebt: 0 })
  useEffect(() => { api.getStats().then(setStats).catch(console.error) }, [])
  return stats
}
function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const load = useCallback(() => { api.getProjects().then(setProjects).catch(console.error) }, [])
  useEffect(() => { load() }, [load])
  return { projects, reload: load }
}
function useProject(id: string | null) {
  const [data, setData] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    if (!id) return
    setLoading(true)
    api.getProject(id).then(d => { setData(d); setLoading(false) }).catch(e => { console.error(e); setLoading(false) })
  }, [id])
  return { data, loading }
}

// ============================================================================
// TOP BAR
// ============================================================================
function TopBar({ stats, wsStatus }: { stats: Stats; wsStatus: string }) {
  return (
    <header style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 20px',height:48,background:'var(--bg-secondary)',borderBottom:'1px solid var(--border)',flexShrink:0 }}>
      <div style={{ display:'flex',alignItems:'center',gap:16 }}>
        <span style={{ fontWeight:700,fontSize:15 }}>🔭 <span style={{ color:'var(--blue)' }}>控制塔</span></span>
        <Stat dot="green" label={`${stats.totalProjects} 个项目`} />
        <Stat dot="var(--blue)" label={`${stats.totalAgents} Agent 运行中`} />
        <Stat dot="red" label={`${stats.pendingDecisions} 升级待处理`} />
        <Stat dot="var(--yellow)" label={`${stats.totalTechDebt} 项技术债`} />
      </div>
      <span style={{ fontSize:11,color:wsStatus.includes('连接')?'var(--green)':'var(--text-muted)' }}>{wsStatus}</span>
    </header>
  )
}
function Stat({ dot, label }: { dot: string; label: string }) {
  return <span style={{ display:'flex',alignItems:'center',gap:6,fontSize:12,color:'var(--text-secondary)' }}><span style={{ width:8,height:8,borderRadius:'50%',background:dot,flexShrink:0 }} /> {label}</span>
}

// ============================================================================
// SIDEBAR
// ============================================================================
function Sidebar({ projects, currentView, onNavigate, onProjectSelect }: {
  projects: Project[]; currentView: string; onNavigate: (v: string) => void; onProjectSelect: (id: string) => void;
}) {
  const navItems = [
    { id: 'fleet', label: '📡 项目总览' },
    { id: 'techdebt', label: '💸 技术债登记' },
    { id: 'crossdeps', label: '🔗 跨项目依赖' },
    { id: 'standards', label: '📐 标准版本' },
  ]
  return (
    <aside style={{ width:260,flexShrink:0,background:'var(--bg-secondary)',borderRight:'1px solid var(--border)',overflowY:'auto' }}>
      <div style={{ padding:'14px 16px' }}>
        <div style={{ fontSize:10,textTransform:'uppercase',letterSpacing:'0.8px',color:'var(--text-muted)',marginBottom:10,fontWeight:600 }}>导航</div>
        {navItems.map(n => (
          <div key={n.id} onClick={() => onNavigate(n.id)}
            style={{ padding:'7px 10px',borderRadius:6,fontSize:13,cursor:'pointer',marginBottom:2,
              color:currentView===n.id?'var(--blue)':'var(--text-secondary)',
              background:currentView===n.id?'var(--blue-bg)':'transparent' }}>
            {n.label}
          </div>
        ))}
      </div>
      <div style={{ padding:'14px 16px',borderTop:'1px solid var(--border)' }}>
        <div style={{ fontSize:10,textTransform:'uppercase',letterSpacing:'0.8px',color:'var(--text-muted)',marginBottom:10,fontWeight:600 }}>项目</div>
        {projects.map(p => (
          <div key={p.id} onClick={() => { onProjectSelect(p.id); onNavigate('project') }}
            style={{ padding:'8px 10px',borderRadius:6,fontSize:12,cursor:'pointer',color:'var(--text-secondary)',display:'flex',alignItems:'center',gap:8,marginBottom:2 }}>
            <span style={{ width:7,height:7,borderRadius:'50%',background:p.health==='green'?'var(--green)':p.health==='yellow'?'var(--yellow)':'var(--red)',flexShrink:0 }} />
            {p.name}
          </div>
        ))}
      </div>
    </aside>
  )
}

// ============================================================================
// FLEET VIEW
// ============================================================================
function FleetView({ projects, onSelect }: { projects: Project[]; onSelect: (id: string) => void }) {
  return (
    <div>
      <div style={{ marginBottom:20 }}><h2 style={{ fontSize:18,fontWeight:600,marginBottom:4 }}>项目列表</h2><p style={{ fontSize:13,color:'var(--text-secondary)' }}>{projects.length} 个项目</p></div>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))',gap:16 }}>
        {projects.map(p => (
          <div key={p.id} onClick={() => onSelect(p.id)}
            style={{ background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',padding:20,cursor:'pointer',transition:'all 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor='var(--blue)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor='var(--border)')}>
            <div style={{ display:'flex',justifyContent:'space-between',marginBottom:14 }}>
              <span style={{ fontSize:15,fontWeight:600 }}>{p.name}</span>
              <span style={{ fontSize:10,color:'var(--text-muted)',background:'var(--bg-primary)',padding:'2px 8px',borderRadius:4 }}>{p.domain}</span>
            </div>
            <div style={{ display:'flex',gap:6,marginBottom:14,flexWrap:'wrap' }}>
              {(p.techTags||[]).map(t => (
                <span key={t} style={{ fontSize:11,padding:'3px 9px',borderRadius:4,background:'var(--blue-bg)',color:'var(--blue)' }}>{t}</span>
              ))}
            </div>
            <p style={{ fontSize:12,color:'var(--text-secondary)',lineHeight:1.5 }}>{p.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// PROJECT DETAIL
// ============================================================================
function ProjectDetailView({ data, loading }: { data: ProjectDetail | null; loading: boolean }) {
  if (loading || !data) return <div style={{ textAlign:'center',padding:60,color:'var(--text-muted)' }}>加载中...</div>
  const p = data
  const activeIters = (p.iterations||[]).filter(i => i.status==='running'||i.status==='blocked')
  return (
    <div>
      <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:24 }}>
        <button onClick={() => window.history.back()} style={{ background:'transparent',border:'1px solid var(--border)',color:'var(--text-secondary)',padding:'4px 10px',borderRadius:6,fontSize:12 }}>← 返回</button>
        <span style={{ width:10,height:10,borderRadius:'50%',background:p.health==='green'?'var(--green)':p.health==='yellow'?'var(--yellow)':'var(--red)' }} />
        <span style={{ fontSize:18,fontWeight:600 }}>{p.name}</span>
        <span style={{ fontSize:12,color:'var(--text-muted)' }}>{(p.techTags||[]).join(' · ')}</span>
      </div>

      {/* Description */}
      <div style={{ background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',padding:20,marginBottom:20 }}>
        <div style={{ fontSize:10,textTransform:'uppercase',letterSpacing:'0.8px',color:'var(--text-muted)',fontWeight:600,marginBottom:8 }}>项目描述</div>
        <p style={{ fontSize:13,lineHeight:1.7,color:'var(--text-secondary)' }}>{p.description}</p>
        <div style={{ display:'flex',gap:8,marginTop:10,flexWrap:'wrap' }}>{(p.techTags||[]).map(t => <span key={t} style={{ fontSize:10,padding:'2px 8px',borderRadius:4,background:'var(--bg-primary)',border:'1px solid var(--border)',color:'var(--text-muted)' }}>{t}</span>)}</div>
      </div>

      {/* Iteration Board */}
      <div style={{ background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',overflow:'hidden',marginBottom:20 }}>
        <div style={{ padding:'16px 20px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
          <h3 style={{ fontSize:13,fontWeight:600,color:'var(--text-secondary)' }}>🎯 进行中的迭代 <span style={{ fontSize:10,padding:'1px 8px',borderRadius:10,background:activeIters.length>4?'var(--yellow-bg)':'var(--blue-bg)',color:activeIters.length>4?'var(--yellow)':'var(--blue)' }}>{activeIters.length} 个任务</span></h3>
        </div>
        {activeIters.length > 4 && (
          <div style={{ margin:'0 20px 14px',padding:'12px 16px',background:'var(--yellow-bg)',border:'1px solid rgba(210,153,34,0.3)',borderRadius:'var(--radius)',fontSize:12,color:'var(--yellow)' }}>
            ⚠️ 并行任务过多（{activeIters.length} 个 {'>'} 建议上限 4 个），冲突风险升高。
          </div>
        )}
        <table style={{ width:'100%',borderCollapse:'collapse' }}>
          <thead><tr style={{ textAlign:'left',fontSize:10,textTransform:'uppercase',color:'var(--text-muted)',background:'var(--bg-hover)' }}>
            <th style={{ padding:'10px 20px',width:70 }}>任务ID</th><th style={{ padding:'10px 20px' }}>任务目标</th><th style={{ padding:'10px 20px',width:160 }}>当下在做</th><th style={{ padding:'10px 20px',width:85 }}>Agent</th><th style={{ padding:'10px 20px',width:70 }}>进度</th>
          </tr></thead>
          <tbody>
            {activeIters.map(iter => {
              const done = (iter.tasks||[]).filter(t => t.status==='done').length
              const total = (iter.tasks||[]).length
              const pct = total>0?done/total*100:0
              const blocked = (iter.tasks||[]).some(t => t.status==='blocked')
              return (
                <tr key={iter.id} style={{ borderBottom:'1px solid var(--border)',fontSize:12 }}>
                  <td style={{ padding:'12px 20px',fontFamily:'var(--font-mono)',fontSize:11,color:'var(--blue)' }}>{iter.taskId}</td>
                  <td style={{ padding:'12px 20px',fontWeight:600 }}>{(iter.goal||'').slice(0,45)}{(iter.goal||'').length>45?'...':''}</td>
                  <td style={{ padding:'12px 20px',fontSize:11,color:'var(--text-secondary)' }}><span style={{ width:5,height:5,borderRadius:'50%',display:'inline-block',marginRight:4,background:blocked?'var(--red)':'var(--blue)',animation:blocked?'none':'pulse 1.5s infinite' }} />{iter.currentAction||'—'}</td>
                  <td style={{ padding:'12px 20px' }}><span style={{ fontSize:10,padding:'2px 8px',borderRadius:4,fontFamily:'var(--font-mono)',background:'var(--blue-bg)',color:'var(--blue)' }}>{iter.agentId}</span></td>
                  <td style={{ padding:'12px 20px' }}>
                    <span style={{ display:'flex',alignItems:'center',gap:6 }}>
                      <span style={{ width:36,height:3,background:'var(--bg-primary)',borderRadius:2,overflow:'hidden' }}><span style={{ display:'block',height:'100%',borderRadius:2,width:`${pct}%`,background:blocked?'var(--red)':done/total<0.5?'var(--yellow)':'var(--green)' }} /></span>
                      <span style={{ fontSize:10,fontFamily:'var(--font-mono)',color:'var(--text-muted)' }}>{total>0?`${done}/${total}`:'—'}</span>
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Agents + Tech Debt grid */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20 }}>
        <Panel title="📡 Agent 状态">
          {(p.agents||[]).map(a => (
            <div key={a.id} style={{ padding:'10px 0',borderBottom:'1px solid var(--border)',fontSize:12 }}>
              <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                <span style={{ width:8,height:8,borderRadius:'50%',background:a.status==='running'?'var(--green)':a.status==='blocked'?'var(--red)':'var(--text-muted)' }} />
                <strong>{a.id}</strong> · {a.service}
                <span style={{ marginLeft:'auto',fontSize:10,padding:'1px 6px',borderRadius:3,background:a.status==='running'?'var(--green-bg)':'var(--red-bg)',color:a.status==='running'?'var(--green)':'var(--red)' }}>{a.status==='running'?'运行中':'已阻塞'}</span>
              </div>
              <div style={{ color:'var(--text-muted)',fontSize:11,marginTop:4 }}>{a.currentAction}</div>
            </div>
          ))}
        </Panel>
        <Panel title="💸 技术债">
          {(p.techDebts||[]).length===0
            ? <div style={{ textAlign:'center',color:'var(--text-muted)',padding:20 }}>✅ 暂无技术债</div>
            : (p.techDebts||[]).map(td => (
              <div key={td.id} style={{ padding:'8px 0',borderBottom:'1px solid var(--border)',fontSize:12 }}>
                <span style={{ fontFamily:'var(--font-mono)',fontSize:11,color:'var(--blue)' }}>{td.id}</span>
                <span style={{ marginLeft:8,fontSize:10,padding:'1px 6px',borderRadius:3,background:td.severity==='high'?'var(--red-bg)':'var(--yellow-bg)',color:td.severity==='high'?'var(--red)':'var(--yellow)' }}>{td.severity}</span>
                {td.overdue && <span style={{ fontSize:9,color:'var(--red)',marginLeft:4 }}>逾期</span>}
                <div style={{ marginTop:4 }}>{td.description}</div>
              </div>
            ))}
        </Panel>
      </div>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',padding:20 }}>
      <h3 style={{ fontSize:13,fontWeight:600,marginBottom:16,textTransform:'uppercase',letterSpacing:'0.5px',color:'var(--text-secondary)' }}>{title}</h3>
      {children}
    </div>
  )
}

// ============================================================================
// TECH DEBT VIEW
// ============================================================================
function TechDebtView() {
  const [debts, setDebts] = useState<TechDebt[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  useEffect(() => {
    api.getTechDebts().then(setDebts).catch(console.error)
    api.getProjects().then(setProjects).catch(console.error)
  }, [])
  const sev: Record<string,string> = { high:'🔴 高', medium:'🟡 中', low:'⚪ 低' }
  const pname = (id: string) => projects.find(p => p.id===id)?.name || id
  return (
    <div>
      <div style={{ marginBottom:20 }}><h2 style={{ fontSize:18,fontWeight:600,marginBottom:4 }}>💸 技术债登记</h2><p style={{ fontSize:13,color:'var(--text-secondary)' }}>{debts.length} 项 · {debts.filter(d=>d.overdue).length} 项逾期</p></div>
      <div style={{ background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',overflow:'hidden' }}>
        <table style={{ width:'100%',borderCollapse:'collapse' }}>
          <thead><tr style={{ textAlign:'left',fontSize:10,textTransform:'uppercase',color:'var(--text-muted)',background:'var(--bg-hover)' }}>
            <th style={{ padding:'10px 16px' }}>ID</th><th style={{ padding:'10px 16px' }}>描述</th><th style={{ padding:'10px 16px' }}>项目</th><th style={{ padding:'10px 16px' }}>严重</th><th style={{ padding:'10px 16px' }}>原因</th><th style={{ padding:'10px 16px' }}>计划</th>
          </tr></thead>
          <tbody>{debts.map(d => (
            <tr key={d.id} style={{ borderBottom:'1px solid var(--border)',fontSize:12 }}>
              <td style={{ padding:'10px 16px',fontFamily:'var(--font-mono)',fontSize:11,color:'var(--blue)' }}>{d.id}</td>
              <td style={{ padding:'10px 16px' }}>{d.description}{d.overdue?<span style={{ fontSize:9,color:'var(--red)',marginLeft:4 }}>逾期</span>:null}</td>
              <td style={{ padding:'10px 16px' }}>{pname(d.projectId)}</td>
              <td style={{ padding:'10px 16px' }}><span style={{ fontSize:10,padding:'2px 8px',borderRadius:4,background:d.severity==='high'?'var(--red-bg)':'var(--yellow-bg)',color:d.severity==='high'?'var(--red)':'var(--yellow)' }}>{sev[d.severity]}</span></td>
              <td style={{ padding:'10px 16px',fontSize:11,color:'var(--text-muted)' }}>{d.cause}</td>
              <td style={{ padding:'10px 16px',fontSize:11 }}>{d.plan}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  )
}

// ============================================================================
// CROSS DEPS VIEW
// ============================================================================
function CrossDepsView() {
  const [deps, setDeps] = useState<CrossDep[]>([])
  useEffect(() => { api.getCrossDeps().then(setDeps).catch(console.error) }, [])
  const riskLabel: Record<string,string> = { high:'高风险', medium:'中风险', low:'低风险' }
  return (
    <div>
      <div style={{ marginBottom:20 }}><h2 style={{ fontSize:18,fontWeight:600,marginBottom:4 }}>🔗 跨项目依赖</h2><p style={{ fontSize:13,color:'var(--text-secondary)' }}>{deps.length} 个依赖关系</p></div>
      <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
        {deps.map(d => (
          <div key={d.id} style={{ background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'14px 16px' }}>
            <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:8 }}>
              <strong>{d.fromProject}/{d.fromService}</strong>
              <span style={{ color:'var(--text-muted)' }}>→</span>
              <strong>{d.toProject}/{d.toService}</strong>
              <span style={{ fontSize:10,padding:'2px 8px',borderRadius:4,background:'var(--bg-hover)',color:'var(--text-muted)' }}>{d.depType}</span>
              <span style={{ fontSize:10,padding:'2px 8px',borderRadius:4,background:d.risk==='high'?'var(--red-bg)':d.risk==='medium'?'var(--yellow-bg)':'var(--green-bg)',color:d.risk==='high'?'var(--red)':d.risk==='medium'?'var(--yellow)':'var(--green)' }}>{riskLabel[d.risk]}</span>
            </div>
            <div style={{ fontSize:11,color:'var(--text-secondary)' }}>{d.impactDesc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// STANDARDS VIEW
// ============================================================================
function StandardsView() {
  const [standards, setStandards] = useState<OrgStandard[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  useEffect(() => {
    api.getStandards().then(setStandards).catch(console.error)
    api.getProjects().then(setProjects).catch(console.error)
  }, [])
  return (
    <div>
      <div style={{ marginBottom:20 }}><h2 style={{ fontSize:18,fontWeight:600,marginBottom:4 }}>📐 标准版本追踪</h2><p style={{ fontSize:13,color:'var(--text-secondary)' }}>组织级架构标准在各项目中的采用情况</p></div>
      <div style={{ background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',overflow:'hidden' }}>
        <table style={{ width:'100%',borderCollapse:'collapse' }}>
          <thead><tr style={{ textAlign:'left',fontSize:10,textTransform:'uppercase',color:'var(--text-muted)',background:'var(--bg-hover)' }}>
            <th style={{ padding:'10px 16px' }}>标准</th><th style={{ padding:'10px 16px' }}>最新</th>
            {projects.map(p => <th key={p.id} style={{ padding:'10px 16px',textAlign:'center' }}>{p.name}</th>)}
          </tr></thead>
          <tbody>{standards.map(s => (
            <tr key={s.id} style={{ borderBottom:'1px solid var(--border)',fontSize:12 }}>
              <td style={{ padding:'10px 16px',fontWeight:600 }}>{s.name}</td>
              <td style={{ padding:'10px 16px',fontFamily:'var(--font-mono)',color:'var(--green)',fontSize:11 }}>{s.latestVersion}</td>
              {projects.map(p => {
                const v = s.projects[p.id]||'—'
                const ok = v===s.latestVersion
                return <td key={p.id} style={{ padding:'10px 16px',textAlign:'center',fontFamily:'var(--font-mono)',fontSize:11,color:ok?'var(--green)':v==='—'?'var(--red)':'var(--yellow)' }}>{v}</td>
              })}
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  )
}

// ============================================================================
// APP
// ============================================================================
export default function App() {
  const stats = useStats()
  const { projects, reload } = useProjects()
  const [view, setView] = useState('fleet')
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const { data: projectDetail, loading } = useProject(view==='project'?selectedProject:null)
  const [wsStatus, setWsStatus] = useState('WS 连接中...')

  // WebSocket
  useEffect(() => {
    const proto = location.protocol==='https:'?'wss:':'ws:'
    let ws: WebSocket
    function connect() {
      ws = new WebSocket(`${proto}//${location.host}/ws`)
      ws.onopen = () => setWsStatus('WS 已连接')
      ws.onclose = () => { setWsStatus('WS 断开'); setTimeout(connect,5000) }
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data)
          if (msg.type==='heartbeat') setWsStatus('最后更新：'+new Date(msg.at).toLocaleTimeString())
          if (msg.type==='escalation'||msg.type==='iteration_update'||msg.type==='agent_state') reload()
        } catch {}
      }
    }
    connect()
    return () => ws?.close()
  }, [])

  const handleProjectSelect = (id: string) => {
    setSelectedProject(id)
    setView('project')
  }

  return (
    <div style={{ height:'100vh',display:'flex',flexDirection:'column',overflow:'hidden' }}>
      <TopBar stats={stats} wsStatus={wsStatus} />
      <div style={{ display:'flex',flex:1,overflow:'hidden' }}>
        <Sidebar projects={projects} currentView={view} onNavigate={v => { setView(v); if (v!=='project') setSelectedProject(null) }} onProjectSelect={handleProjectSelect} />
        <main style={{ flex:1,overflowY:'auto',padding:24 }}>
          {view==='fleet' && <FleetView projects={projects} onSelect={handleProjectSelect} />}
          {view==='project' && <ProjectDetailView data={projectDetail} loading={loading} />}
          {view==='techdebt' && <TechDebtView />}
          {view==='crossdeps' && <CrossDepsView />}
          {view==='standards' && <StandardsView />}
        </main>
      </div>
    </div>
  )
}
