import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Helper to get admin client safely
function getSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        throw new Error('Faltan variables de entorno de Supabase (URL o Key)');
    }

    return createClient(url, key);
}

export async function POST(req: Request) {
    console.log('[DELETE-DRIVER] Inicio de petición');
    try {
        const supabaseAdmin = getSupabaseAdmin();
        const body = await req.json();
        const { conductorId } = body;
        
        console.log('[DELETE-DRIVER] ID Conductor:', conductorId);

        if (!conductorId) {
            return NextResponse.json({ error: 'conductorId requerido' }, { status: 400 });
        }

        // 1. Obtener datos del conductor (necesitamos el correo para borrar de users y auth)
        const { data: conductor, error: fetchError } = await supabaseAdmin
            .from('conductores')
            .select('correo')
            .eq('id', conductorId)
            .maybeSingle();

        if (fetchError) {
            console.error('[DELETE-DRIVER] Error al buscar conductor:', fetchError);
            return NextResponse.json({ error: 'Error al buscar conductor: ' + fetchError.message }, { status: 500 });
        }

        if (!conductor) {
            console.warn('[DELETE-DRIVER] No se encontró el conductor con ID:', conductorId);
            // Si no existe el conductor, quizás ya fue borrado, pero intentamos seguir por si acaso
        } else {
            console.log('[DELETE-DRIVER] Correo del conductor:', conductor.correo);
        }

        // 2. Eliminar de la tabla conductores
        const { error: dbError } = await supabaseAdmin
            .from('conductores')
            .delete()
            .eq('id', conductorId);

        if (dbError) {
            console.error('[DELETE-DRIVER] Error al eliminar de conductores:', dbError);
            return NextResponse.json({ 
                error: 'Error eliminando de tabla conductores: ' + dbError.message,
                code: dbError.code 
            }, { status: 500 });
        }
        console.log('[DELETE-DRIVER] Borrado de conductores OK');

        // 3. Eliminar de la tabla public.users (si existe el correo)
        if (conductor?.correo) {
            const { error: usersError } = await supabaseAdmin
                .from('users')
                .delete()
                .eq('correo', conductor.correo);
            
            if (usersError) {
                console.warn('[DELETE-DRIVER] Error al eliminar de tabla users (no crítico):', usersError.message);
            } else {
                console.log('[DELETE-DRIVER] Borrado de users OK');
            }
        }

        // 4. Eliminar de Supabase Auth
        // Solo intentamos esto si tenemos la SERVICE_ROLE_KEY
        if (process.env.SUPABASE_SERVICE_ROLE_KEY && conductor?.correo) {
            try {
                console.log('[DELETE-DRIVER] Intentando borrar de Auth...');
                const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
                
                if (listError) {
                    console.error('[DELETE-DRIVER] Error al listar usuarios de Auth:', listError.message);
                } else {
                    const found = usersData?.users?.find((u: any) => u.email === conductor.correo);
                    if (found?.id) {
                        const { error: authDelError } = await supabaseAdmin.auth.admin.deleteUser(found.id);
                        if (authDelError) {
                            console.error('[DELETE-DRIVER] Error al borrar de Auth:', authDelError.message);
                        } else {
                            console.log('[DELETE-DRIVER] Borrado de Auth OK');
                        }
                    } else {
                        console.log('[DELETE-DRIVER] Usuario no encontrado en Auth');
                    }
                }
            } catch (authCatchErr: any) {
                console.error('[DELETE-DRIVER] Excepción al manejar Auth:', authCatchErr.message);
            }
        }

        console.log('[DELETE-DRIVER] Proceso completado');
        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('[DELETE-DRIVER] Error fatal:', err);
        return NextResponse.json({ 
            error: err.message || 'Error interno desconocido',
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        }, { status: 500 });
    }
}
