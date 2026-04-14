import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Row,
  Column,
  Tailwind,
} from '@react-email/components';

interface TicketConfirmationEmailProps {
  logoDataUrl?: string;
  passengerName: string;
  pnrCodes: string[];
  origin: string;
  destination: string;
  originStation: string;
  destinationStation: string;
  departureDate: string;
  departureTime: string;
  arrivalTime: string;
  seatNumbers: number[];
  busInfo: string;
  totalPaid: string;
  ticketCount: number;
  supportEmail: string;
}

export const TicketConfirmationEmail: React.FC<TicketConfirmationEmailProps> = ({
  logoDataUrl,
  passengerName,
  pnrCodes,
  origin,
  destination,
  originStation,
  destinationStation,
  departureDate,
  departureTime,
  arrivalTime,
  seatNumbers,
  busInfo,
  totalPaid,
  ticketCount,
  supportEmail,
}) => {
  const previewText = `Biletiniz hazır! PNR: ${pnrCodes.join(', ')} | ${origin} → ${destination}`;

  return (
    <Html lang="tr">
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-slate-100 font-sans" style={{ margin: 0, padding: 0 }}>
          <Container className="bg-white max-w-[600px] mx-auto my-10 rounded-2xl overflow-hidden shadow-lg">
            {/* Header */}
            <Section
              style={{
                background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4f46e5 100%)',
                padding: '32px 40px',
                textAlign: 'center',
              }}
            >
              {logoDataUrl ? (
                <Img
                  src={logoDataUrl}
                  alt="TransitIQ"
                  height="88"
                  style={{
                    height: '88px',
                    width: 'auto',
                    margin: '0 auto 10px auto',
                    display: 'block',
                  }}
                />
              ) : (
                <Heading
                  className="text-white text-3xl font-bold m-0"
                  style={{ letterSpacing: '-0.5px' }}
                >
                  TransitIQ
                </Heading>
              )}
              <Text
                style={{
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 500,
                  margin: '8px 0 0 0',
                  opacity: 0.9,
                  letterSpacing: '0.3px',
                }}
              >
                Türkiye Genelinde Güvenli ve Konforlu Seyahat
              </Text>
            </Section>

            {/* Success Banner */}
            <Section style={{ padding: '32px 40px 0 40px' }}>
              <Heading className="text-slate-900 text-2xl font-bold m-0 mb-2">
                Biletiniz hazır, {passengerName.split(' ')[0]} 🎉
              </Heading>
              <Text className="text-slate-600 text-base m-0">
                {ticketCount > 1
                  ? `${ticketCount} adet biletiniz başarıyla oluşturuldu.`
                  : 'Biletiniz başarıyla oluşturuldu.'}{' '}
                Ödeme onaylandı.
              </Text>
            </Section>

            {/* Trip Card */}
            <Section style={{ padding: '24px 40px' }}>
              <Section
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '24px',
                  background: '#f8fafc',
                }}
              >
                <Row>
                  <Column>
                    <Text className="text-slate-500 text-xs uppercase tracking-wide m-0 mb-1">
                      Kalkış
                    </Text>
                    <Text className="text-slate-900 text-xl font-bold m-0">{origin}</Text>
                    <Text className="text-slate-500 text-xs m-0 mt-1">{originStation}</Text>
                    <Text className="text-slate-900 text-base font-bold m-0 mt-2">
                      {departureTime}
                    </Text>
                  </Column>
                  <Column align="center" style={{ width: '60px' }}>
                    <Text className="text-indigo-600 text-2xl font-bold m-0">→</Text>
                  </Column>
                  <Column>
                    <Text className="text-slate-500 text-xs uppercase tracking-wide m-0 mb-1">
                      Varış
                    </Text>
                    <Text className="text-slate-900 text-xl font-bold m-0">{destination}</Text>
                    <Text className="text-slate-500 text-xs m-0 mt-1">{destinationStation}</Text>
                    <Text className="text-slate-900 text-base font-bold m-0 mt-2">
                      {arrivalTime}
                    </Text>
                  </Column>
                </Row>

                <Hr style={{ borderColor: '#e2e8f0', margin: '20px 0' }} />

                <Row>
                  <Column>
                    <Text className="text-slate-500 text-xs uppercase tracking-wide m-0 mb-1">
                      Tarih
                    </Text>
                    <Text className="text-slate-900 text-sm font-bold m-0">{departureDate}</Text>
                  </Column>
                  <Column>
                    <Text className="text-slate-500 text-xs uppercase tracking-wide m-0 mb-1">
                      {seatNumbers.length > 1 ? 'Koltuklar' : 'Koltuk'}
                    </Text>
                    <Text className="text-slate-900 text-sm font-bold m-0">
                      {seatNumbers.join(', ')}
                    </Text>
                  </Column>
                  <Column>
                    <Text className="text-slate-500 text-xs uppercase tracking-wide m-0 mb-1">
                      Otobüs
                    </Text>
                    <Text className="text-slate-900 text-sm font-bold m-0">{busInfo}</Text>
                  </Column>
                </Row>
              </Section>
            </Section>

            {/* PNR Codes */}
            <Section style={{ padding: '0 40px 24px 40px' }}>
              <Text className="text-slate-500 text-xs uppercase tracking-wide m-0 mb-2">
                PNR {pnrCodes.length > 1 ? 'Kodları' : 'Kodu'}
              </Text>
              {pnrCodes.map((pnr, i) => (
                <Section
                  key={pnr}
                  style={{
                    background: '#f8fafc',
                    borderLeft: '4px solid #4f46e5',
                    padding: '12px 16px',
                    marginBottom: i < pnrCodes.length - 1 ? '8px' : '0',
                    borderRadius: '6px',
                  }}
                >
                  <Row>
                    <Column>
                      <Text className="text-slate-500 text-xs m-0">
                        {pnrCodes.length > 1 ? `${i + 1}. Yolcu — Koltuk ${seatNumbers[i]}` : `Koltuk ${seatNumbers[i]}`}
                      </Text>
                      <Text
                        className="text-indigo-700 text-base font-bold m-0 mt-1"
                        style={{ fontFamily: 'monospace', letterSpacing: '1px' }}
                      >
                        {pnr}
                      </Text>
                    </Column>
                  </Row>
                </Section>
              ))}
            </Section>

            {/* Total Price */}
            <Section style={{ padding: '0 40px 24px 40px' }}>
              <Section
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                  padding: '20px 24px',
                  borderRadius: '12px',
                }}
              >
                <Row>
                  <Column>
                    <Text className="text-emerald-100 text-xs uppercase tracking-wide m-0">
                      Toplam Ödenen
                    </Text>
                    <Text className="text-white text-2xl font-bold m-0 mt-1">{totalPaid}</Text>
                  </Column>
                  <Column align="right">
                    <Text className="text-emerald-100 text-xs m-0">Ödeme Yöntemi</Text>
                    <Text className="text-white text-sm font-bold m-0 mt-1">iyzico</Text>
                  </Column>
                </Row>
              </Section>
            </Section>

            {/* Reminders */}
            <Section style={{ padding: '0 40px 24px 40px' }}>
              <Heading className="text-slate-900 text-base font-bold m-0 mb-3">
                Yolculuk Öncesi
              </Heading>
              <Text className="text-slate-600 text-sm m-0 mb-2">
                • Sefer saatinden <strong>15 dakika önce</strong> kalkış noktasında hazır bulununuz.
              </Text>
              <Text className="text-slate-600 text-sm m-0 mb-2">
                • Yanınızda <strong>kimlik belgenizi</strong> ve bu biletin çıktısını/QR kodunu bulundurunuz.
              </Text>
              <Text className="text-slate-600 text-sm m-0 mb-2">
                • İptal/değişiklik için sefer saatinden en geç 6 saat önce başvurunuz.
              </Text>
              <Text className="text-slate-600 text-sm m-0">
                • <strong>PDF biletinizi</strong> bu emailin ekinde bulabilirsiniz.
              </Text>
            </Section>

            <Hr style={{ borderColor: '#e2e8f0', margin: '0 40px' }} />

            {/* Footer */}
            <Section style={{ padding: '24px 40px' }}>
              <Text className="text-slate-500 text-xs text-center m-0 mb-2">
                Sorularınız için <a href={`mailto:${supportEmail}`} className="text-indigo-600 underline">{supportEmail}</a>
              </Text>
              <Text className="text-slate-400 text-xs text-center m-0">
                © {new Date().getFullYear()} TransitIQ Ulaşım Teknolojileri A.Ş.
              </Text>
              <Text className="text-slate-400 text-xs text-center m-0 mt-1">
                Bu email size {pnrCodes[0]} numaralı bilet rezervasyonu nedeniyle gönderilmiştir.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default TicketConfirmationEmail;
