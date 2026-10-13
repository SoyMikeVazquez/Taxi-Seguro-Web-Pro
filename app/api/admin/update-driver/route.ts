import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
    try {
        const { conductorId, nombre, direccion, telefono, correo, nuevaContrasena } = await req.json();

        if (!conductorId) {
            return NextResponse.json({ error: 'conductorId requerido' }, { status: 400 });
        }

        // 1. Get current conductor data to find auth user
        const { data: conductor, error: fetchError } = await supabaseAdmin
            .from('conductores')
            .select('correo')
            .eq('id', conductorId)
            .single();

        if (fetchError || !conductor) {
            return NextResponse.json({ error: 'Conductor no encontrado' }, { status: 404 });
        }

        // 2 & 3. Try to update Auth and Sync public.users (Only if service role key is present)
        const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
        
        if (hasServiceRole) {
            const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
            if (!listError && usersData?.users) {
                const authUser = usersData.users.find((u: any) => u.email === conductor.correo);
                if (authUser?.id) {
                    const updates: any = {};
                    if (correo && correo !== conductor.correo) updates.email = correo;
                    if (nuevaContrasena) updates.password = nuevaContrasena;
                    if (nombre) updates.user_metadata = { ...authUser.user_metadata, full_name: nombre };

                    if (Object.keys(updates).length > 0) {
                        await supabaseAdmin.auth.admin.updateUserById(authUser.id, updates);
                    }
                }
            }
        }

        // Always try to update public.users table by email
        const userUpdates: any = {};
        if (correo && correo !== conductor.correo) userUpdates.correo = correo;
        if (nombre) userUpdates.nombre = nombre;
        if (telefono) userUpdates.telefono = telefono;

        if (Object.keys(userUpdates).length > 0) {
            await supabaseAdmin
                .from('users')
                .update(userUpdates)
                .eq('correo', conductor.correo);
        }

        // 4. Update conductores table
        const conductorUpdates: any = {};
        if (nombre) conductorUpdates.nombre = nombre;
        if (direccion !== undefined) conductorUpdates.direccion = direccion;
        if (telefono) conductorUpdates.telefono = telefono;
        if (correo) conductorUpdates.correo = correo;

        const { error: dbError } = await supabaseAdmin
            .from('conductores')
            .update(conductorUpdates)
            .eq('id', conductorId);

        if (dbError) {
            return NextResponse.json({ error: 'Error actualizando conductor: ' + dbError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('Error en update-driver:', err);
        return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 });
    }
}
