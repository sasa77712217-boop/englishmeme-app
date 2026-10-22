import { FormEvent, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { hasSupabase, supabase } from './lib/supabase'
import type { Level, LearningCard, OwnedItem, Profile, StoreItem, Tutorial, UserProgress } from './lib/types'

function asset(path: string | null | undefined) {
  if (!path) return ''
  if (/^(https?:)?\/\//.test(path) || path.startsWith('/manus-storage/')) return path
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`
}

const demoLevels: Level[] = [
  { id: 'level-1', name: 'Principiante', difficulty_label: 'Básica', description: 'Expresiones cotidianas para empezar.', sort_order: 1, max_cards: 10, is_active: true, card_count: 10 },
  { id: 'level-2', name: 'Medio', difficulty_label: 'Intermedia', description: 'Conversaciones naturales y situaciones comunes.', sort_order: 2, max_cards: 20, is_active: true, card_count: 16 },
  { id: 'level-3', name: 'Avanzado', difficulty_label: 'Alta', description: 'Matices, trabajo y comunicación precisa.', sort_order: 3, max_cards: 30, is_active: true, card_count: 0 },
  { id: 'level-4', name: 'Experto', difficulty_label: 'Muy alta', description: 'Frases idiomáticas y tono avanzado.', sort_order: 4, max_cards: 35, is_active: true, card_count: 0 },
]

const demoCards: LearningCard[] = [
  { id: 'card-1', level_id: 'level-1', phrase: "I'm fine.", translation: 'Estoy bien.', explanation: 'Una respuesta corta y común para decir que estás bien.', topic: 'Vida real', image_path: '/legacy-images/4d5f2f101a1f627c2dbd86fc26fbf54b.png', correct_answer: 'fine', options: ['fine', 'okay', 'hello'] },
  { id: 'card-2', level_id: 'level-1', phrase: 'No worries!', translation: '¡No te preocupes!', explanation: 'Se usa para tranquilizar a alguien después de un error pequeño o una disculpa.', topic: 'Conversación', image_path: '/legacy-images/07defc2cacffce55d3074647fb7802d4.png', correct_answer: 'No worries', options: ['No worries', 'Good bye', 'Thank you'] },
]

const demoTutorials: Tutorial[] = [
  { id: 'tutorial-1', title: 'Cómo sonar natural al saludar', description: 'Tres frases cortas para empezar una conversación sin sonar de libro.', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', thumbnail_url: '/legacy-images/377383e100316bdcefcdf5c5b6edd13e.jpg', category: 'Conversación', duration_seconds: 420, is_published: true },
  { id: 'tutorial-2', title: 'Phrasal verbs para todos los días', description: 'Aprende expresiones que escucharás en una conversación real.', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', thumbnail_url: '/legacy-images/7e1c570a81da60f9a20c7769ab027e2c.jpg', category: 'Vocabulario', duration_seconds: 560, is_published: true },
  { id: 'tutorial-3', title: 'Escucha el contexto, no cada palabra', description: 'Una guía breve para entender la intención detrás de una frase.', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', thumbnail_url: '/legacy-images/cf958df2d570f0e1f9504a4203c21188.jpg', category: 'Escucha', duration_seconds: 300, is_published: true },
]

const demoItems: StoreItem[] = [
  { id: 'item-1', name: 'Neon Study Club', description: 'Un banner para quienes estudian después de medianoche.', item_type: 'banner', price_points: 120, asset_url: '/legacy-images/07defc2cacffce55d3074647fb7802d4.png', preview_url: '/legacy-images/07defc2cacffce55d3074647fb7802d4.png', rarity: 'rare', is_published: true },
  { id: 'item-2', name: 'Coral Streak', description: 'Presume tu constancia con un fondo coral.', item_type: 'banner', price_points: 180, asset_url: '/legacy-images/4d5f2f101a1f627c2dbd86fc26fbf54b.png', preview_url: '/legacy-images/4d5f2f101a1f627c2dbd86fc26fbf54b.png', rarity: 'epic', is_published: true },
  { id: 'item-3', name: 'Small Wins', description: 'Un marco sencillo para celebrar cada respuesta.', item_type: 'frame', price_points: 80, asset_url: '/legacy-images/377383e100316bdcefcdf5c5b6edd13e.jpg', preview_url: '/legacy-images/377383e100316bdcefcdf5c5b6edd13e.jpg', rarity: 'common', is_published: true },
]

function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [ready, setReady] = useState(!supabase)

  useEffect(() => {
    if (!supabase) return
    const client = supabase
    let active = true
    void client.auth.getSession().then(({ data }) => { if (active) { setSession(data.session); setReady(true) } })
    const { data: listener } = client.auth.onAuthStateChange((_event, nextSession) => { setSession(nextSession); setReady(true) })
    return () => { active = false; listener.subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    if (!supabase || !session?.user) { setProfile(null); return }
    void supabase.from('profiles').select('id,name,email,role,avatar_url').eq('id', session.user.id).maybeSingle().then(({ data }) => setProfile(data as Profile | null))
  }, [session])

  return { session, profile, ready }
}

function App() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [dark, setDark] = useState(() => localStorage.getItem('memeenglish-theme') !== 'light')
  const [toast, setToast] = useState('')

  useEffect(() => { document.documentElement.dataset.theme = dark ? 'dark' : 'light'; localStorage.setItem('memeenglish-theme', dark ? 'dark' : 'light') }, [dark])
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(''), 2800); return () => window.clearTimeout(timer) }, [toast])
  useEffect(() => {
    if (auth.ready && auth.session && sessionStorage.getItem('memeenglish-oauth-return') === '1') {
      sessionStorage.removeItem('memeenglish-oauth-return')
      navigate('/profile', { replace: true })
    }
  }, [auth.ready, auth.session, navigate])

  return <div className="app-shell">
    <SiteHeader profile={auth.profile} session={auth.session} dark={dark} onToggleTheme={() => setDark(value => !value)} />
    <main className="page-content"><Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/levels" element={<PrivatePage ready={auth.ready} session={auth.session}><LevelsPage session={auth.session} /></PrivatePage>} />
      <Route path="/study/:levelId" element={<PrivatePage ready={auth.ready} session={auth.session}><StudyPage session={auth.session} onToast={setToast} /></PrivatePage>} />
      <Route path="/tutorials" element={<PrivatePage ready={auth.ready} session={auth.session}><TutorialsPage session={auth.session} /></PrivatePage>} />
      <Route path="/store" element={<PrivatePage ready={auth.ready} session={auth.session}><StorePage session={auth.session} onToast={setToast} /></PrivatePage>} />
      <Route path="/profile" element={<PrivatePage ready={auth.ready} session={auth.session}><ProfilePage profile={auth.profile} session={auth.session} onToast={setToast} /></PrivatePage>} />
      <Route path="/admin" element={<AdminPage profile={auth.profile} session={auth.session} onToast={setToast} />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<HomePage />} />
    </Routes></main>
    <MobileNav profile={auth.profile} session={auth.session} />
    {toast && <div className="toast" role="status">{toast}</div>}
  </div>
}

function PrivatePage({ ready, session, children }: { ready: boolean; session: Session | null; children: ReactNode }) {
  if (!ready) return <section className="empty-state"><p className="eyebrow">MEMEENGLISH</p><h1>Restaurando tu sesión…</h1><p>Espera un momento mientras confirmamos tu acceso.</p></section>
  return session ? <>{children}</> : <LoginRequired />
}

function SiteHeader({ profile, session, dark, onToggleTheme }: { profile: Profile | null; session: Session | null; dark: boolean; onToggleTheme: () => void }) {
  const navigate = useNavigate()
  const signedIn = Boolean(session)
  const accountName = profile?.name || session?.user.user_metadata?.full_name || session?.user.email || 'Mi cuenta'
  async function logout() { if (supabase) await supabase.auth.signOut(); navigate('/') }
  return <header className="topbar">
    <Link className="brand" to="/"><span className="brand-mark">✦</span><span>Meme<span>English</span></span></Link>
    <nav className="top-nav" aria-label="Principal">
      <NavLink to="/levels">Aprender</NavLink><NavLink to="/tutorials">Tutoriales</NavLink><NavLink to="/store">Tienda</NavLink>
      {profile && (profile.role === 'owner' || profile.role === 'admin') && <NavLink to="/admin">Admin</NavLink>}
    </nav>
    <div className="top-actions">
      <button className="icon-button" onClick={onToggleTheme} aria-label="Cambiar tema">{dark ? '☼' : '☾'}</button>
      {signedIn ? <details className="account-menu"><summary><span className="avatar tiny">{initial(accountName)}</span><span className="account-name">{accountName}</span></summary><div className="menu-panel"><Link to="/profile">Mi progreso</Link>{(profile?.role === 'owner' || profile?.role === 'admin') && <Link to="/admin">Administración</Link>}<button onClick={() => void logout()}>Cerrar sesión</button></div></details> : <Link className="button small dark" to="/login">Entrar</Link>}
    </div>
  </header>
}

function MobileNav({ profile, session }: { profile: Profile | null; session: Session | null }) {
  return <nav className="mobile-nav"><NavLink to="/levels"><span>⌂</span>Aprender</NavLink><NavLink to="/tutorials"><span>▣</span>Videos</NavLink><NavLink to="/store"><span>✦</span>Tienda</NavLink><NavLink to={session ? '/profile' : '/login'}><span>◉</span>Perfil</NavLink></nav>
}

function HomePage() {
  return <>
    <section className="hero-wrap"><div className="hero-copy-block"><p className="eyebrow">INGLÉS REAL · EN POCOS MINUTOS</p><h1>Una frase.<br />Un meme.<br /><em>Un paso adelante.</em></h1><p className="hero-copy">Aprende expresiones que sí escucharás fuera del salón. Supera cada nivel con tarjetas breves, contexto y una voz que te acompaña.</p><div className="button-row"><Link className="button coral" to="/levels">Empezar a aprender <b>→</b></Link><Link className="button pale" to="/tutorials">Ver tutoriales</Link></div><p className="microcopy">Pruebas por nivel · 70% para avanzar · Sin presión</p></div><div className="hero-card"><div className="stamp">FRASE DEL DÍA</div><div className="meme-art">😬</div><p className="meme-caption">WHEN YOU SAY<br />“I'M FINE”<br />BUT YOU'RE NOT</p><span>Una expresión. Un contexto real.</span></div></section>
    <section className="value-strip"><article><span>01</span><h2>Entiende el contexto</h2><p>Cada tarjeta explica qué significa una frase y cuándo usarla.</p></article><article><span>02</span><h2>Escucha y repite</h2><p>La voz de tu dispositivo te acompaña con una pronunciación clara.</p></article><article><span>03</span><h2>Supera niveles</h2><p>Responde, gana puntos y desbloquea el siguiente nivel.</p></article></section>
    <section className="home-lower"><div><p className="eyebrow">TAMBIÉN EN TU RUTA</p><h2>Aprender no termina<br /><em>en una tarjeta.</em></h2><p>Descubre tutoriales, construye tu racha y usa tus puntos para personalizar tu perfil.</p></div><div className="feature-stack"><Link className="feature-card" to="/tutorials"><span className="feature-icon">▶</span><div><strong>Tutoriales breves</strong><small>Videos para escuchar, hablar y entender.</small></div><b>↗</b></Link><Link className="feature-card" to="/store"><span className="feature-icon">✦</span><div><strong>La tienda de puntos</strong><small>Convierte tu práctica en algo tuyo.</small></div><b>↗</b></Link></div></section>
  </>
}

function LevelsPage({ session }: { session: Session | null }) {
  const [levels, setLevels] = useState(demoLevels)
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!supabase || !session) return
    void Promise.all([
      supabase.from('levels').select('id,name,difficulty_label,description,sort_order,max_cards,is_active').eq('is_active', true).order('sort_order'),
      supabase.from('learning_cards').select('id,level_id').eq('is_published', true),
      supabase.from('level_progress').select('level_id,completed').eq('user_id', session.user.id),
    ]).then(([levelResult, cardResult, progressResult]) => {
      if (levelResult.data?.length) {
        const counts = (cardResult.data || []).reduce<Record<string, number>>((map, card) => {
          map[card.level_id as string] = (map[card.level_id as string] || 0) + 1
          return map
        }, {})
        setLevels((levelResult.data as Level[]).map(level => ({ ...level, card_count: counts[level.id] || 0 })))
      }
      setCompletedIds(new Set((progressResult.data || []).filter(item => item.completed).map(item => item.level_id as string)))
    })
  }, [session])

  return <section className="section-shell"><div className="section-heading"><div><p className="eyebrow">TU RUTA DE APRENDIZAJE</p><h1>La ciudad de las <em>frases.</em></h1><p>Avanza estación por estación. Cada nivel abre una forma nueva de entender el inglés.</p></div><div className="route-badge">{levels.length} niveles<br /><b>en tu ruta</b></div></div><div className="level-road">{levels.map((level, index) => {
    const unlocked = index === 0 || completedIds.has(levels[index - 1].id)
    return <article className={`level-card level-${index + 1}${unlocked ? '' : ' is-locked'}`} key={level.id}><div className="level-number">0{index + 1}</div><div className="level-copy"><span className="tag">{level.difficulty_label}</span><h2>{level.name}</h2><p>{level.description}</p><div className="level-meta"><span>{level.card_count ?? 0} tarjetas</span><span>{unlocked ? '70% para pasar' : '🔒 Completa el anterior'}</span></div></div><div className="level-action">{unlocked ? <Link className="button pale" to={`/study/${level.id}`}>{index === 0 ? 'Entrar al nivel' : 'Continuar nivel'} <b>→</b></Link> : <span className="button pale locked-button">🔒 Bloqueado</span>}</div></article>
  })}</div></section>
}

function StudyPage({ session, onToast }: { session: Session | null; onToast: (message: string) => void }) {
  const { levelId } = useParams()
  const navigate = useNavigate()
  const [cards, setCards] = useState(() => demoCards.filter(card => !levelId || card.level_id === levelId))
  const [cardIndex, setCardIndex] = useState(0)
  const [selected, setSelected] = useState('')
  const [feedback, setFeedback] = useState('')
  const [quizId, setQuizId] = useState<string | null>(null)
  const card = cards[cardIndex % cards.length] || demoCards[0]
  useEffect(() => {
    if (!supabase || !levelId) return
    void supabase.from('learning_cards').select('id,level_id,phrase,translation,explanation,topic,image_path,correct_answer,options').eq('level_id', levelId).eq('is_published', true).order('legacy_id').then(({ data }) => {
      if (data?.length) setCards(data as LearningCard[])
    })
  }, [levelId])
  useEffect(() => {
    if (!supabase || !session || !levelId || !cards.length || quizId || levelId.startsWith('level-')) return
    void supabase.rpc('start_quiz_session', { _level_id: levelId }).then(({ data, error }) => {
      if (error) {
        onToast(error.message.includes('level_locked') ? 'Completa el nivel anterior para continuar.' : 'No se pudo iniciar el nivel.')
        navigate('/levels')
        return
      }
      if (data?.[0]?.session_id) setQuizId(data[0].session_id as string)
    })
  }, [cards, levelId, quizId, session, onToast, navigate])
  function listen() { if (!('speechSynthesis' in window)) { onToast('La voz no está disponible en este navegador.'); return }; window.speechSynthesis.cancel(); const voice = new SpeechSynthesisUtterance(card.phrase); voice.lang = 'en-US'; window.speechSynthesis.speak(voice) }
  async function answer(event: FormEvent) {
    event.preventDefault()
    if (!selected) return
    const localCorrect = selected.toLowerCase() === card.correct_answer.toLowerCase()
    let isCorrect = localCorrect
    if (supabase && session && quizId) {
      const { data, error } = await supabase.rpc('submit_quiz_answer', { _session_id: quizId, _card_id: card.id, _answer: selected })
      if (!error) isCorrect = Boolean(data?.[0]?.is_correct)
    }
    const lastCard = cardIndex + 1 >= cards.length
    setFeedback(isCorrect ? '¡Correcto! Muy bien.' : 'No es correcto. Sigue practicando y vuelve a intentarlo.')
    if (lastCard && supabase && session && quizId) {
      const { data, error } = await supabase.rpc('finish_quiz_session', { _session_id: quizId })
      window.setTimeout(() => {
        if (error) onToast('No se pudo guardar el resultado del nivel.')
        else onToast(data?.[0]?.completed ? 'Nivel aprobado. El siguiente nivel está desbloqueado.' : 'Necesitas 70% para desbloquear el siguiente nivel.')
        navigate('/levels')
      }, 1300)
      return
    }
    window.setTimeout(() => { setCardIndex(value => value + 1); setSelected(''); setFeedback('') }, 1100)
  }
  return <section className="quiz-shell"><div className="quiz-head"><div><p className="eyebrow">PRUEBA · PRINCIPIANTE</p><h1>Una tarjeta a la vez.</h1><p>Elige la mejor opción por el contexto. La respuesta correcta no aparece antes de responder.</p></div><div className="score-pill">Aciertos<br /><b>{cardIndex}</b></div></div>{feedback && <div className={`feedback ${feedback.startsWith('¡') ? 'good' : 'bad'}`}>{feedback}</div>}<article className="quiz-card"><div className="quiz-progress"><span style={{ width: `${((cardIndex % 10) + 1) * 10}%` }} /></div><span className="tag">{card.topic}</span><h2>“{card.phrase}”</h2><button className="listen" onClick={listen}>♬ Escuchar pronunciación</button>{card.image_path && <img className="meme-image" src={asset(card.image_path)} alt="Meme de la tarjeta" onError={event => { event.currentTarget.src = asset('/meme-placeholder.svg') }} />}<p className="question-copy"><b>Elige la mejor opción:</b> demuestra lo que entendiste por el contexto.</p><form className="quiz-options" onSubmit={answer}>{card.options.map(option => <label key={option} className={selected === option ? 'selected' : ''}><input type="radio" name="answer" value={option} checked={selected === option} onChange={event => setSelected(event.target.value)} /><span>{option}</span></label>)}<button className="button coral full" type="submit">Comprobar y continuar →</button></form></article>{!session && <p className="login-hint">Estás viendo una prueba de demostración. <Link to="/login">Inicia sesión con Google</Link> para guardar tu progreso y puntos.</p>}<Link className="text-link" to="/levels">← Volver a niveles</Link></section>
}

function TutorialsPage({ session }: { session: Session | null }) {
  const [tutorials, setTutorials] = useState(demoTutorials)
  const [active, setActive] = useState<Tutorial | null>(null)
  const [category, setCategory] = useState('Todos')
  useEffect(() => { if (!supabase) return; void supabase.from('tutorials').select('id,title,description,video_url,thumbnail_url,category,duration_seconds,is_published').eq('is_published', true).order('sort_order').then(({ data }) => { if (data?.length) setTutorials(data as Tutorial[]) }) }, [])
  const visibleTutorials = category === 'Todos' ? tutorials : tutorials.filter(tutorial => tutorial.category === category)
  return <section className="section-shell"><div className="section-heading compact"><div><p className="eyebrow">APRENDE A TU RITMO</p><h1>Un video. Una <em>idea nueva.</em></h1><p>Guías cortas para hablar con más naturalidad y entender lo que escuchas.</p></div><span className="section-note">{session ? 'Tu biblioteca' : 'Vista previa'}</span></div><div className="filter-row">{['Todos', 'Conversación', 'Vocabulario', 'Escucha'].map(option => <button key={option} className={`filter ${category === option ? 'active' : ''}`} onClick={() => setCategory(option)}>{option}</button>)}</div><div className="tutorial-grid">{visibleTutorials.map(tutorial => <article className="tutorial-card" key={tutorial.id}><button className="thumbnail-button" onClick={() => setActive(tutorial)}><img src={asset(tutorial.thumbnail_url || '/meme-placeholder.svg')} alt="" /><span className="play-button">▶</span><small>{formatDuration(tutorial.duration_seconds)}</small></button><div className="tutorial-body"><span className="tag">{tutorial.category}</span><h2>{tutorial.title}</h2><p>{tutorial.description}</p><button className="text-link" onClick={() => setActive(tutorial)}>Ver tutorial →</button></div></article>)}</div>{active && <div className="modal-backdrop" onClick={() => setActive(null)}><div className="video-modal" onClick={event => event.stopPropagation()}><button className="close-button" onClick={() => setActive(null)}>×</button><div className="video-frame"><iframe src={toEmbedUrl(active.video_url)} title={active.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div><h2>{active.title}</h2><p>{active.description}</p></div></div>}</section>
}

function StorePage({ session, onToast }: { session: Session | null; onToast: (message: string) => void }) {
  const [items, setItems] = useState(demoItems)
  const [progress, setProgress] = useState<UserProgress>({ points: 240, current_streak: 4 })
  useEffect(() => { if (!supabase) return; void supabase.from('store_items').select('id,name,description,item_type,price_points,asset_url,preview_url,rarity,stock,is_published').eq('is_published', true).order('sort_order').then(({ data }) => { if (data?.length) setItems(data as StoreItem[]) }); if (session) void supabase.from('user_progress').select('points,current_streak').eq('user_id', session.user.id).maybeSingle().then(({ data }) => { if (data) setProgress(data as UserProgress) }) }, [session])
  async function buy(item: StoreItem) { if (!session || !supabase) { onToast('Inicia sesión con Google para comprar con tus puntos.'); return }; const key = `purchase-${item.id}-${crypto.randomUUID()}`; const { data, error } = await supabase.rpc('purchase_store_item', { _item_id: item.id, _idempotency_key: key }); if (error) onToast('No se pudo completar la compra.'); else onToast(data?.[0]?.message || 'Compra realizada.') }
  return <section className="section-shell"><div className="section-heading compact"><div><p className="eyebrow">RECOMPENSAS POR PRACTICAR</p><h1>Tu inglés también <em>se ve.</em></h1><p>Usa los puntos que ganas estudiando para hacer tu perfil más tuyo.</p></div><div className="points-wallet"><span>Tu saldo</span><b>✦ {progress.points}</b><small>{progress.current_streak} días de racha</small></div></div><div className="shop-grid">{items.map(item => <article className="shop-card" key={item.id}><div className="shop-art"><img src={asset(item.preview_url || item.asset_url || '/meme-placeholder.svg')} alt="" /><span className={`rarity ${item.rarity}`}>{item.rarity}</span></div><div className="shop-body"><div><h2>{item.name}</h2><p>{item.description}</p></div><div className="shop-buy"><strong>✦ {item.price_points}</strong><button className="button coral" onClick={() => void buy(item)}>Conseguir</button></div></div></article>)}</div></section>
}

function ProfilePage({ profile, session, onToast }: { profile: Profile | null; session: Session | null; onToast: (message: string) => void }) {
  const [progress, setProgress] = useState<UserProgress>({ points: 240, current_streak: 4 })
  const [inventory, setInventory] = useState<OwnedItem[]>([])
  const [equippedId, setEquippedId] = useState<string | null>(null)
  useEffect(() => {
    if (!supabase || !session) return
    void Promise.all([
      supabase.from('user_progress').select('points,current_streak').eq('user_id', session.user.id).maybeSingle(),
      supabase.from('user_inventory').select('item_id,quantity,store_items(id,name,description,item_type,price_points,asset_url,preview_url,rarity,stock,is_published)').eq('user_id', session.user.id),
      supabase.from('profile_customizations').select('equipped_banner_item_id').eq('user_id', session.user.id).maybeSingle(),
    ]).then(([progressResult, inventoryResult, customizationResult]) => {
      if (progressResult.data) setProgress(progressResult.data as UserProgress)
      if (inventoryResult.data) setInventory((inventoryResult.data as unknown as Array<{ item_id: string; quantity: number; store_items: StoreItem | StoreItem[] | null }>).map(row => ({ ...row, store_items: Array.isArray(row.store_items) ? row.store_items[0] : row.store_items })).filter(row => row.store_items).map(row => ({ ...(row.store_items as StoreItem), item_id: row.item_id, quantity: row.quantity })))
      if (customizationResult.data?.equipped_banner_item_id) setEquippedId(customizationResult.data.equipped_banner_item_id as string)
    })
  }, [session])
  if (!session || !profile) return <LoginRequired />
  const equipped = inventory.find(item => item.item_id === equippedId)
  async function equip(itemId: string) { if (!supabase) return; const { data, error } = await supabase.rpc('equip_profile_item', { _item_id: itemId }); if (error || data !== true) onToast('Solo puedes equipar recompensas que ya compraste.'); else { setEquippedId(itemId); onToast('Banner equipado en tu perfil.') } }
  return <section className="profile-shell"><div className="profile-banner" style={{ backgroundImage: `url(${asset(equipped?.asset_url || demoItems[0].asset_url)})` }}><div className="profile-banner-overlay" /></div><div className="profile-intro"><div className="avatar large">{initial(profile.name || profile.email)}</div><div><p className="eyebrow">TU ESPACIO DE APRENDIZAJE</p><h1>{profile.name || 'Estudiante'}</h1><p>Progreso general: <b>Principiante</b> · sigue a tu ritmo.</p></div><Link className="button pale" to="/store">Personalizar perfil</Link></div><div className="metric-grid"><article><b>{progress.points}</b><span>puntos</span></article><article><b>{progress.current_streak}</b><span>días de racha</span></article><article><b>1/4</b><span>niveles completados</span></article></div><div className="profile-columns"><section className="progress-panel"><p className="eyebrow">TU AVANCE</p><h2>La ruta sigue abierta.</h2>{demoLevels.map((level, index) => <div className="progress-row" key={level.id}><span>{level.name}</span><div className="progress-line"><i style={{ width: `${index === 0 ? 100 : index === 1 ? 42 : 0}%` }} /></div><b>{index === 0 ? '10/10' : index === 1 ? '7/16' : '—'}</b></div>)}</section><section className="progress-panel inventory-panel"><p className="eyebrow">TU COLECCIÓN</p><h2>{inventory.length ? 'Recompensas compradas.' : 'Tu primera recompensa te espera.'}</h2>{inventory.length ? inventory.map(item => <div className="mini-item" key={item.item_id}><img src={asset(item.preview_url || item.asset_url)} alt="" /><div><b>{item.name}</b><small>{item.quantity} disponible{item.quantity === 1 ? '' : 's'}</small></div>{equippedId === item.item_id ? <span>✓</span> : <button className="text-link" onClick={() => void equip(item.item_id)}>Equipar</button>}</div>) : <p>Compra un banner en la tienda para cambiar el fondo de tu perfil.</p>}<Link className="text-link" to="/store">Ver tienda →</Link></section></div><button className="text-link danger-link" onClick={() => onToast('Tus preferencias visuales se controlan desde la tienda y tu inventario.')}>Editar preferencias</button></section>
}

function AdminPage({ profile, session, onToast }: { profile: Profile | null; session: Session | null; onToast: (message: string) => void }) {
  const [tab, setTab] = useState<'content' | 'tutorials' | 'store'>('content')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [url, setUrl] = useState('')
  const [price, setPrice] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingType, setEditingType] = useState<'tutorial' | 'item' | null>(null)
  const [tutorials, setTutorials] = useState<Tutorial[]>([])
  const [items, setItems] = useState<StoreItem[]>([])
  const [levels, setLevels] = useState<Level[]>(demoLevels)
  const [cards, setCards] = useState<LearningCard[]>([])
  const [editingCard, setEditingCard] = useState<LearningCard | null>(null)
  const [cardPhrase, setCardPhrase] = useState('')
  const [cardTranslation, setCardTranslation] = useState('')
  const [cardAnswer, setCardAnswer] = useState('')
  const canAdmin = Boolean(session && profile && (profile.role === 'owner' || profile.role === 'admin'))

  useEffect(() => {
    if (!supabase || !session || !canAdmin) return
    void Promise.all([
      supabase.from('tutorials').select('id,title,description,video_url,thumbnail_url,category,duration_seconds,is_published').order('created_at', { ascending: false }),
      supabase.from('store_items').select('id,name,description,item_type,price_points,asset_url,preview_url,rarity,stock,is_published').order('created_at', { ascending: false }),
      supabase.from('levels').select('id,name,difficulty_label,description,sort_order,max_cards,is_active').order('sort_order'),
      supabase.from('learning_cards').select('id,level_id,phrase,translation,explanation,topic,image_path,correct_answer,options').order('legacy_id'),
    ]).then(([tutorialResult, itemResult, levelResult, cardResult]) => {
      if (tutorialResult.data) setTutorials(tutorialResult.data as Tutorial[])
      if (itemResult.data) setItems(itemResult.data as StoreItem[])
      if (levelResult.data?.length) setLevels(levelResult.data as Level[])
      if (cardResult.data) setCards(cardResult.data as LearningCard[])
    })
  }, [canAdmin, session])

  if (!session || !profile || (profile.role !== 'owner' && profile.role !== 'admin')) return <LoginRequired admin />

  function resetForm() { setTitle(''); setDescription(''); setUrl(''); setPrice(''); setImageUrl(''); setEditingId(null); setEditingType(null) }
  function editTutorial(tutorial: Tutorial) { setTab('tutorials'); setEditingId(tutorial.id); setEditingType('tutorial'); setTitle(tutorial.title); setDescription(tutorial.description); setUrl(tutorial.video_url); setImageUrl(tutorial.thumbnail_url || '') }
  function editItem(item: StoreItem) { setTab('store'); setEditingId(item.id); setEditingType('item'); setTitle(item.name); setDescription(item.description); setPrice(String(item.price_points)); setImageUrl(item.asset_url) }
  function editCard(card: LearningCard) { setTab('content'); setEditingCard(card); setCardPhrase(card.phrase); setCardTranslation(card.translation); setCardAnswer(card.correct_answer) }

  async function saveTutorial(event: FormEvent) {
    event.preventDefault()
    if (!supabase || !session) return
    const payload = { title, description, video_url: url, thumbnail_url: imageUrl || null, category: 'General', is_published: true }
    const result = editingType === 'tutorial' && editingId ? await supabase.from('tutorials').update(payload).eq('id', editingId).select('id,title,description,video_url,thumbnail_url,category,duration_seconds,is_published').single() : await supabase.from('tutorials').insert({ ...payload, created_by: session.user.id }).select('id,title,description,video_url,thumbnail_url,category,duration_seconds,is_published').single()
    if (result.error) { onToast('No se pudo guardar el tutorial.'); return }
    if (result.data) setTutorials(current => editingId ? current.map(item => item.id === editingId ? result.data as Tutorial : item) : [result.data as Tutorial, ...current])
    onToast(editingId ? 'Tutorial actualizado.' : 'Tutorial publicado.')
    resetForm()
  }

  async function saveItem(event: FormEvent) {
    event.preventDefault()
    if (!supabase || !session) return
    const payload = { name: title, description, item_type: 'banner', price_points: Math.max(1, Number(price) || 1), asset_url: imageUrl || '/meme-placeholder.svg', preview_url: imageUrl || '/meme-placeholder.svg', rarity: 'common', is_published: true }
    const result = editingType === 'item' && editingId ? await supabase.from('store_items').update(payload).eq('id', editingId).select('id,name,description,item_type,price_points,asset_url,preview_url,rarity,stock,is_published').single() : await supabase.from('store_items').insert({ ...payload, created_by: session.user.id }).select('id,name,description,item_type,price_points,asset_url,preview_url,rarity,stock,is_published').single()
    if (result.error) { onToast('No se pudo guardar el artículo.'); return }
    if (result.data) setItems(current => editingId ? current.map(item => item.id === editingId ? result.data as StoreItem : item) : [result.data as StoreItem, ...current])
    onToast(editingId ? 'Artículo actualizado.' : 'Artículo publicado.')
    resetForm()
  }

  async function updateCard(event: FormEvent) {
    event.preventDefault()
    if (!supabase || !editingCard) return
    const result = await supabase.from('learning_cards').update({ phrase: cardPhrase, translation: cardTranslation, correct_answer: cardAnswer }).eq('id', editingCard.id).select('id,level_id,phrase,translation,explanation,topic,image_path,correct_answer,options').single()
    if (result.error) { onToast('No se pudo actualizar la tarjeta.'); return }
    if (result.data) setCards(current => current.map(card => card.id === editingCard.id ? result.data as LearningCard : card))
    onToast('Tarjeta actualizada.')
    setEditingCard(null)
  }

  async function togglePublish(type: 'tutorial' | 'item', id: string, isPublished: boolean) {
    if (!supabase) return
    const table = type === 'tutorial' ? 'tutorials' : 'store_items'
    const { error } = await supabase.from(table).update({ is_published: !isPublished }).eq('id', id)
    if (error) onToast('No se pudo cambiar el estado.')
    else if (type === 'tutorial') setTutorials(current => current.map(item => item.id === id ? { ...item, is_published: !isPublished } : item))
    else setItems(current => current.map(item => item.id === id ? { ...item, is_published: !isPublished } : item))
  }

  const formIsTutorial = tab === 'tutorials'
  return <section className="admin-shell"><div className="admin-heading"><div><p className="eyebrow">CENTRO DE CONTROL · {profile.role.toUpperCase()}</p><h1>Administra la experiencia.</h1><p>Contenido, recompensas y niveles desde un mismo lugar.</p></div><div className="admin-stats"><span><b>{levels.length}</b> niveles</span><span><b>{cards.length}</b> tarjetas</span><span><b>{tutorials.length}</b> videos</span></div></div><div className="admin-tabs"><button className={tab === 'content' ? 'active' : ''} onClick={() => setTab('content')}>Tarjetas y niveles</button><button className={tab === 'tutorials' ? 'active' : ''} onClick={() => setTab('tutorials')}>Tutoriales</button><button className={tab === 'store' ? 'active' : ''} onClick={() => setTab('store')}>Tienda</button></div>{tab === 'content' && <div className="admin-grid"><section className="admin-panel"><p className="eyebrow">BIBLIOTECA</p><h2>Contenido de aprendizaje</h2>{levels.map(level => <details className="admin-level" key={level.id}><summary><span>{level.name}</span><b>{cards.filter(card => card.level_id === level.id).length} tarjetas</b></summary><div><p>{level.description}</p>{cards.filter(card => card.level_id === level.id).slice(0, 8).map(card => <div className="admin-record" key={card.id}><span>{card.phrase}</span><button className="text-link" onClick={() => editCard(card)}>Editar</button></div>)}</div></details>)}{editingCard && <form className="admin-form card-editor" onSubmit={updateCard}><p className="eyebrow">EDITAR TARJETA</p><label>Frase<input value={cardPhrase} onChange={event => setCardPhrase(event.target.value)} required /></label><label>Traducción<input value={cardTranslation} onChange={event => setCardTranslation(event.target.value)} required /></label><label>Respuesta correcta<input value={cardAnswer} onChange={event => setCardAnswer(event.target.value)} required /></label><div className="button-row"><button className="button coral" type="submit">Guardar tarjeta</button><button className="button pale" type="button" onClick={() => setEditingCard(null)}>Cancelar</button></div></form>}</section><section className="admin-panel audit-panel"><p className="eyebrow">SEGURIDAD</p><h2>Operaciones protegidas</h2><p>Las compras y puntos se validan en funciones de Supabase. Los cambios administrativos quedan registrados en auditoría.</p><div className="security-note"><span>✓</span><div><b>Ledger idempotente</b><small>Los reintentos no duplican puntos.</small></div></div><div className="security-note"><span>✓</span><div><b>Roles con RLS</b><small>El navegador no puede elevar permisos.</small></div></div></section></div>}{tab === 'tutorials' && <div className="admin-grid"><section className="admin-panel"><p className="eyebrow">{editingType === 'tutorial' ? 'EDITAR TUTORIAL' : 'NUEVO TUTORIAL'}</p><h2>{editingType === 'tutorial' ? 'Actualizar video' : 'Publicar video'}</h2><form className="admin-form" onSubmit={saveTutorial}><label>Título<input value={title} onChange={event => setTitle(event.target.value)} required /></label><label>Descripción<textarea value={description} onChange={event => setDescription(event.target.value)} rows={3} /></label><label>URL de video<input value={url} onChange={event => setUrl(event.target.value)} placeholder="https://youtube.com/watch?..." required /></label><label>URL de miniatura<input value={imageUrl} onChange={event => setImageUrl(event.target.value)} placeholder="/legacy-images/..." /></label><div className="button-row"><button className="button coral" type="submit">{editingType === 'tutorial' ? 'Guardar cambios' : 'Publicar tutorial'} →</button>{editingType === 'tutorial' && <button className="button pale" type="button" onClick={resetForm}>Cancelar</button>}</div></form></section><section className="admin-panel"><p className="eyebrow">CATÁLOGO · {tutorials.length}</p><h2>Editar tutoriales</h2>{tutorials.map(tutorial => <div className="admin-record" key={tutorial.id}><div><b>{tutorial.title}</b><small>{tutorial.is_published ? 'Publicado' : 'Oculto'}</small></div><div className="inline-actions"><button className="text-link" onClick={() => editTutorial(tutorial)}>Editar</button><button className="text-link" onClick={() => void togglePublish('tutorial', tutorial.id, tutorial.is_published)}>{tutorial.is_published ? 'Ocultar' : 'Publicar'}</button></div></div>)}</section></div>}{tab === 'store' && <div className="admin-grid"><section className="admin-panel"><p className="eyebrow">{editingType === 'item' ? 'EDITAR RECOMPENSA' : 'NUEVA RECOMPENSA'}</p><h2>{editingType === 'item' ? 'Actualizar banner' : 'Agregar banner'}</h2><form className="admin-form" onSubmit={saveItem}><label>Nombre<input value={title} onChange={event => setTitle(event.target.value)} required /></label><label>Descripción<textarea value={description} onChange={event => setDescription(event.target.value)} rows={3} /></label><label>Precio en puntos<input type="number" min="1" value={price} onChange={event => setPrice(event.target.value)} required /></label><label>URL de imagen<input value={imageUrl} onChange={event => setImageUrl(event.target.value)} placeholder="/legacy-images/..." /></label><div className="button-row"><button className="button coral" type="submit">{editingType === 'item' ? 'Guardar cambios' : 'Publicar artículo'} →</button>{editingType === 'item' && <button className="button pale" type="button" onClick={resetForm}>Cancelar</button>}</div></form></section><section className="admin-panel"><p className="eyebrow">CATÁLOGO · {items.length}</p><h2>Editar banners</h2>{items.map(item => <div className="admin-record" key={item.id}><div><b>{item.name}</b><small>✦ {item.price_points} · {item.is_published ? 'Publicado' : 'Oculto'}</small></div><div className="inline-actions"><button className="text-link" onClick={() => editItem(item)}>Editar</button><button className="text-link" onClick={() => void togglePublish('item', item.id, item.is_published)}>{item.is_published ? 'Ocultar' : 'Publicar'}</button></div></div>)}</section></div>}</section>
}

function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  async function login() { if (!supabase) { setMessage('El preview está en modo visual. Configura las variables VITE_SUPABASE para iniciar sesión.'); return }; setLoading(true); sessionStorage.setItem('memeenglish-oauth-return', '1'); const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: new URL(import.meta.env.BASE_URL, window.location.origin).toString() } }); if (error) { sessionStorage.removeItem('memeenglish-oauth-return'); setMessage(error.message) }; setLoading(false) }
  return <section className="auth-shell"><div className="auth-message"><p className="eyebrow">MEMEENGLISH</p><h1>Tu próxima frase favorita empieza aquí.</h1><p>Aprende expresiones reales, escucha la pronunciación y convierte tu constancia en puntos para tu perfil.</p><div className="auth-quote">“The best way to learn is to keep showing up.”</div></div><div className="auth-card"><span className="google-mark">G</span><h2>Entra con Google</h2><p>No necesitas memorizar otra contraseña. Tu cuenta queda protegida por Supabase Auth.</p><button className="button coral full" onClick={() => void login()} disabled={loading}>{loading ? 'Conectando…' : 'Continuar con Google →'}</button>{message && <div className="feedback bad">{message}</div>}<p className="auth-footnote">Al entrar aceptas usar EnglishMeme para fines de aprendizaje.</p></div></section>
}

function LoginRequired({ admin = false }: { admin?: boolean }) { return <section className="empty-state"><span className="empty-icon">{admin ? '◈' : '◎'}</span><p className="eyebrow">{admin ? 'ÁREA PRIVADA' : 'TU ESPACIO'}</p><h1>{admin ? 'Inicia sesión para entrar a Admin.' : 'Tu progreso te espera.'}</h1><p>Entra con Google para guardar tarjetas, puntos, rachas y personalizaciones.</p><Link className="button coral" to="/login">Continuar con Google →</Link></section> }

function initial(value: string) { return value.trim().slice(0, 1).toUpperCase() || 'M' }
function formatDuration(seconds?: number | null) { if (!seconds) return 'Video breve'; return `${Math.floor(seconds / 60)} min` }
function toEmbedUrl(url: string) { const match = url.match(/[?&]v=([^&]+)/); return match ? `https://www.youtube.com/embed/${match[1]}` : url.replace('watch?v=', 'embed/') }

export default App
