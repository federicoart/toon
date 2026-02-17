# Info point con AI in locale su Raspberry Pi + schermo

Questa guida descrive una soluzione pratica per creare un **info point offline/locale** con AI, pensata per essere eseguita su Raspberry Pi collegato a uno schermo.

## Obiettivo

Realizzare un chiosco informativo che:

- risponda a domande su contenuti locali (FAQ, documenti, procedure, eventi);
- non dipenda dal cloud (o lo faccia solo opzionalmente);
- si avvii automaticamente su Raspberry Pi in modalità kiosk;
- sia facile da aggiornare da remoto.

## Architettura consigliata

1. **UI kiosk** (web app a schermo intero)
2. **API locale** (backend Node/Python)
3. **Motore AI locale**
   - `llama.cpp` o `Ollama` con modello quantizzato piccolo/medio
4. **Knowledge base locale**
   - file Markdown/PDF/JSON convertiti in chunk
   - opzionale: indice vettoriale locale (es. SQLite + embedding)

## Hardware minimo consigliato

- Raspberry Pi 5 (8 GB RAM consigliati)
- microSD A2 (o SSD USB 3.0 preferibile)
- dissipazione attiva
- schermo HDMI
- alimentatore ufficiale

> Nota: su Raspberry Pi 4 il sistema può funzionare, ma con modelli più piccoli e latenze maggiori.

## Stack software suggerito

- **OS**: Raspberry Pi OS Lite o Desktop
- **Runtime**: Node.js 20+
- **UI**: web app (es. React/Vite) in Chromium kiosk
- **Backend**: Express/Fastify
- **LLM locale**: Ollama (se disponibile su arm64) o llama.cpp
- **Service manager**: systemd

## Flusso operativo

1. L'utente tocca un pulsante o scrive una domanda.
2. Il backend applica regole (lingua, moderazione base, limiti token).
3. Viene interrogato il modello locale con prompt di sistema dedicato all'info point.
4. (Opzionale) recupero contesto da knowledge base locale (RAG).
5. La risposta viene mostrata in UI con timeout e fallback.

## Prompt di base consigliato

```text
Sei l'assistente dell'info point. Rispondi in modo chiaro, breve e concreto.
Se l'informazione non è nei dati locali, dichiaralo esplicitamente e proponi un contatto umano.
Non inventare dettagli.
```

## Modalità kiosk (avvio automatico)

- Avvio automatico del sistema
- Login automatico utente kiosk
- Lancio Chromium full-screen su URL locale (es. `http://localhost:4173`)
- Disabilitare gesture/shortcut non desiderate

## Affidabilità in produzione

- watchdog di processo (`systemd Restart=always`)
- log rotanti
- healthcheck endpoint (`/health`)
- pulsante UI “Ricomincia sessione”
- reset automatico dopo inattività

## Sicurezza minima

- rete locale isolata (VLAN guest o subnet dedicata)
- nessuna shell accessibile dall'utente kiosk
- backend in ascolto solo su localhost (se possibile)
- aggiornamenti OS schedulati

## Piano di implementazione a step

### Fase 1 — MVP locale

- interfaccia touch con 3–5 FAQ principali
- modello piccolo locale
- risposta testuale senza voce

### Fase 2 — Contenuti dinamici

- ingestion documenti (Markdown/PDF)
- ricerca semantica locale
- dashboard amministratore semplice

### Fase 3 — Hardening

- auto-recovery completa
- telemetria minima locale
- backup e script di provisioning

## Metriche utili da monitorare

- tempo medio risposta (p50/p95)
- tasso domande senza risposta
- riavvii giornalieri
- consumo RAM/temperatura CPU

## Checklist rapida pre-deploy

- [ ] Boot automatico kiosk verificato
- [ ] Rete isolata e firewall base
- [ ] Prompt e policy lingua validati
- [ ] Test da cold boot completato
- [ ] Procedura aggiornamento documentata

---

Se vuoi, nel prossimo step posso preparare anche:

- struttura cartelle del progetto (frontend/backend/knowledge-base),
- file `systemd` pronti,
- script deploy per Raspberry Pi,
- configurazione iniziale di un modello locale ottimizzato.
