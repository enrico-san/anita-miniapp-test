import { writable } from 'svelte/store';

// Funzione che crea il nostro store custom
const createApiStore = () => {
  // Stato iniziale
  const initialState = {
    data: null,
    loading: false,
    error: null
  };

  const { subscribe, update, set } = writable(initialState);

  return {
    subscribe, // Esporiamo subscribe per renderlo reattivo nei componenti
    fetchData: async (messaggi, language = 'it') => {
      // Aggiorniamo lo stato: inizio caricamento
      update(state => ({ ...state, loading: true, error: null }));

      try {
        // Mappiamo i messaggi nel formato che il backend si aspetta
        const messages = messaggi.map(m => ({
          role: m.mittente === "Io" ? "user" : "model",
          content: m.testo
        }));

        // Chiamata al nostro backend FastAPI (/chat)
        const backend = import.meta.env.VITE_BACKEND || 'http://localhost:8000';
        // Convertiamo il codice lingua ('it'|'en') in un nome leggibile per il prompt
        const languageName = language === 'en' ? 'English' : (language === 'it' ? 'Italiano' : language);

        const response = await fetch(`https://unglossed-improvisatorially-paislee.ngrok-free.dev/chat`, {
          credentials: 'include',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages, language: languageName })
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Server error ${response.status}: ${text}`);
        }

        const data = await response.json();
        const rispostaTesto = data.response ?? "Spiacente, errore.";

        // Salviamo la risposta grezza nello store e fermiamo il caricamento
        update(state => ({
          ...state,
          data: rispostaTesto,
          loading: false
        }));

      } catch (err) {
        // Gestione errore
        update(state => ({
          ...state,
          error: err.message,
          loading: false
        }));
        throw err;
      }
    },
    reset: () => set(initialState) // Opzionale: per resettare lo store
  };
};

// Esportiamo l'istanza dello store
export const apiStore = createApiStore();