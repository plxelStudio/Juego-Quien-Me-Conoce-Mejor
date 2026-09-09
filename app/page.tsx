'use client';

import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import confetti from 'canvas-confetti';

let socket: Socket;

interface Jugador {
  id: string;
  nombre: string;
  puntos: number;
}

interface PreguntaCustom {
  titulo: string;
  opciones: string[];
  correcta: number;
}

export default function Home() {
  const [nombre, setNombre] = useState('');
  const [codigoSala, setCodigoSala] = useState('');
  const [modo, setModo] = useState<'menu' | 'unirse' | 'crear' | 'lobby' | 'crear_preguntas' | 'juego' | 'podio'>('menu');
  
  const [codigoActual, setCodigoActual] = useState('');
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [esCreador, setEsCreador] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiado, setCopiado] = useState(false);

  // Datos del Juego y Temporizador
  const [tiempo, setTiempo] = useState(15);
  const [numPregunta, setNumPregunta] = useState(1);
  const [preguntaActualData, setPreguntaActualData] = useState<{ titulo: string; opciones: string[] } | null>(null);
  const [opcionElegida, setOpcionElegida] = useState<number | null>(null);
  const [respuestaEnviada, setRespuestaEnviada] = useState(false);
  const [correctaRevelada, setCorrectaRevelada] = useState<number | null>(null);

  // Formulario de preguntas del Creador
  const [preguntasCustom, setPreguntasCustom] = useState<PreguntaCustom[]>([
    { titulo: '', opciones: ['', '', '', ''], correcta: 0 }
  ]);

  // Reproductor de efectos de sonido
  const reproducirSonido = (tipo: 'correcto' | 'incorrecto' | 'tick' | 'victoria') => {
    try {
      const sonidos = {
        correcto: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
        incorrecto: 'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3',
        tick: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
        victoria: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'
      };
      const audio = new Audio(sonidos[tipo]);
      audio.volume = 0.4;
      audio.play().catch(() => {});
    } catch (e) {
      // Ignorar restricciones de autoplay si ocurren
    }
  };

  const lanzarConfeti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  useEffect(() => {
    socket = io();

    socket.on('sala_creada', ({ codigo, jugadores }: { codigo: string; jugadores: Jugador[] }) => {
      setCodigoActual(codigo);
      setJugadores(jugadores);
      setEsCreador(true);
      setModo('lobby');
      setErrorMsg('');
    });

    socket.on('union_exitosa', ({ codigo, jugadores }: { codigo: string; jugadores: Jugador[] }) => {
      setCodigoActual(codigo);
      setJugadores(jugadores);
      setEsCreador(false);
      setModo('lobby');
      setErrorMsg('');
    });

    socket.on('actualizar_jugadores', (nuevosJugadores: Jugador[]) => {
      setJugadores(nuevosJugadores);
    });

    socket.on('juego_iniciado', ({ numeroPregunta, preguntaInicial }) => {
      setNumPregunta(numeroPregunta);
      setPreguntaActualData(preguntaInicial);
      setOpcionElegida(null);
      setRespuestaEnviada(false);
      setCorrectaRevelada(null);
      setTiempo(15);
      setModo('juego');
    });

    socket.on('tick_tiempo', ({ tiempo }: { tiempo: number }) => {
      setTiempo(tiempo);
      if (tiempo <= 3 && tiempo > 0) {
        reproducirSonido('tick');
      }
    });

    socket.on('tiempo_agotado', ({ jugadores, correctaIdx }) => {
      setJugadores(jugadores);
      setCorrectaRevelada(correctaIdx);
      setRespuestaEnviada(true);
    });

    socket.on('respuesta_registrada', ({ esCorrecta }) => {
      setRespuestaEnviada(true);
      if (esCorrecta) {
        reproducirSonido('correcto');
      } else {
        reproducirSonido('incorrecto');
      }
    });

    socket.on('actualizar_puntuaciones', ({ jugadores, correctaIdx }) => {
      setJugadores(jugadores);
      setCorrectaRevelada(correctaIdx);
    });

    socket.on('nueva_pregunta', ({ numeroPregunta, pregunta }) => {
      setNumPregunta(numeroPregunta);
      setPreguntaActualData(pregunta);
      setOpcionElegida(null);
      setRespuestaEnviada(false);
      setCorrectaRevelada(null);
      setTiempo(15);
    });

    socket.on('juego_finalizado', ({ jugadores }) => {
      setJugadores(jugadores);
      setModo('podio');
      reproducirSonido('victoria');
      lanzarConfeti();
    });

    socket.on('error_sala', (msg: string) => {
      setErrorMsg(msg);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleCrearSala = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    socket.emit('crear_sala', { nombre });
  };

  const handleUnirseSala = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !codigoSala.trim()) return;
    socket.emit('unirse_sala', { nombre, codigo: codigoSala });
  };

  const copiarCodigo = () => {
    navigator.clipboard.writeText(codigoActual);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const agregarPreguntaForm = () => {
    if (preguntasCustom.length >= 5) return;
    setPreguntasCustom([...preguntasCustom, { titulo: '', opciones: ['', '', '', ''], correcta: 0 }]);
  };

  const handlePreguntaChange = (index: number, val: string) => {
    const copia = [...preguntasCustom];
    copia[index].titulo = val;
    setPreguntasCustom(copia);
  };

  const handleOpcionChange = (pIndex: number, oIndex: number, val: string) => {
    const copia = [...preguntasCustom];
    copia[pIndex].opciones[oIndex] = val;
    setPreguntasCustom(copia);
  };

  const handleCorrectaChange = (pIndex: number, oIndex: number) => {
    const copia = [...preguntasCustom];
    copia[pIndex].correcta = oIndex;
    setPreguntasCustom(copia);
  };

  const enviarPreguntasYEmpezar = () => {
    for (const p of preguntasCustom) {
      if (!p.titulo.trim() || p.opciones.some(o => !o.trim())) {
        setErrorMsg('Por favor completa todas las preguntas y sus 4 opciones.');
        return;
      }
    }
    setErrorMsg('');
    socket.emit('iniciar_juego_con_preguntas', { codigo: codigoActual, preguntas: preguntasCustom });
  };

  const seleccionarOpcion = (index: number) => {
    if (respuestaEnviada) return;
    setOpcionElegida(index);
    socket.emit('responder_pregunta', { codigo: codigoActual, opcionSeleccionada: index });
  };

  const pasarSiguiente = () => {
    socket.emit('siguiente_pregunta', { codigo: codigoActual });
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
      <div className="text-center mb-6">
        <h1 className="text-4xl md:text-6xl font-black text-indigo-500 mb-2 tracking-wide drop-shadow-md">
          ¿Quién me conoce más?
        </h1>
      </div>

      <div className="bg-slate-800 border border-slate-700 p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-lg">
        
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-300 text-xs rounded-xl text-center">
            {errorMsg}
          </div>
        )}

        {/* Menu Principal */}
        {modo === 'menu' && (
          <div className="flex flex-col gap-4">
            <button
              onClick={() => { setErrorMsg(''); setModo('crear'); }}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-indigo-600/30"
            >
              Crear nueva sala
            </button>
            <button
              onClick={() => { setErrorMsg(''); setModo('unirse'); }}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3.5 rounded-xl transition"
            >
              Unirme con código
            </button>
          </div>
        )}

        {/* Crear Sala */}
        {modo === 'crear' && (
          <form className="flex flex-col gap-4" onSubmit={handleCrearSala}>
            <h2 className="text-xl font-bold text-center text-indigo-400 mb-2">Crear Sala</h2>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Tu Nombre</label>
              <input
                type="text"
                placeholder="Ej: Nacho"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-indigo-600/30"
            >
              Generar Sala
            </button>
          </form>
        )}

        {/* Unirse a Sala */}
        {modo === 'unirse' && (
          <form className="flex flex-col gap-4" onSubmit={handleUnirseSala}>
            <h2 className="text-xl font-bold text-center text-indigo-400 mb-2">Unirse a una Sala</h2>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Tu Nombre</label>
              <input
                type="text"
                placeholder="Ej: Carlos"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Código de la Sala</label>
              <input
                type="text"
                placeholder="Ej: A1B2"
                maxLength={4}
                value={codigoSala}
                onChange={(e) => setCodigoSala(e.target.value.toUpperCase())}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono uppercase tracking-widest text-center text-lg focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-indigo-600/30"
            >
              Entrar a la Sala
            </button>
          </form>
        )}

        {/* LOBBY */}
        {modo === 'lobby' && (
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="text-xs font-semibold uppercase text-slate-400">Código de la Sala</span>
            <button 
              onClick={copiarCodigo}
              className="bg-slate-900 px-6 py-3 rounded-2xl border border-indigo-500/40 text-indigo-400 text-3xl font-mono font-black tracking-widest hover:border-indigo-400 transition cursor-pointer"
            >
              {codigoActual}
              <span className="block text-[10px] text-slate-500 font-sans mt-1">
                {copiado ? '¡Copiado!' : 'Haz clic para copiar'}
              </span>
            </button>

            <div className="w-full mt-2">
              <h3 className="text-sm font-semibold text-slate-400 mb-3 text-left">
                Jugadores conectados ({jugadores.length}):
              </h3>
              <ul className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                {jugadores.map((j) => (
                  <li key={j.id} className="bg-slate-900/60 border border-slate-700/50 px-4 py-2.5 rounded-xl flex items-center justify-between">
                    <span className="font-medium text-slate-200">{j.nombre}</span>
                    <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-full font-mono">
                      {j.id === socket.id ? 'Vos' : 'Conectado'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {esCreador ? (
              <button
                onClick={() => setModo('crear_preguntas')}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl transition mt-4 shadow-lg shadow-emerald-600/30"
              >
                Cargar Preguntas 📝
              </button>
            ) : (
              <p className="text-xs text-slate-400 mt-4 animate-pulse">
                Esperando que el creador cargue las preguntas...
              </p>
            )}
          </div>
        )}

        {/* CREAR PREGUNTAS */}
        {modo === 'crear_preguntas' && (
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-bold text-center text-indigo-400">Armá tus Preguntas</h2>
            
            <div className="max-h-96 overflow-y-auto flex flex-col gap-6 pr-1">
              {preguntasCustom.map((p, pIdx) => (
                <div key={pIdx} className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 flex flex-col gap-3">
                  <span className="text-xs font-bold text-indigo-400 uppercase">Pregunta #{pIdx + 1}</span>
                  <input
                    type="text"
                    placeholder="Ej: ¿Cuál es mi comida favorita?"
                    value={p.titulo}
                    onChange={(e) => handlePreguntaChange(pIdx, e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />

                  <span className="text-[11px] text-slate-400 font-semibold uppercase">Opciones (marca la correcta):</span>
                  <div className="grid grid-cols-1 gap-2">
                    {p.opciones.map((op, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correcta-${pIdx}`}
                          checked={p.correcta === oIdx}
                          onChange={() => handleCorrectaChange(pIdx, oIdx)}
                          className="accent-emerald-500 w-4 h-4 cursor-pointer"
                        />
                        <input
                          type="text"
                          placeholder={`Opción ${oIdx + 1}`}
                          value={op}
                          onChange={(e) => handleOpcionChange(pIdx, oIdx, e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {preguntasCustom.length < 5 && (
              <button
                onClick={agregarPreguntaForm}
                className="w-full bg-slate-700 hover:bg-slate-600 text-xs font-bold py-2 rounded-lg text-slate-300 transition"
              >
                + Agregar otra pregunta
              </button>
            )}

            <button
              onClick={enviarPreguntasYEmpezar}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-emerald-600/30 mt-2"
            >
              ¡Iniciar Partida Ahora! 🚀
            </button>
          </div>
        )}

        {/* PANTALLA DE JUEGO */}
        {modo === 'juego' && preguntaActualData && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Pregunta #{numPregunta}</span>
              <div className={`text-sm font-mono font-bold px-3 py-1 rounded-full border ${
                tiempo <= 5 
                  ? 'bg-red-500/20 border-red-500 text-red-400 animate-bounce' 
                  : 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
              }`}>
                ⏱️ {tiempo}s
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-2xl font-bold text-white">{preguntaActualData.titulo}</h2>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {preguntaActualData.opciones.map((opcion, idx) => {
                let btnStyle = "bg-slate-900/80 hover:bg-indigo-600 border-slate-700 hover:border-indigo-500 text-white";

                if (opcionElegida === idx) {
                  btnStyle = "bg-indigo-600 border-indigo-400 text-white font-bold";
                }

                if (correctaRevelada !== null) {
                  if (idx === correctaRevelada) {
                    btnStyle = "bg-emerald-600 border-emerald-400 text-white font-bold";
                  } else if (opcionElegida === idx) {
                    btnStyle = "bg-red-600 border-red-400 text-white";
                  } else {
                    btnStyle = "bg-slate-900/40 border-slate-800 text-slate-500 opacity-50";
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={respuestaEnviada}
                    onClick={() => seleccionarOpcion(idx)}
                    className={`w-full border p-4 rounded-xl text-left text-sm transition duration-200 ${btnStyle} ${
                      respuestaEnviada ? 'cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    <span className="font-bold mr-2">{String.fromCharCode(65 + idx)}.</span>
                    {opcion}
                  </button>
                );
              })}
            </div>

            {correctaRevelada !== null && (
              <div className="mt-4 border-t border-slate-700 pt-4">
                <h3 className="text-xs font-bold uppercase text-slate-400 mb-2">Tabla de Posiciones:</h3>
                <div className="flex flex-col gap-1 max-h-28 overflow-y-auto mb-4">
                  {jugadores.map((j) => (
                    <div key={j.id} className="flex justify-between items-center text-xs bg-slate-900/50 px-3 py-1.5 rounded-lg">
                      <span className="text-slate-200">{j.nombre}</span>
                      <span className="font-mono font-bold text-emerald-400">{j.puntos} pts</span>
                    </div>
                  ))}
                </div>

                {esCreador && (
                  <button
                    onClick={pasarSiguiente}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition shadow-lg"
                  >
                    Siguiente Pregunta ➡️
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* PODIO FINAL */}
        {modo === 'podio' && (
          <div className="flex flex-col items-center gap-6 text-center">
            <h2 className="text-3xl font-black text-amber-400 animate-pulse">🏆 ¡Juego Finalizado! 🏆</h2>
            
            <div className="w-full flex flex-col gap-2">
              {[...jugadores].sort((a, b) => b.puntos - a.puntos).map((j, idx) => (
                <div 
                  key={j.id} 
                  className={`flex justify-between items-center p-4 rounded-xl border ${
                    idx === 0 
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-200 font-bold text-lg' 
                      : 'bg-slate-900/60 border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm">#{idx + 1}</span>
                    <span>{j.nombre}</span>
                  </div>
                  <span className="font-mono font-bold">{j.puntos} pts</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => window.location.reload()}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition mt-2 shadow-lg"
            >
              Volver al Menú Principal
            </button>
          </div>
        )}

      </div>
    </main>
  );
}