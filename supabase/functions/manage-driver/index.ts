import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Use service role key — available as env var inside Edge Functions
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, ...payload } = await req.json()

    // ─── CREAR CONDUCTOR ──────────────────────────────────────────────────
    if (action === 'create') {
      const { nombre, direccion, telefono, correo, contrasena } = payload
      const correoLimpio = correo.trim().toLowerCase()

      // 1. Verificar si ya existe en conductores
      const { data: existing } = await supabaseAdmin
        .from('conductores')
        .select('id')
        .eq('correo', correoLimpio)
        .maybeSingle()

      if (existing) {
        return new Response(
          JSON.stringify({ error: 'Ya existe un conductor registrado con este correo electrónico.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      // 2. Crear usuario en Supabase Auth (con contraseña)
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: correoLimpio,
        password: contrasena,
        email_confirm: true,
        user_metadata: {
          full_name: nombre,
          isConductor: true,
          isAdmin: false
        }
      })

      if (authError && !authError.message.includes('already registered')) {
        console.error('Auth error:', authError.message)
        // No abortamos — continuamos con la DB aunque falle Auth
      }

      // 3. Insertar en conductores
      const { data: conductorData, error: conductorError } = await supabaseAdmin
        .from('conductores')
        .insert([{ nombre: nombre.trim(), direccion: direccion.trim(), telefono: telefono.trim(), correo: correoLimpio, contrasena }])
        .select()
        .single()

      if (conductorError) {
        return new Response(
          JSON.stringify({ error: conductorError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }

      // 4. Insertar en users con isConductor: true
      const { error: usersError } = await supabaseAdmin
        .from('users')
        .insert([{
          nombre: nombre.trim(),
          correo: correoLimpio,
          telefono: telefono.trim(),
          isConductor: true,
          isAdmin: false
        }])

      if (usersError) {
        console.warn('users insert warning (non-blocking):', usersError.message)
      }

      return new Response(
        JSON.stringify({ success: true, driver: conductorData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // ─── EDITAR CONDUCTOR ─────────────────────────────────────────────────
    if (action === 'update') {
      const { conductorId, nombre, direccion, telefono, correo, nuevaContrasena } = payload
      const correoLimpio = correo.trim().toLowerCase()

      // 1. Obtener correo original
      const { data: original } = await supabaseAdmin
        .from('conductores')
        .select('correo')
        .eq('id', conductorId)
        .single()

      const updates: Record<string, string> = {
        nombre: nombre.trim(),
        direccion: direccion.trim(),
        telefono: telefono.trim(),
        correo: correoLimpio,
      }
      if (nuevaContrasena) updates.contrasena = nuevaContrasena

      // 2. Actualizar conductores
      const { error: conductorError } = await supabaseAdmin
        .from('conductores')
        .update(updates)
        .eq('id', conductorId)

      if (conductorError) {
        return new Response(
          JSON.stringify({ error: conductorError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }

      // 3. Actualizar users
      if (original?.correo) {
        await supabaseAdmin
          .from('users')
          .update({ nombre: nombre.trim(), telefono: telefono.trim(), correo: correoLimpio })
          .eq('correo', original.correo)
      }

      // 4. Actualizar contraseña en Auth si se proveyó
      if (nuevaContrasena && original?.correo) {
        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers()
        const authUser = usersData?.users?.find((u: { email?: string }) => u.email === original.correo)
        if (authUser?.id) {
          const authUpdates: Record<string, string> = { password: nuevaContrasena }
          if (correoLimpio !== original.correo) authUpdates.email = correoLimpio
          await supabaseAdmin.auth.admin.updateUserById(authUser.id, authUpdates)
        }
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // ─── ELIMINAR CONDUCTOR ───────────────────────────────────────────────
    if (action === 'delete') {
      const { conductorId } = payload

      // 1. Obtener correo
      const { data: conductor } = await supabaseAdmin
        .from('conductores')
        .select('correo')
        .eq('id', conductorId)
        .single()

      // 2. Eliminar de conductores
      const { error: conductorError } = await supabaseAdmin
        .from('conductores')
        .delete()
        .eq('id', conductorId)

      if (conductorError) {
        return new Response(
          JSON.stringify({ error: conductorError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }

      // 3. Eliminar de users
      if (conductor?.correo) {
        await supabaseAdmin.from('users').delete().eq('correo', conductor.correo)

        // 4. Eliminar de Auth
        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers()
        const authUser = usersData?.users?.find((u: { email?: string }) => u.email === conductor.correo)
        if (authUser?.id) {
          await supabaseAdmin.auth.admin.deleteUser(authUser.id)
        }
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Acción no reconocida' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )

  } catch (error) {
    console.error('manage-driver error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
