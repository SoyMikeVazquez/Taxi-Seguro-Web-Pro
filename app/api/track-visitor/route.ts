import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        // Obtenemos la IP de los headers de la solicitud real
        const forwardedFor = req.headers.get('x-forwarded-for');
        const realIp = req.headers.get('x-real-ip');

        let ip = forwardedFor ? forwardedFor.split(',')[0].trim() : realIp;

        if (!ip) {
            ip = req.headers.get('x-client-ip') || '127.0.0.1'; // fallback en entornos de desarrollo local
        }

        if (ip) {
            // Intentar insertar la IP en la base de datos
            const { error } = await supabase
                .from('unique_visitors')
                .insert([{ ip }]);

            // Ignoramos el error 23505 que significa que la IP ya existe (unique violation)
            if (error && error.code !== '23505') {
                console.error('Error insertando visitante:', error.message, error.details || '');
            }
        }

        return NextResponse.json({ success: true, ip_tracked: true });
    } catch (err) {
        console.error('Excepción al trackear visitante:', err);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
