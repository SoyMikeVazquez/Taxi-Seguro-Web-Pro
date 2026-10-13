import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
    console.log('--- Create Driver Request Started ---');
    try {
        const body = await req.json();
        const { nombre, direccion, telefono, correo, contrasena } = body;
        
        console.log('Creating driver for:', correo);

        // 1. Check if driver already exists in 'conductores'
        const { data: existingConductor } = await supabaseAdmin
            .from('conductores')
            .select('id')
            .eq('correo', correo)
            .maybeSingle();

        if (existingConductor) {
            console.log('Driver already exists in conductores table');
            return NextResponse.json({ error: 'Ya existe un conductor registrado con este correo electrónico.' }, { status: 400 });
        }

        // 2. Auth user creation (Only if service role is present)
        const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
        let authUserId = null;

        if (hasServiceRole) {
            console.log('Attempting to create Auth user...');
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email: correo,
                password: contrasena,
                email_confirm: true,
                user_metadata: {
                    full_name: nombre,
                    isConductor: true,
                    isAdmin: false
                }
            });
            
            if (authError) {
                console.error('Auth creation error (non-blocking):', authError.message);
                if (authError.message.includes('already registered')) {
                    console.log('Auth user already exists, continuing...');
                }
            } else {
                authUserId = authData.user?.id;
                console.log('Auth user created successfully:', authUserId);
            }
        } else {
            console.warn('SUPABASE_SERVICE_ROLE_KEY not found. Skipping Auth user creation.');
        }

        // 3. Insert into 'conductores'
        console.log('Inserting into conductores table...');
        const { error: conductorError, data: conductorData } = await supabaseAdmin
            .from('conductores')
            .insert([{
                nombre,
                direccion,
                telefono,
                correo,
                contrasena
            }])
            .select();

        if (conductorError) {
            console.error('Database error (conductores):', conductorError);
            throw new Error(conductorError.message);
        }

        // 4. Upsert into 'users'
        console.log('Upserting into users table...');
        const { error: usersError } = await supabaseAdmin
            .from('users')
            .upsert({ 
                nombre, 
                correo,
                telefono, 
                isConductor: true, 
                isAdmin: false 
            }, { onConflict: 'correo' });

        if (usersError) {
            console.error('Database error (users):', usersError.message);
        }

        console.log('--- Create Driver Request Completed Successfully ---');
        return NextResponse.json({ success: true, driver: conductorData?.[0] });

    } catch (err: any) {
        console.error('--- Create Driver Request Failed ---');
        console.error('Error details:', err);
        return NextResponse.json({ 
            error: err.message || 'Error interno al registrar el conductor' 
        }, { status: 500 });
    }
}
