from groq import Groq
from app.core.config import settings

def generate_business_insight(kpi_data: dict, region_data: list) -> str:
    """Veritabanından gelen özet verileri Groq (Llama-3) motoruna gönderip analiz ister."""
    
    if not settings.GROQ_API_KEY or settings.GROQ_API_KEY == "gsk-dummy-key":
        return (
            "🤖 [AI Demo Modu]: Verileriniz incelendi. "
            "Satışların Marmara bölgesinde yoğunlaştığı görülmektedir. "
            "Elektronik kategorisinde stok artırımı ve Ege bölgesinde yeni bir kampanya önerilir. "
            "(Gerçek analiz için Groq API Key giriniz.)"
        )

    client = Groq(api_key=settings.GROQ_API_KEY)
    
    prompt = f"""
    Sen kıdemli bir veri analisti ve iş stratejistisin. Aşağıdaki şirket verilerini inceleyerek yöneticilere kısa, net ve aksiyon alınabilir 3 maddelik bir özet çıkar.

    [Temel Göstergeler]
    Toplam Gelir: {kpi_data.get('total_revenue')} TL
    Toplam İşlem: {kpi_data.get('transaction_count')}
    Ortalama İşlem Tutarı: {kpi_data.get('average_transaction_value')} TL

    [Bölgesel Satışlar]
    {region_data}

    Lütfen yorumunu doğrudan yap, giriş veya gelişme cümleleri kullanma. Hedef odaklı ol. Cevabını Türkçe ver.
    """

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",  # Groq üzerindeki aşırı hızlı ve yetenekli model
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=300
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"AI Analiz Hatası: {str(e)}"