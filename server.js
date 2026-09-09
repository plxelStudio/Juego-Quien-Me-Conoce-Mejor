const { createServer } = require('http');
const parse = require('url').parse;
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const salas = {};

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server);

  // Función para manejar el temporizador
  const iniciarTimerPregunta = (codigo) => {
    const sala = salas[codigo];
    if (!sala) return;

    if (sala.timerInterval) clearInterval(sala.timerInterval);

    sala.tiempoRestante = 15; // 15 segundos por pregunta

    sala.timerInterval = setInterval(() => {
      sala.tiempoRestante -= 1;
      
      io.to(codigo).emit('tick_tiempo', { tiempo: sala.tiempoRestante });

      if (sala.tiempoRestante <= 0) {
        clearInterval(sala.timerInterval);
        const pregunta = sala.preguntas[sala.preguntaActual];
        io.to(codigo).emit('tiempo_agotado', {
          jugadores: sala.jugadores,
          correctaIdx: pregunta.correcta
        });
      }
    }, 1000);
  };

  io.on('connection', (socket) => {
    // Crear sala
    socket.on('crear_sala', ({ nombre }) => {
      const codigo = Math.random().toString(36).substring(2, 6).toUpperCase();
      salas[codigo] = {
        creadorId: socket.id,
        jugadores: [{ id: socket.id, nombre, puntos: 0 }],
        preguntas: [],
        preguntaActual: 0,
        respuestasRonda: {},
        tiempoRestante: 15,
        timerInterval: null,
        estado: 'lobby'
      };
      
      socket.join(codigo);
      socket.emit('sala_creada', { codigo, jugadores: salas[codigo].jugadores });
    });

    // Unirse a sala
    socket.on('unirse_sala', ({ nombre, codigo }) => {
      const codigoUpper = codigo.toUpperCase();
      const sala = salas[codigoUpper];

      if (!sala) {
        socket.emit('error_sala', 'La sala no existe.');
        return;
      }

      const nuevoJugador = { id: socket.id, nombre, puntos: 0 };
      sala.jugadores.push(nuevoJugador);
      socket.join(codigoUpper);

      socket.emit('union_exitosa', { codigo: codigoUpper, jugadores: sala.jugadores });
      io.to(codigoUpper).emit('actualizar_jugadores', sala.jugadores);
    });

    // Iniciar juego con preguntas
    socket.on('iniciar_juego_con_preguntas', ({ codigo, preguntas }) => {
      const sala = salas[codigo];
      if (sala && socket.id === sala.creadorId) {
        sala.preguntas = preguntas;
        sala.preguntaActual = 0;
        sala.respuestasRonda = {};
        sala.estado = 'jugando';

        io.to(codigo).emit('juego_iniciado', {
          totalPreguntas: preguntas.length,
          numeroPregunta: 1,
          preguntaInicial: {
            titulo: preguntas[0].titulo,
            opciones: preguntas[0].opciones
          }
        });

        iniciarTimerPregunta(codigo);
      }
    });

    // Enviar respuesta
    socket.on('responder_pregunta', ({ codigo, opcionSeleccionada }) => {
      const sala = salas[codigo];
      if (!sala || sala.estado !== 'jugando') return;

      sala.respuestasRonda[socket.id] = opcionSeleccionada;

      const pregunta = sala.preguntas[sala.preguntaActual];
      const esCorrecta = opcionSeleccionada === pregunta.correcta;

      if (esCorrecta) {
        const jugador = sala.jugadores.find(j => j.id === socket.id);
        if (jugador) jugador.puntos += 100;
      }

      socket.emit('respuesta_registrada', { esCorrecta, correctaIdx: pregunta.correcta });

      // Si todos respondieron antes de que expire el tiempo
      const totalRespuestas = Object.keys(sala.respuestasRonda).length;
      if (totalRespuestas === sala.jugadores.length) {
        if (sala.timerInterval) clearInterval(sala.timerInterval);
        io.to(codigo).emit('actualizar_puntuaciones', {
          jugadores: sala.jugadores,
          correctaIdx: pregunta.correcta
        });
      }
    });

    // Pasar a la siguiente pregunta
    socket.on('siguiente_pregunta', ({ codigo }) => {
      const sala = salas[codigo];
      if (!sala || socket.id !== sala.creadorId) return;

      if (sala.timerInterval) clearInterval(sala.timerInterval);

      sala.preguntaActual += 1;
      sala.respuestasRonda = {};

      if (sala.preguntaActual < sala.preguntas.length) {
        const sigPregunta = sala.preguntas[sala.preguntaActual];
        io.to(codigo).emit('nueva_pregunta', {
          numeroPregunta: sala.preguntaActual + 1,
          pregunta: {
            titulo: sigPregunta.titulo,
            opciones: sigPregunta.opciones
          }
        });

        iniciarTimerPregunta(codigo);
      } else {
        sala.estado = 'finalizado';
        io.to(codigo).emit('juego_finalizado', { jugadores: sala.jugadores });
      }
    });

    // Desconexión
    socket.on('disconnect', () => {
      for (const codigo in salas) {
        const sala = salas[codigo];
        const index = sala.jugadores.findIndex((j) => j.id === socket.id);
        if (index !== -1) {
          sala.jugadores.splice(index, 1);
          if (sala.jugadores.length === 0) {
            if (sala.timerInterval) clearInterval(sala.timerInterval);
            delete salas[codigo];
          } else {
            io.to(codigo).emit('actualizar_jugadores', sala.jugadores);
          }
        }
      }
    });
  });

  server.listen(3001, () => {
    console.log('> Servidor listo y corriendo en http://localhost:3001');
  });
});