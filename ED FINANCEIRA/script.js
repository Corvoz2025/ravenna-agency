// ===== GERENCIADOR DE ESTADO DE ÁUDIO =====
const AudioManager = {
  state: {
    isInitialized: false,
    isMuted: false,
    bgMusicReady: false,
    tickSoundReady: false,
    sectionSoundReady: false,
    bgMusicPlaying: false,
  },

  elements: {},

  init(elements) {
    this.elements = elements;
    this.setupAudioElements();
    this.setupStatusIndicator();
    console.log("🎵 AudioManager inicializado");
  },

  setupStatusIndicator() {
    this.statusEl = document.getElementById("audio-status");
    if (this.statusEl) {
      this.updateStatus("Aguardando cookies...", "loading");
    }
  },

  updateStatus(message, type = "loading") {
    if (!this.statusEl) return;

    this.statusEl.textContent = message;
    this.statusEl.className = `audio-status show ${type}`;

    // Auto-hide após 3 segundos
    setTimeout(() => {
      if (this.statusEl) {
        this.statusEl.classList.remove("show");
      }
    }, 3000);
  },

  setupAudioElements() {
    const audioConfigs = [
      {
        element: this.elements.bgMusic,
        name: "bg-music",
        volume: 0.15,
        loop: true,
        stateKey: "bgMusicReady",
      },
      {
        element: this.elements.tickSound,
        name: "tick-sound",
        volume: 0.08,
        loop: false,
        stateKey: "tickSoundReady",
      },
      {
        element: this.elements.sectionSound,
        name: "section-sound",
        volume: 0.05,
        loop: false,
        stateKey: "sectionSoundReady",
      },
    ];

    audioConfigs.forEach((config) => {
      if (config.element) {
        this.setupSingleAudio(config);
      } else {
        console.warn(`⚠️ Elemento ${config.name} não encontrado`);
      }
    });
  },

  setupSingleAudio({ element, name, volume, loop, stateKey }) {
    if (!element) return;

    // Configurações básicas
    element.volume = volume;
    element.loop = loop;
    element.preload = "auto";

    // Event listeners detalhados
    element.addEventListener("loadstart", () => {
      console.log(`🎵 ${name}: Iniciando carregamento`);
      this.updateStatus(`Carregando ${name}...`, "loading");
    });

    element.addEventListener("loadeddata", () => {
      console.log(`📁 ${name}: Dados carregados`);
    });

    element.addEventListener("canplay", () => {
      console.log(`▶️ ${name}: Pode reproduzir`);
      this.state[stateKey] = true;
      this.checkAllAudiosReady();
    });

    element.addEventListener("canplaythrough", () => {
      console.log(`✅ ${name}: Totalmente carregado`);
      this.state[stateKey] = true;
      this.checkAllAudiosReady();
    });

    element.addEventListener("playing", () => {
      console.log(`🎶 ${name}: Reproduzindo`);
      if (name === "bg-music") {
        this.state.bgMusicPlaying = true;
        this.updateStatus("Música tocando", "playing");
      }
    });

    element.addEventListener("pause", () => {
      console.log(`⏸️ ${name}: Pausado`);
      if (name === "bg-music") {
        this.state.bgMusicPlaying = false;
      }
    });

    element.addEventListener("ended", () => {
      console.log(`⏹️ ${name}: Finalizado`);
    });

    element.addEventListener("error", (e) => {
      console.error(`❌ Erro no ${name}:`, e.target.error);
      this.updateStatus(`Erro no ${name}`, "error");
      this.state[stateKey] = false;
    });

    element.addEventListener("stalled", () => {
      console.warn(`⚠️ ${name}: Carregamento travado`);
    });

    element.addEventListener("waiting", () => {
      console.log(`⏳ ${name}: Aguardando dados`);
    });
  },

  checkAllAudiosReady() {
    const allReady =
      this.state.bgMusicReady &&
      this.state.tickSoundReady &&
      this.state.sectionSoundReady;

    if (allReady && !this.state.isInitialized) {
      this.state.isInitialized = true;
      console.log("🎉 Todos os áudios estão prontos!");
      this.updateStatus("Áudios prontos!", "playing");
    }
  },

  async startBackgroundMusic() {
    if (!this.elements.bgMusic || !this.state.bgMusicReady) {
      console.warn("⚠️ Música de fundo não está pronta");
      return false;
    }

    try {
      await this.elements.bgMusic.play();
      console.log("🎵 Música de fundo iniciada");
      return true;
    } catch (error) {
      console.error("❌ Erro ao iniciar música de fundo:", error);
      this.updateStatus("Erro na reprodução", "error");
      return false;
    }
  },

  async playTickSound() {
    if (!this.elements.tickSound || this.state.isMuted) return;

    try {
      this.elements.tickSound.currentTime = 0;
      await this.elements.tickSound.play();
    } catch (error) {
      console.warn("⚠️ Erro no tick sound:", error.message);
    }
  },

  async playSectionSound() {
    if (!this.elements.sectionSound || this.state.isMuted) return;

    try {
      this.elements.sectionSound.currentTime = 0;
      await this.elements.sectionSound.play();
    } catch (error) {
      console.warn("⚠️ Erro no section sound:", error.message);
    }
  },

  toggleMute() {
    this.state.isMuted = !this.state.isMuted;

    // Aplicar mute em todos os áudios
    [
      this.elements.bgMusic,
      this.elements.tickSound,
      this.elements.sectionSound,
    ].forEach((audio) => {
      if (audio) {
        audio.muted = this.state.isMuted;
      }
    });

    // Atualizar botão
    const muteBtn = this.elements.muteBtn;
    if (muteBtn) {
      muteBtn.textContent = this.state.isMuted ? "🔇" : "🔊";
      muteBtn.setAttribute("aria-pressed", this.state.isMuted.toString());
      muteBtn.classList.toggle("muted", this.state.isMuted);
    }

    console.log(`🔊 Áudios ${this.state.isMuted ? "mutados" : "desmutados"}`);
    this.updateStatus(
      this.state.isMuted ? "Áudio mutado" : "Áudio ativo",
      this.state.isMuted ? "error" : "playing"
    );

    return this.state.isMuted;
  },

  stopAll() {
    [
      this.elements.bgMusic,
      this.elements.tickSound,
      this.elements.sectionSound,
    ].forEach((audio) => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });

    this.state.bgMusicPlaying = false;
    console.log("🛑 Todos os áudios parados");
  },

  getDebugInfo() {
    return {
      state: this.state,
      elements: {
        bgMusic: !!this.elements.bgMusic,
        tickSound: !!this.elements.tickSound,
        sectionSound: !!this.elements.sectionSound,
        muteBtn: !!this.elements.muteBtn,
      },
      readyStates: {
        bgMusic: this.elements.bgMusic?.readyState,
        tickSound: this.elements.tickSound?.readyState,
        sectionSound: this.elements.sectionSound?.readyState,
      },
    };
  },
};

function throttle(func, delay) {
  let timeoutId;
  let lastExecTime = 0;
  return function (...args) {
    const currentTime = Date.now();

    if (currentTime - lastExecTime > delay) {
      func.apply(this, args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
}

// ===== INICIALIZAÇÃO PRINCIPAL =====
document.addEventListener("DOMContentLoaded", () => {
  // Estado global da aplicação
  const AppState = {
    timerInterval: null,
    isTimerRunning: false,
    currentSlideIndex: 0,
    totalSlides: 0,
    lastActiveSection: null,
    uiBlurTimer: null,
  };

  // Referências aos elementos DOM
  const elements = {
    bgMusic: document.getElementById("bg-music"),
    tickSound: document.getElementById("tick-sound"),
    sectionSound: document.getElementById("section-sound"),
    timerEl: document.getElementById("timer"),
    sections: document.querySelectorAll("section.section, section.section.alt"),
    btnWrapper: document.querySelector(".btn-download-wrapper"),
    seloUI: document.querySelector(".selo-ravenna"),
    notificationEl: document.getElementById("notificacaoCompra"),
    cookieBanner: document.getElementById("cookie-banner"),
    acceptBtn: document.getElementById("accept-cookies"),
    muteBtn: document.getElementById("mute-btn"),
    footer: document.getElementById("rodape"),
    sliderContainer: document.querySelector("#testimonials-slider .slider"),
    prevBtn: document.querySelector(".prev"),
    nextBtn: document.querySelector(".next"),
    audioStatus: document.getElementById("audio-status"),
  };

  // Verificar se elementos críticos existem
  const criticalElements = ["timerEl", "cookieBanner", "acceptBtn", "muteBtn"];
  const missingElements = criticalElements.filter((key) => !elements[key]);

  if (missingElements.length > 0) {
    console.warn("⚠️ Elementos críticos não encontrados:", missingElements);
  }

  // Inicializar AudioManager
  AudioManager.init(elements);

  // ===== SISTEMA DE COOKIES =====
  function initCookieSystem() {
    if (!elements.acceptBtn || !elements.cookieBanner) return;

    // Garantir que o banner apareça e blur seja aplicado
    document.body.classList.add("blurred");
    elements.cookieBanner.style.display = "block";

    elements.acceptBtn.addEventListener("click", async () => {
      elements.cookieBanner.style.display = "none";
      document.body.classList.remove("blurred");

      console.log("🍪 Cookies aceitos - iniciando sistema de áudio");
      AudioManager.updateStatus("Inicializando áudio...", "loading");

      // Aguardar um pouco para garantir que os áudios estejam prontos
      setTimeout(async () => {
        const success = await AudioManager.startBackgroundMusic();
        if (!success) {
          // Tentar novamente após um delay maior
          setTimeout(() => {
            AudioManager.startBackgroundMusic();
          }, 2000);
        }
      }, 1000);
    });
  }

  // ===== SISTEMA DE ÁUDIO =====
  function initAudioSystem() {
    if (!elements.muteBtn) return;

    elements.muteBtn.addEventListener("click", () => {
      AudioManager.toggleMute();
    });

    console.log("🔊 Sistema de controle de áudio inicializado");
  }

  // ===== SISTEMA DE TIMER =====
  function initTimer() {
    if (!elements.timerEl) return;

    let minutes = 3;
    let seconds = 47;
    AppState.isTimerRunning = true;

    function updateTimer() {
      if (!AppState.isTimerRunning) return;

      // Verificar se chegou ao fim
      if (minutes === 0 && seconds === 0) {
        elements.timerEl.textContent = "00:00";
        AppState.isTimerRunning = false;

        console.log("⏰ Timer finalizado");

        // Parar música de fundo usando AudioManager
        if (elements.bgMusic) {
          elements.bgMusic.pause();
          console.log("🎵 Música de fundo pausada pelo timer");
        }

        // Limpar intervalo
        if (AppState.timerInterval) {
          clearInterval(AppState.timerInterval);
          AppState.timerInterval = null;
        }

        return;
      }

      // Decrementar tempo
      if (seconds === 0) {
        minutes--;
        seconds = 59;
      } else {
        seconds--;
      }

      // Reproduzir som de tick usando AudioManager
      AudioManager.playTickSound();

      // Atualizar display
      const formattedTime = `${String(minutes).padStart(2, "0")}:${String(
        seconds
      ).padStart(2, "0")}`;
      elements.timerEl.textContent = formattedTime;
    }

    // Iniciar timer com setInterval
    console.log("⏰ Timer iniciado: 03:47");
    AppState.timerInterval = setInterval(updateTimer, 1000);
  }

  // ===== SISTEMA DE NOTIFICAÇÕES FOMO =====
  function initFomoNotifications() {
    if (!elements.notificationEl) return;

    const messages = [
      "🔔 João Silva de São Paulo acabou de baixar!",
      "🔔 Maria Oliveira de Belo Horizonte acabou de baixar!",
      "🔔 Pedro Souza de Salvador acabou de baixar!",
      "🔔 Ana Costa de Brasília acabou de baixar!",
      "🔔 Carlos Santos de Fortaleza acabou de baixar!",
      "🔔 Juliana Lima de Recife acabou de baixar!",
      "🔔 Roberto Silva de Curitiba acabou de baixar!",
      "🔔 Fernanda Alves de Porto Alegre acabou de baixar!",
      "🔔 Lucas Pereira de Goiânia acabou de baixar!",
      "🔔 Camila Rodrigues de Manaus acabou de baixar!",
      "🔔 Diego Ferreira de Vitória acabou de baixar!",
      "🔔 Patrícia Santos de Natal acabou de baixar!",
    ];

    // Embaralhar mensagens
    function shuffleArray(array) {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    }

    const shuffledMessages = shuffleArray(messages);
    let messageIndex = 0;

    function showRandomNotification() {
      const message = shuffledMessages[messageIndex];
      elements.notificationEl.textContent = message;
      elements.notificationEl.classList.add("show");

      // Esconder após 3 segundos
      setTimeout(() => {
        elements.notificationEl.classList.remove("show");
      }, 3000);

      // Próxima mensagem
      messageIndex = (messageIndex + 1) % shuffledMessages.length;

      // Reagendar próxima notificação (entre 8-20 segundos)
      const nextDelay = Math.random() * 12000 + 8000;
      setTimeout(showRandomNotification, nextDelay);
    }

    // Primeira notificação após 5 segundos
    setTimeout(showRandomNotification, 5000);
  }

  // ===== CONTROLE DE VISIBILIDADE DO BOTÃO =====
  function initButtonVisibility() {
    if (!elements.btnWrapper || !elements.footer) return;

    function checkFooterVisibility() {
      const footerRect = elements.footer.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const buttonHeight = elements.btnWrapper.offsetHeight;

      if (footerRect.top < windowHeight - buttonHeight) {
        elements.btnWrapper.style.opacity = "0";
        elements.btnWrapper.style.pointerEvents = "none";
      } else {
        elements.btnWrapper.style.opacity = "1";
        elements.btnWrapper.style.pointerEvents = "auto";
      }
    }

    // Throttled scroll handler
    const throttledCheck = throttle(checkFooterVisibility, 100);

    window.addEventListener("scroll", throttledCheck, { passive: true });
    window.addEventListener("resize", throttledCheck);

    // Verificação inicial
    checkFooterVisibility();
  }

  // ===== SISTEMA DE BLUR DAS SEÇÕES =====
  function initSectionBlur() {
    if (!elements.sections.length) return;

    function handleSectionFocus() {
      const viewportCenter = window.innerHeight / 2;
      let closestSection = null;
      let minDistance = Infinity;

      elements.sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const sectionCenter = (rect.top + rect.bottom) / 2;
        const distance = Math.abs(viewportCenter - sectionCenter);

        if (distance < minDistance) {
          minDistance = distance;
          closestSection = section;
        }
      });

      // Atualizar seção ativa
      if (closestSection && closestSection !== AppState.lastActiveSection) {
        // Reproduzir som da seção usando AudioManager
        if (AppState.lastActiveSection !== null) {
          AudioManager.playSectionSound();
          console.log(
            `🔊 Som de seção reproduzido: ${closestSection.className}`
          );
        }

        AppState.lastActiveSection = closestSection;
        console.log(
          "📍 Seção ativa:",
          closestSection.className || closestSection.tagName
        );
      }

      // Aplicar classes ativas
      elements.sections.forEach((section) => {
        section.classList.toggle("active", section === closestSection);
      });

      // Blur temporário da UI
      if (elements.btnWrapper && elements.seloUI) {
        elements.btnWrapper.classList.add("ui--blur");
        elements.seloUI.classList.add("ui--blur");

        clearTimeout(AppState.uiBlurTimer);
        AppState.uiBlurTimer = setTimeout(() => {
          elements.btnWrapper.classList.remove("ui--blur");
          elements.seloUI.classList.remove("ui--blur");
        }, 2000);
      }
    }

    // Throttled scroll handler
    const throttledSectionHandler = throttle(handleSectionFocus, 150);

    window.addEventListener("scroll", throttledSectionHandler, {
      passive: true,
    });
    window.addEventListener("resize", throttledSectionHandler);

    // Verificação inicial
    handleSectionFocus();
  }

  // ===== SISTEMA DE SLIDER DE DEPOIMENTOS =====
  function initTestimonialsSlider() {
    if (!elements.sliderContainer) return;

    const testimonialSlides = Array.from(
      elements.sliderContainer.querySelectorAll(".slide.testimonial")
    );

    if (testimonialSlides.length === 0) return;

    // Configuração dos prints (screenshots)
    const printConfigs = [
      {
        position: 1,
        src: "imagens/print1.png",
        alt: "Print depoimento WhatsApp 1",
      },
      {
        position: 1,
        src: "imagens/print1a.png",
        alt: "Print depoimento WhatsApp 1A",
      },
      {
        position: 1,
        src: "imagens/print1b.png",
        alt: "Print depoimento WhatsApp 1B",
      },
      {
        position: 2,
        src: "imagens/print2.png",
        alt: "Print depoimento WhatsApp 2",
      },
      {
        position: 3,
        src: "imagens/print3.png",
        alt: "Print depoimento WhatsApp 3",
      },
      {
        position: 4,
        src: "imagens/print4.png",
        alt: "Print depoimento WhatsApp 4",
      },
    ];

    // Construir array final de slides
    const finalSlides = [];

    testimonialSlides.forEach((slide, index) => {
      finalSlides.push(slide);

      // Adicionar prints relacionados
      printConfigs
        .filter((config) => config.position === index + 1)
        .forEach((config) => {
          const printSlide = document.createElement("div");
          printSlide.classList.add("slide", "screenshot");
          printSlide.innerHTML = `
            <img src="${config.src}" alt="${config.alt}" loading="lazy" />
          `;
          finalSlides.push(printSlide);
        });
    });

    // Limpar container e adicionar slides finais
    elements.sliderContainer.innerHTML = "";
    finalSlides.forEach((slide) => elements.sliderContainer.appendChild(slide));

    // Atualizar referências
    const allSlides = Array.from(elements.sliderContainer.children);
    AppState.totalSlides = allSlides.length;
    AppState.currentSlideIndex = 0;

    function updateSlides() {
      allSlides.forEach((slide, index) => {
        slide.classList.toggle("active", index === AppState.currentSlideIndex);
      });
    }

    function nextSlide() {
      AppState.currentSlideIndex =
        (AppState.currentSlideIndex + 1) % AppState.totalSlides;
      updateSlides();
    }

    function prevSlide() {
      AppState.currentSlideIndex =
        (AppState.currentSlideIndex - 1 + AppState.totalSlides) %
        AppState.totalSlides;
      updateSlides();
    }

    // Event listeners para navegação
    if (elements.nextBtn) {
      elements.nextBtn.addEventListener("click", nextSlide);
    }

    if (elements.prevBtn) {
      elements.prevBtn.addEventListener("click", prevSlide);
    }

    // Configuração inicial
    updateSlides();
  }

  // ===== SISTEMA DE VISUALIZAÇÃO EM TELA CHEIA =====
  function initFullscreenViewer() {
    document.addEventListener("click", (event) => {
      const clickedPrint = event.target.closest(".slide.screenshot img");

      if (clickedPrint) {
        event.preventDefault();

        // Criar overlay
        const overlay = document.createElement("div");
        overlay.classList.add("print-fullscreen");

        const img = document.createElement("img");
        img.src = clickedPrint.src;
        img.alt = clickedPrint.alt;
        img.loading = "eager";

        overlay.appendChild(img);
        document.body.appendChild(overlay);

        // Fechar ao clicar
        overlay.addEventListener("click", () => {
          overlay.remove();
        });

        // Fechar com ESC
        const handleEscape = (e) => {
          if (e.key === "Escape") {
            overlay.remove();
            document.removeEventListener("keydown", handleEscape);
          }
        };

        document.addEventListener("keydown", handleEscape);
      }
    });

    // Fechar visualização ao rolar
    let scrollTimer;
    window.addEventListener(
      "scroll",
      () => {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
          const fullscreenViewer = document.querySelector(".print-fullscreen");
          if (fullscreenViewer) {
            fullscreenViewer.remove();
          }
        }, 100);
      },
      { passive: true }
    );
  }

  // ===== SISTEMA DE DOWNLOAD =====
  window.iniciarDownload = function () {
    // Simular processo de compra/download
    console.log("Iniciando processo de download...");

    // Aqui você integraria com:
    // - Gateway de pagamento
    // - Sistema de entrega
    // - Analytics de conversão

    // Por enquanto, apenas um alert
    alert("Funcionalidade de download será implementada com o backend!");

    // Tracking de clique no CTA
    if (typeof gtag !== "undefined") {
      gtag("event", "click", {
        event_category: "CTA",
        event_label: "Download Button",
        value: 23.97,
      });
    }
  };

  // ===== INICIALIZAÇÃO DE TODOS OS SISTEMAS =====
  function initializeApp() {
    try {
      console.log("🚀 Iniciando Landing Page com sistema de áudio avançado...");

      // Verificar elementos de áudio disponíveis
      console.log("🔍 Verificando elementos de áudio:");
      console.log("- bg-music:", elements.bgMusic ? "✅" : "❌");
      console.log("- tick-sound:", elements.tickSound ? "✅" : "❌");
      console.log("- section-sound:", elements.sectionSound ? "✅" : "❌");
      console.log("- audio-status:", elements.audioStatus ? "✅" : "❌");

      initCookieSystem();
      initAudioSystem();
      initTimer();
      initFomoNotifications();
      initButtonVisibility();
      initSectionBlur();
      initTestimonialsSlider();
      initFullscreenViewer();

      console.log("✅ Landing Page inicializada com sucesso!");
      console.log("🎵 Sistema de áudio avançado configurado:");
      console.log(
        "   1. 🎼 Música de fundo (bg-music) - Loop contínuo após cookies"
      );
      console.log(
        "   2. 🔔 Som de tick (tick-sound) - A cada segundo do timer"
      );
      console.log("   3. 🌊 Som de seção (section-sound) - Ao trocar de seção");
      console.log("   4. 📊 Indicador de status visual");
      console.log("   5. 🔧 Gerenciamento centralizado via AudioManager");
    } catch (error) {
      console.error("❌ Erro na inicialização:", error);
    }
  }

  // Inicializar aplicação
  initializeApp();

  // ===== CLEANUP AO SAIR DA PÁGINA =====
  window.addEventListener("beforeunload", () => {
    console.log("🧹 Limpando recursos...");

    // Limpar timers
    if (AppState.timerInterval) {
      clearInterval(AppState.timerInterval);
      console.log("⏰ Timer limpo");
    }

    if (AppState.uiBlurTimer) {
      clearTimeout(AppState.uiBlurTimer);
    }

    // Parar todos os áudios via AudioManager
    AudioManager.stopAll();
  });

  // ===== SISTEMA DE DEBUG AVANÇADO =====
  window.debugAudio = function () {
    console.log("🔍 DEBUG AVANÇADO DO SISTEMA DE ÁUDIO:");
    console.log("=========================================");

    const debugInfo = AudioManager.getDebugInfo();
    console.log("📊 Estado do AudioManager:", debugInfo.state);
    console.log("🎵 Elementos encontrados:", debugInfo.elements);
    console.log("📡 Ready States:", debugInfo.readyStates);

    console.log("\n🎼 DETALHES DOS ÁUDIOS:");

    const audios = [
      { name: "Música de Fundo", element: elements.bgMusic, id: "bg-music" },
      { name: "Som de Tick", element: elements.tickSound, id: "tick-sound" },
      {
        name: "Som de Seção",
        element: elements.sectionSound,
        id: "section-sound",
      },
    ];

    audios.forEach(({ name, element, id }) => {
      console.log(`\n🎵 ${name} (${id}):`);
      if (element) {
        console.log(`   - Elemento: ✅`);
        console.log(`   - Ready State: ${element.readyState}/4`);
        console.log(`   - Network State: ${element.networkState}/3`);
        console.log(
          `   - Pode reproduzir: ${element.readyState >= 2 ? "✅" : "❌"}`
        );
        console.log(
          `   - Carregado completamente: ${
            element.readyState === 4 ? "✅" : "❌"
          }`
        );
        console.log(`   - Mudo: ${element.muted ? "🔇" : "🔊"}`);
        console.log(`   - Volume: ${(element.volume * 100).toFixed(0)}%`);
        console.log(
          `   - Duração: ${
            element.duration ? element.duration.toFixed(2) + "s" : "N/A"
          }`
        );
        console.log(`   - Posição atual: ${element.currentTime.toFixed(2)}s`);
        console.log(`   - Pausado: ${element.paused ? "⏸️" : "▶️"}`);
        console.log(`   - Loop: ${element.loop ? "🔄" : "➡️"}`);
        console.log(`   - Src: ${element.currentSrc || element.src || "N/A"}`);

        if (element.error) {
          console.log(
            `   - ERRO: ${element.error.message} (código: ${element.error.code})`
          );
        }
      } else {
        console.log(`   - Elemento: ❌ NÃO ENCONTRADO`);
      }
    });

    console.log("\n🔧 COMANDOS DISPONÍVEIS:");
    console.log("- AudioManager.startBackgroundMusic() - Iniciar música");
    console.log("- AudioManager.toggleMute() - Alternar mute");
    console.log("- AudioManager.playTickSound() - Testar tick");
    console.log("- AudioManager.playSectionSound() - Testar seção");
    console.log("- AudioManager.stopAll() - Parar tudo");
    console.log("=========================================");

    return debugInfo;
  };

  // ===== COMANDOS DE TESTE =====
  window.testAudio = {
    playBgMusic: () => AudioManager.startBackgroundMusic(),
    playTick: () => AudioManager.playTickSound(),
    playSection: () => AudioManager.playSectionSound(),
    toggleMute: () => AudioManager.toggleMute(),
    stopAll: () => AudioManager.stopAll(),
    getState: () => AudioManager.getDebugInfo(),
  };

  // Disponibilizar ferramentas no console
  console.log("💡 FERRAMENTAS DE DEBUG DISPONÍVEIS:");
  console.log("- debugAudio() - Análise completa do sistema");
  console.log("- testAudio.playBgMusic() - Testar música de fundo");
  console.log("- testAudio.playTick() - Testar som de tick");
  console.log("- testAudio.playSection() - Testar som de seção");
  console.log("- testAudio.toggleMute() - Alternar mute");
  console.log("- testAudio.stopAll() - Parar todos os áudios");
});
