import os
import json
import datetime
import feedparser
import google.generativeai as genai

# Configuración de Feeds RSS (Fuentes financieras en Español)
RSS_FEEDS = {
    "Investing (ES)": "https://es.investing.com/rss/news_25.rss",
    "El Economista": "https://www.eleconomista.es/rss/rss-mercados.php"
}

def fetch_rss_news():
    news_items = []
    print("Obteniendo noticias de RSS...")
    for source, url in RSS_FEEDS.items():
        try:
            feed = feedparser.parse(url)
            # Tomar las 5 noticias más recientes de cada fuente
            for entry in feed.entries[:5]:
                news_items.append({
                    "id": entry.get("id", entry.link),
                    "title": entry.title,
                    "summary": entry.get("description", entry.title)[:200] + "...",
                    "source": source,
                    "time": datetime.datetime.now().strftime("%I:%M %p"),
                    "url": entry.link,
                    "category": "Mercados",
                    "impact": "neutral"
                })
        except Exception as e:
            print(f"Error obteniendo {source}: {e}")
            
    return news_items

def generate_ai_conclusion(news_items):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Aviso: GEMINI_API_KEY no encontrada en variables de entorno. Usando conclusión genérica.")
        return "**Actualización de Mercados:**\n\nNo se ha configurado una clave de API de Inteligencia Artificial para generar el resumen automatizado. Una vez configurado, aquí aparecerá un análisis detallado del impacto geopolítico en acciones, ETFs y metales preciosos basándose en los titulares del día."

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Preparar el contexto para la IA
        context = "Titulares de hoy:\n"
        for item in news_items:
            context += f"- {item['title']}\n"
            
        prompt = f"""
        Eres un analista financiero experto. Revisa los siguientes titulares de noticias de hoy.
        Genera una conclusión concisa en ESPAÑOL (máximo 3 párrafos cortos) enfocada en cómo estas noticias 
        afectan la geopolítica, la macroeconomía, y el mercado de valores (Acciones, ETFs, metales preciosos).
        Utiliza un tono profesional y objetivo. Formatea el texto con negritas para destacar los conceptos clave.
        
        Noticias:
        {context}
        """
        
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Error al generar conclusión con IA: {e}")
        return f"**Error al conectar con la IA.**\n\nHubo un problema al generar el análisis del mercado para el día de hoy. El error interno es: {str(e)}"

def main():
    today_str = datetime.datetime.now().strftime("%Y-%m-%d")
    
    # 1. Obtener noticias
    news = fetch_rss_news()
    
    # 2. Generar conclusión
    conclusion = generate_ai_conclusion(news)
    
    # 3. Ensamblar JSON
    data = {
        "date": today_str,
        "conclusion": conclusion,
        "news": news
    }
    
    # 4. Guardar archivo
    os.makedirs("data", exist_ok=True)
    filename = f"data/{today_str}.json"
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
    print(f"Archivo generado exitosamente: {filename}")

if __name__ == "__main__":
    main()
