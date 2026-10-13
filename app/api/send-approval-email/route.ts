import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email, name } = await req.json();

    if (!email || !name) {
      return NextResponse.json({ error: "Email y nombre son requeridos" }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: 'Taxiseguro <onboarding@resend.dev>',
      to: email,
      subject: '¡Bienvenido a Taxiseguro! Tu solicitud ha sido aprobada',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 20px; color: #333; line-height: 1.6;">
          <div style="text-align: center; margin-bottom: 30px;">
             <h1 style="color: #000; margin: 0; font-size: 28px; letter-spacing: -1px;">TAXISEGURO</h1>
             <p style="font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 2px; margin-top: 5px;">Servicios de Transporte Especializado</p>
          </div>
          
          <h2 style="color: #000; font-size: 24px; margin-bottom: 20px;">¡Hola, ${name}!</h2>
          
          <p style="font-size: 16px;">Nos complace informarte que tu solicitud para formar parte del equipo de conductores de <strong>Taxiseguro</strong> ha sido revisada y <strong>aprobada exitosamente</strong>.</p>
          
          <div style="background-color: #f9fafb; padding: 25px; border-radius: 15px; margin: 25px 0; border: 1px solid #f3f4f6;">
            <p style="margin-top: 0; font-weight: bold; color: #111;">¿Qué sigue ahora?</p>
            <ul style="margin-bottom: 0; padding-left: 20px;">
              <li style="margin-bottom: 10px;">Ya puedes iniciar sesión con tu correo electrónico.</li>
              <li style="margin-bottom: 10px;">Podrás visualizar tu pizarra de viajes asignados en tiempo real.</li>
              <li>Podrás gestionar tu disponibilidad y perfil directamente desde el dashboard.</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="https://taxiseguro.com/login" style="background-color: #000; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              IR AL PANEL DE CONDUCTOR
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 40px;">Estamos muy emocionados de tenerte a bordo. Si tienes alguna duda técnica o sobre tus primeros viajes, no dudes en contactar a nuestro equipo de soporte.</p>
          
          <hr style="border: 0; border-top: 1px solid #f0f0f0; margin: 40px 0;">
          
          <p style="text-align: center; font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 1px;">
            Este es un correo automático, por favor no respondas a esta dirección.
          </p>
        </div>
      `,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
