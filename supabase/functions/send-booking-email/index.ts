import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "npm:resend"

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

serve(async (req) => {
  try {
    const payload = await req.json()
    console.log("Notificación recibida:", payload)

    const record = payload.record // Los datos de la nueva cotización
    
    // Lista de correos
    const recipients = [
      record.email, 
      "vidalcavazos@gmail.com", 
      "jesus@taxiseguro.com"
    ]

    const { data, error } = await resend.emails.send({
      from: 'Taxiseguro <admin@taxiseguro.com>',
      to: recipients,
      subject: `Nueva Reservación Confirmada - ${record.booker_name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
            <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-top: 20px;">
                <tr>
                    <td align="center" style="background-color: #000000; padding: 40px 0;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 2px;">TAXISEGURO</h1>
                        <p style="color: #999; margin: 5px 0 0 0; font-size: 10px;">TRANSPORTE EJECUTIVO PREMIUM</p>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 40px 30px;">
                        <h2 style="color: #111; border-bottom: 2px solid #eee; padding-bottom: 10px;">Detalles del Servicio</h2>
                        <table width="100%" cellpadding="10" style="background-color: #f9f9f9; border-radius: 8px; margin-bottom: 20px;">
                            <tr><td><strong>Vehículo:</strong></td><td>${record.vehicle_model}</td></tr>
                            <tr><td><strong>Fecha/Hora:</strong></td><td>${new Date(record.schedule).toLocaleString('es-MX')}</td></tr>
                            <tr><td><strong>Recogida:</strong></td><td>${record.pickup_address}</td></tr>
                            <tr><td><strong>Destino:</strong></td><td>${record.dropoff_address}</td></tr>
                            <tr><td><strong>Distancia:</strong></td><td>${record.distance_km || 'N/A'} km</td></tr>
                        </table>

                        <h3 style="color: #111;">Pasajeros y Equipaje</h3>
                        <p style="font-size: 14px;"><strong>Adultos:</strong> ${record.adults} | <strong>Niños:</strong> ${record.kids}</p>
                        <p style="font-size: 14px;"><strong>Maletas:</strong> 10kg (${record.luggage_10kg}) | 25kg (${record.luggage_25kg}) | Carry-on (${record.carry_on})</p>
                        <p style="font-size: 14px;"><strong>Bilingüe:</strong> ${record.bilingual === 'yes' ? 'Sí' : 'No'}</p>

                        <h3 style="color: #111;">Contacto</h3>
                        <p style="font-size: 14px;"><strong>Reserva:</strong> ${record.booker_name} (${record.booker_phone})</p>
                        <p style="font-size: 14px;"><strong>Pasajero:</strong> ${record.passenger_phone}</p>
                        <p style="font-size: 14px;"><strong>Email:</strong> ${record.email}</p>

                        <div style="background-color: #000; color: #fff; padding: 20px; border-radius: 8px; margin-top: 20px; text-align: center;">
                            <p style="margin: 0; font-size: 12px; opacity: 0.7;">Tarifa Estimada</p>
                            <h2 style="margin: 5px 0 0 0;">$${record.zone_rate} MXN</h2>
                        </div>

                        ${record.extra_specs ? `
                        <div style="margin-top: 25px; padding: 15px; border-left: 4px solid #000; background-color: #f0f0f0; font-style: italic;">
                            "${record.extra_specs}"
                        </div>` : ''}
                    </td>
                </tr>
                <tr>
                    <td style="background-color: #f8f8f8; padding: 20px; text-align: center; color: #999; font-size: 11px;">
                        © 2026 Taxiseguro. Notificación automática de sistema.
                    </td>
                </tr>
            </table>
        </body>
        </html>
      `,
    })

    if (error) throw error

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })
  } catch (error) {
    console.error("Error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    })
  }
})
