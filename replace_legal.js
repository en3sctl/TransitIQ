const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'app', 'checkout', 'page.tsx');

let content = fs.readFileSync(filePath, 'utf8');

const kvkkReplacement = `const KvkkContent = memo(() => (
  <div className="space-y-4 text-sm text-slate-600 dark:text-zinc-300 leading-relaxed max-w-none">
    <p><strong>Veri Sorumlusunun Kimliği:</strong> TransitIQ Ulaşım A.Ş. olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu uyarınca, kişisel verileriniz veri sorumlusu sıfatıyla tarafımızca işlenmektedir.</p>
    <p><strong>Kişisel Verilerin İşlenme Amacı:</strong> Toplanan kişisel verileriniz (Ad, Soyad, T.C. Kimlik No, İletişim bilgileri); bilet satış sözleşmesinin kurulması, sefer ve koltuk rezervasyonlarının yapılması, Ulaştırma Bakanlığı (UETDS) yasal bildirim zorunluluklarının yerine getirilmesi, ödeme işlemlerinin (Iyzico) güvenli bir şekilde gerçekleştirilmesi amaçlarıyla işlenmektedir.</p>
    <p><strong>Kişisel Verilerin Aktarılması:</strong> Söz konusu kişisel verileriniz, yasal zorunluluklar kapsamında Ulaştırma ve Altyapı Bakanlığına, ödeme altyapısının sağlanması amacıyla yetkili ödeme kuruluşlarına (Iyzico) ve kanunen yetkili kamu kurumlarına aktarılabilecektir.</p>
    <p><strong>Kişisel Veri Toplamanın Yöntemi ve Hukuki Sebebi:</strong> Kişisel verileriniz, web sitemiz üzerinden elektronik ortamda; &quot;Bir sözleşmenin kurulması veya ifasıyla doğrudan doğruya ilgili olması&quot; ve &quot;Veri sorumlusunun hukuki yükümlülüğünü yerine getirebilmesi&quot; hukuki sebeplerine dayanılarak otomatik yollarla toplanmaktadır.</p>
    <p><strong>İlgili Kişinin Hakları:</strong> Kanun&apos;un 11. maddesi uyarınca; verilerinizin işlenip işlenmediğini öğrenme, amacına uygun kullanılıp kullanılmadığını bilme, eksikse düzeltilmesini ve şartları oluştuysa silinmesini talep etme hakkına sahipsiniz.</p>
  </div>
));
KvkkContent.displayName = "KvkkContent";

const AgreementContent = memo(() => (
  <div className="space-y-4 text-sm text-slate-600 dark:text-zinc-300 leading-relaxed max-w-none">
    <h3 className="text-base font-bold text-slate-800 dark:text-white text-center mb-2 font-semibold">MESAFELİ SATIŞ SÖZLEŞMESİ</h3>
    <div>
      <h4 className="font-bold mb-1">MADDE 1 - TARAFLAR</h4>
      <p>İşbu sözleşme, bir tarafta web sitesi üzerinden otobüs bileti satın alan &quot;Alıcı&quot; ile diğer tarafta biletleme ve aracılık hizmetini sunan TransitIQ Ulaşım Teknolojileri A.Ş. (&quot;Satıcı&quot;) arasında elektronik ortamda onaylandığı tarih itibarıyla akdedilmiştir. Alıcı, sisteme girmiş olduğu iletişim ve fatura bilgilerinin doğruluğunu beyan ve taahhüt eder.</p>
    </div>
    <div>
      <h4 className="font-bold mb-1">MADDE 2 - KONU</h4>
      <p>İşbu Sözleşme&apos;nin konusu, Alıcı&apos;nın Satıcı&apos;ya ait web sitesinden elektronik ortamda siparişini verdiği biletin satışı ve teslimi ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri uyarınca tarafların karşılıklı hak ve yükümlülüklerinin belirlenmesidir.</p>
    </div>
    <div>
      <h4 className="font-bold mb-1">MADDE 3 - SÖZLEŞME KONUSU BİLET BİLGİLERİ</h4>
      <p>Sözleşme konusu hizmet, Alıcı tarafından seçilen kalkış ve varış noktaları arasında, belirtilen tarih ve saatte yapılacak olan tarifeli otobüs seferi taşıma biletidir. Alıcı tarafından ödenen toplam bedel, bilet üzerinde ve sipariş özetinde gösterilen tutar olup, bu bedele tüm yasal vergiler ve varsa hizmet komisyonları dahildir.</p>
    </div>
    <div>
      <h4 className="font-bold mb-1">MADDE 4 - GENEL HÜKÜMLER</h4>
      <p>Yolcuların sefer saatinden en az 15 dakika önce ilgili peronda hazır bulunmaları gerekmektedir. Sefer saatinde peronda bulunmayan yolcular adına bilet hakkı yanar. Seyahat esnasında bagaj limitleri standart 30 kilogram olup, aşan kısım için taşıyıcı firmanın ek ücret politikaları geçerli olacaktır. Alıcı, taşıyıcı firmanın iç kurallarına uymakla yükümlüdür.</p>
    </div>
    <div>
      <h4 className="font-bold mb-1">MADDE 5 - CAYMA HAKKI VE İPTAL KOŞULLARI</h4>
      <p>Mesafeli Sözleşmeler Yönetmeliği’nin 15/g maddesi uyarınca, belirli bir tarihte yapılması gereken yolcu taşıma hizmetlerinde tüketicinin cayma hakkı bulunmamaktadır. Sefer saatinden 24 saat öncesine kadar yapılan iptal taleplerinde bilet bedelinin tamamı iade edilir. Sefer saatine 24 saatten az kalan iptal taleplerinde ise iade yapılmaz, bilet açığa alınabilir.</p>
    </div>
  </div>
));
AgreementContent.displayName = "AgreementContent";`;

// Use Regex representation that matches any content between const KvkkContent and displayName = "AgreementContent";
const regex = /const KvkkContent = memo\(\(\) => \([\s\S]*?AgreementContent\.displayName = "AgreementContent";/;

if (regex.test(content)) {
  content = content.replace(regex, kvkkReplacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Legal content replaced successfully!');
} else {
  console.log('Regex did not match content.');
}
