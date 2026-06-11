const { useState, useEffect, useRef } = React;

// --- Componente de Gráfico de TradingView ---
const TradingViewWidget = ({ isDarkMode }) => {
    const container = useRef(null);

    useEffect(() => {
        // Limpiar el contenedor antes de inyectar el script para evitar duplicados al cambiar de tema
        if (container.current) {
            container.current.innerHTML = '<div class="tradingview-widget-container__widget" style="height:calc(100% - 32px);width:100%"></div>';
        }

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
        script.type = "text/javascript";
        script.async = true;
        
        // Configuración del widget (Puedes cambiar el símbolo por defecto, ej: SP:SPX, FX:EURUSD, XAUUSD)
        const config = {
            "autosize": true,
            "symbol": "SP:SPX", 
            "interval": "D",
            "timezone": "Etc/UTC",
            "theme": isDarkMode ? "dark" : "light",
            "style": "1",
            "locale": "es",
            "enable_publishing": false,
            "backgroundColor": isDarkMode ? "#111827" : "#ffffff",
            "gridColor": isDarkMode ? "#1f2937" : "#f3f4f6",
            "hide_top_toolbar": false,
            "hide_legend": false,
            "save_image": false,
            "container_id": "tradingview_chart"
        };
        
        script.innerHTML = JSON.stringify(config);
        
        if (container.current) {
            container.current.appendChild(script);
        }
    }, [isDarkMode]);

    return (
        <div className="h-[500px] w-full border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
            <div className="tradingview-widget-container" ref={container} style={{ height: "100%", width: "100%" }}>
                {/* El widget se inyectará aquí */}
            </div>
        </div>
    );
};

// --- Componente Principal ---
const App = () => {
    // Estados
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return localStorage.getItem('theme') === 'dark' || false;
    });
    
    const [todayStr] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });
    
    const [selectedDate, setSelectedDate] = useState(todayStr);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Efecto para el tema
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    // Efecto para inicializar Lucide icons (si usáramos iconos nativos de lucide en el DOM)
    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, []);

    // Fetch de datos
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`data/${selectedDate}.json`);
                if (!response.ok) throw new Error('No hay datos para esta fecha.');
                const jsonData = await response.json();
                setData(jsonData);
            } catch (err) {
                console.error(err);
                setError(err.message);
                setData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedDate]);

    // Limitar el calendario hasta 3 meses atrás
    const minDate = new Date();
    minDate.setMonth(minDate.getMonth() - 3);
    const minDateStr = `${minDate.getFullYear()}-${String(minDate.getMonth() + 1).padStart(2, '0')}-${String(minDate.getDate()).padStart(2, '0')}`;

    return (
        <div className="flex flex-col min-h-screen">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <i data-lucide="globe" className="text-brand-600 dark:text-brand-500"></i>
                            <span className="font-bold text-xl tracking-tight">Geopolítica Actual</span>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-600 dark:text-gray-300">
                                {selectedDate === todayStr ? 'Hoy' : selectedDate}
                            </span>
                            <button 
                                onClick={() => setIsDarkMode(!isDarkMode)}
                                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
                                aria-label="Cambiar tema"
                            >
                                {isDarkMode ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
                
                {/* Header & Calendar */}
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Perspectiva del Mercado</h1>
                        <p className="text-gray-500 dark:text-gray-400">Impacto macroeconómico en Acciones, ETFs y Metales Preciosos.</p>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                        <label htmlFor="history-date" className="text-sm font-medium text-gray-500 dark:text-gray-400">Historial de noticias:</label>
                        <input 
                            type="date" 
                            id="history-date"
                            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-medium"
                            value={selectedDate}
                            max={todayStr}
                            min={minDateStr}
                            onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                        />
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Columna Izquierda: Análisis y Gráfico (Toma 2 columnas en Desktop) */}
                    <div className="lg:col-span-2 flex flex-col gap-8">
                        
                        {/* Componente de TradingView */}
                        <section>
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-500"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                                Análisis Técnico
                            </h2>
                            <TradingViewWidget isDarkMode={isDarkMode} />
                        </section>

                        {/* Conclusión IA */}
                        <section>
                            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Conclusión Diaria (Gemini AI)</h2>
                                </div>
                                
                                {loading ? (
                                    <div className="animate-pulse flex flex-col gap-3 py-4">
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                                    </div>
                                ) : error ? (
                                    <p className="text-red-500 dark:text-red-400 py-4 font-medium">{error}</p>
                                ) : (
                                    <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
                                        {/* Renderizamos el markdown simple asumiendo negritas de Gemini */}
                                        {data?.conclusion.split('\n\n').map((paragraph, idx) => (
                                            <p key={idx} dangerouslySetInnerHTML={{ __html: paragraph.replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900 dark:text-white">$1</strong>') }} className="mb-4 leading-relaxed"></p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Columna Derecha: Feed de Noticias */}
                    <div className="lg:col-span-1">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-800">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>
                            Titulares Relevantes
                        </h2>
                        
                        <div className="flex flex-col gap-4">
                            {loading ? (
                                [...Array(3)].map((_, i) => (
                                    <div key={i} className="animate-pulse bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-800 h-32"></div>
                                ))
                            ) : error ? (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    <p>Intenta con otra fecha.</p>
                                </div>
                            ) : data?.news && data.news.length > 0 ? (
                                data.news.map((item, idx) => (
                                    <article key={idx} className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-brand-300 dark:hover:border-brand-700 transition-all group">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">{item.source}</span>
                                            <span className="text-xs text-gray-500">{item.time}</span>
                                        </div>
                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 leading-snug group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                                            <a href={item.url} target="_blank" rel="noreferrer">{item.title}</a>
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{item.summary}</p>
                                    </article>
                                ))
                            ) : (
                                <p className="text-gray-500">No hay titulares para esta fecha.</p>
                            )}
                        </div>
                    </div>

                </div>
            </main>

            {/* Footer */}
            <footer className="py-6 text-center text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800 mt-auto">
                <p>&copy; {new Date().getFullYear()} Geopolítica Actual. Desarrollado con React y Gemini AI.</p>
            </footer>
        </div>
    );
};

// Renderizar la App
const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);
root.render(<App />);
