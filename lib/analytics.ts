import { supabase } from './supabase';

export type EventType = 'visita' | 'contacto' | 'formulario';

export const trackEvent = async (nombre: EventType) => {
    try {
        const { error } = await supabase
            .from('eventos')
            .insert([{ nombre }]);
        
        if (error) {
            console.error('Error tracking event:', error.message, error.details || '');
        }
    } catch (err) {
        console.error('Exception tracking event:', err);
    }
};
