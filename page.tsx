'use client';

import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Users, Gamepad2, ArrowRight, Crown, Copy, Check, Zap } from 'lucide-react';

let socket: Socket;

export default function Home() {
  const [nombre, setNombre] = useState('');
  const [codigoSala, setCodigoSala] = useState('');
  const [enSala, setEnSala] = useState(false);
  const [codigoGenerado, setCodigoGenerado] = useState('');
  const [jugadores, setJugadores] = useState<{ id: string; nombre: string }[]>([]);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    socket = io();

    socket.on('sala_creada', ({ codigo, jugadores }) => {
      setCodigoGenerado(codigo);
      setJugadores(jugadores);
      setEnSala(true);
    });

    socket.on('actualizar_jugadores', (listaJugadores) => {
      setJugadores(listaJugadores);
    });

    socket.on('union_exitosa', ({ codigo, jugadores }) => {
      setCodigoGenerado(codigo);
      setJugadores(jugadores);
      setEnSala(true);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const crearSala = () => {
    if (!nombre.trim()) return;
    socket.emit('crear_sala', { nombre });
  };

  const unirseSala = () => {
    if (!nombre.trim() || !codigoSala.trim()) return;
    socket.emit('unirse_sala', { nombre, codigo: codigoSala });
  };

  const copiarCodigo = () => {
    navigator.clipboard.writeText(codigoGenerado);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <main className="min-h-screen relative flex flex-col items-center justify-center p-4 overflow-hidden font-sans select-none">
      {/* 🖼️ FONDO CON IMAGEN GAMING DE ALTA IMPACTO */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 animate-pulse-slow"
        style={{ 
          backgroundImage: `url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop')` 
        }}
      />
      
      {/* Capa de oscurecimiento con gradiente neón */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-purple-950/70 to-slate-950/90 backdrop-blur-[3px]" />

      {/* Luces flotantes reactivas */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/30 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-pink-600/25 rounded-full blur-[120px] pointer-events-none" />

      {/* CONTENEDOR PRINCIPAL */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="w-full max-w-md z-10 relative"
      >
        {/* LOGO / TÍTULO DE IMPACTO */}
        <div className="text-center mb-6">
          <motion.div 
            initial={{ y: -10 }}
            animate={{ y: 0 }}
            transition={{ repeat: Infinity, repeatType: "reverse", duration: 2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/40 text-purple-300 text-xs font-black uppercase tracking-widest shadow-lg shadow-purple-500/20 backdrop-blur-md mb-3"
          >
            <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" /> Trivia Party Edition
          </motion.div>

          <h1 className="text-5xl sm:text-6xl font-black italic tracking-tighter uppercase drop-shadow-[0_10px_20px_rgba(168,85,247,0.5)]">
            <span className="bg-gradient-to-r from-yellow-300 via-pink-500 to-purple-400 bg-clip-text text-transparent block transform -rotate-1">
              ¿Quién Me
            </span>
            <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent block transform rotate-1 text-4xl sm:text-5xl">
              Conoce Mejor?
            </span>
          </h1>
        </div>

        {!enSala ? (
          /* CARD DE ENTRADA ESTILO GAME-LAUNCHER */
          <div className="bg-slate-900/80 backdrop-blur-2xl border-2 border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(168,85,247,0.25)] relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-pink-500/20 rounded-full blur-2xl" />

            <div className="space-y-5 relative z-10">
              <div>
                <label className="text-xs font-black tracking-wider text-purple-300 uppercase ml-1 mb-2 block flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Escribí tu Nickname
                </label>
                <input
                  type="text"
                  placeholder="Ej: El_Pro_99"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-slate-950/90 border-2 border-purple-900/50 focus:border-purple-400 rounded-2xl px-4 py-4 text-white text-lg font-bold placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-purple-500/20 transition-all shadow-inner"
                />
              </div>

              <div className="pt-2 flex flex-col gap-3">
                {/* Botón Principal 3D */}
                <button
                  onClick={crearSala}
                  className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-lg py-4 px-6 rounded-2xl shadow-[0_6px_20px_rgba(219,39,119,0.4)] border-b-4 border-pink-800 active:border-b-0 active:translate-y-1 flex items-center justify-center gap-3 transition-all uppercase tracking-wider group"
                >
                  <Gamepad2 className="w-6 h-6 group-hover:scale-110 transition-transform" /> Crear Nueva Sala
                </button>

                <div className="relative my-3 flex items-center justify-center">
                  <div className="border-t border-slate-700/80 w-full" />
                  <span className="bg-slate-900 px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest absolute border border-slate-700 rounded-full py-0.5">
                    O UNITE A UNA
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="CÓDIGO"
                    value={codigoSala}
                    onChange={(e) => setCodigoSala(e.target.value.toUpperCase())}
                    className="w-1/2 bg-slate-950/90 border-2 border-slate-800 focus:border-cyan-400 rounded-2xl px-3 py-3.5 text-center tracking-widest uppercase font-black text-cyan-400 placeholder-slate-600 focus:outline-none transition-all text-base"
                  />
                  <button
                    onClick={unirseSala}
                    className="w-1/2 bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 hover:border-cyan-400 text-white font-black py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] uppercase tracking-wider text-sm shadow-lg"
                  >
                    Entrar <ArrowRight className="w-4 h-4 text-cyan-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* LOBBY RADICAL EN VIVO */
          <div className="bg-slate-900/85 backdrop-blur-2xl border-2 border-purple-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(168,85,247,0.3)] space-y-6">
            <div className="text-center space-y-2">
              <span className="text-xs font-black text-purple-300 uppercase tracking-widest">Código Privado de Sala</span>
              <div 
                onClick={copiarCodigo}
                className="bg-slate-950/90 border-2 border-dashed border-purple-500/50 hover:border-purple-400 rounded-2xl py-3.5 px-4 flex items-center justify-center gap-3 cursor-pointer transition-all group shadow-inner"
              >
                <span className="text-4xl font-black font-mono tracking-widest text-transparent bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-400 bg-clip-text">
                  {codigoGenerado}
                </span>
                {copiado ? <Check className="w-6 h-6 text-green-400" /> : <Copy className="w-6 h-6 text-slate-500 group-hover:text-purple-300 transition-colors" />}
              </div>
              <p className="text-[11px] font-medium text-slate-400">Tocá para copiar el código y pasárselo a la banda</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-black text-slate-300 uppercase tracking-wider px-1">
                <span className="flex items-center gap-2"><Users className="w-4 h-4 text-pink-400" /> Sala de Espera</span>
                <span className="bg-pink-500/20 border border-pink-500/40 text-pink-300 px-2.5 py-0.5 rounded-full font-black">{jugadores.length} listos</span>
              </div>

              <div className="grid grid-cols-1 gap-2.5 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
                <AnimatePresence>
                  {jugadores.map((j, idx) => (
                    <motion.div
                      key={j.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="bg-slate-950/80 border border-purple-900/40 rounded-2xl p-3.5 flex items-center justify-between shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center font-black text-sm text-white shadow-md">
                          {j.nombre.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-base text-slate-100">{j.nombre}</span>
                      </div>
                      {idx === 0 && (
                        <span className="flex items-center gap-1.5 text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm">
                          <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> CREADOR
                        </span>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            <button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-slate-950 font-black text-lg py-4 px-6 rounded-2xl shadow-[0_6px_20px_rgba(34,197,94,0.35)] border-b-4 border-green-800 active:border-b-0 active:translate-y-1 flex items-center justify-center gap-2 transition-all uppercase tracking-wider">
              ¡Empezar Partida!
            </button>
          </div>
        )}
      </motion.div>
    </main>
  );
}