'use server';

import { resend } from '@/lib/resend';

export async function sendEmailAction(to: string | string[], subject: string, html: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Taxiseguro <admin@taxiseguro.com>',
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Error enviando email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Excepción enviando email:', error);
    return { success: false, error };
  }
}
